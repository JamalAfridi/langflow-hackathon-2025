// app/components/Conversation.tsx
'use client'
import {Button} from '@/components/ui/button'
import {useAuth} from '@/contexts/AuthContext'
import {supabase} from '@/integrations/supabase/client'
import {useConversation} from '@elevenlabs/react'
import {forwardRef, useCallback, useImperativeHandle, useRef} from 'react'

interface ConversationMessage {
  readonly role: 'user' | 'ai'
  readonly message: string
}

interface ElevenLabsMessage {
  readonly source: 'agent' | 'user'
  readonly message: string
}

export interface ConversationHandle {
  start: () => Promise<void>
  stop: () => Promise<void>
  setVolume: (volume: number) => Promise<void>
  status: string
  isSpeaking: boolean
}

const ConversationComponent = forwardRef<ConversationHandle>((_, ref) => {
  const {user} = useAuth()
  const buffer = useRef<ConversationMessage[]>([])
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: async () => {
      console.log('Disconnected')
      // when disconnected, send the buffer to the server
      console.log('Sending buffer to server:', buffer.current)
      // if there are messages in the buffer, send them to the server
      if (buffer.current.length > 0) {
        const summaryText = buffer.current
          .map(
            t =>
              // use backticks around the whole string so ${…} works
              `${t.role === 'user' ? 'Child' : 'Dr Wobble'}: ${t.message}`,
          )
          .join('\n')
        console.log('Summary text:', summaryText)

        try {
          const {
            data: {session},
          } = await supabase.auth.getSession()
          await fetch('/api/conversation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              transcript: buffer.current, // send whole array
            }),
          })
          buffer.current = [] // reset for next call
        } catch (error) {
          console.error('Failed to save conversation:', error)
        }
      }
    },
    onMessage: (msg: ElevenLabsMessage) => {
      // Map ElevenLabs message source to our buffer role
      // ElevenLabs uses 'agent' and 'user', we use 'ai' and 'user'
      const role = msg.source === 'agent' ? 'ai' : 'user'
      buffer.current.push({role, message: msg.message})
    },
    onError: err => console.error('Error', err),
  })

  // ---- start / stop impl ---------------------------------------------------
  const start = useCallback(async () => {
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({audio: true})

      const agentId =
        process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ||
        'agent_01jy85t07ae65tgp6wbz25dwye'

      if (!agentId) {
        throw new Error('Agent ID is required but not configured')
      }

      await conversation.startSession({agentId})
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          console.error('Microphone access denied by user')
        } else if (err.name === 'NotFoundError') {
          console.error('No microphone found on device')
        } else {
          console.error('Microphone access error:', err.message)
        }
      } else {
        console.error('Failed to start conversation:', err)
      }
      throw err // Re-throw so parent components can handle it
    }
  }, [conversation])

  const stop = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  const setVolume = useCallback(
    async (volume: number) => {
      // Clamp volume between 0 and 1
      const clampedVolume = Math.max(0, Math.min(1, volume))
      await conversation.setVolume({volume: clampedVolume})
    },
    [conversation],
  )

  // ---- expose methods to parent -------------------------------------------
  useImperativeHandle(
    ref,
    () => ({
      start,
      stop,
      setVolume,
      get status() {
        return conversation.status
      },
      get isSpeaking() {
        return conversation.isSpeaking
      },
    }),
    [start, stop, setVolume, conversation.status, conversation.isSpeaking],
  )

  // ---- (optional) hide internal UI if you don't need it --------------------
  // return null;

  return (
    <div className=" flex-col items-center gap-4 hidden">
      <div>Status: {conversation.status}</div>
      <div>Speaking: {conversation.isSpeaking ? 'Yes' : 'No'}</div>
      <div className="flex gap-4">
        <Button onClick={start} disabled={conversation.status === 'connected'}>
          Start
        </Button>
        <Button onClick={stop} disabled={conversation.status !== 'connected'}>
          Stop
        </Button>
      </div>
    </div>
  )
})

ConversationComponent.displayName = 'ConversationComponent'
export default ConversationComponent
