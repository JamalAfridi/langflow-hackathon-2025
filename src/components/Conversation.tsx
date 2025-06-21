// app/components/Conversation.tsx
'use client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useConversation } from '@elevenlabs/react';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  useRef,
} from 'react';

export interface ConversationHandle {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  status: string;
  isSpeaking: boolean;
}

const ConversationComponent = forwardRef<ConversationHandle>((_, ref) => {
  const {user} = useAuth();
  const buffer = useRef<{ role: 'user' | 'ai'; message: string }[]>([]);
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: async () => {
      console.log("DIsconnected");
      // when disconnected, send the buffer to the server
      console.log('Sending buffer to server:', buffer.current);
      // if there are messages in the buffer, send them to the server
      if (buffer.current.length ) {
        const summaryText = buffer.current
        .map(t => 
          // use backticks around the whole string so ${…} works
          `${t.role === 'user' ? 'Child' : 'Dr Wobble'}: ${t.message}`
        )
        .join('\n');
        console.log('Summary text:', summaryText);
        // const { data: { session } } = await supabase.auth.getSession();
        // await fetch('/api/conversation', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${session?.access_token}`,
        //   },
        //   body: JSON.stringify({
        //     transcript: buffer.current        // send whole array
        //   }),
        // });
        // buffer.current = []; // reset for next call
      }
    },
    onMessage: (msg) => {
      // push every turn to the buffer
      buffer.current.push({ role: msg.source as 'user' | 'ai', message: msg.message });

    },
    onError: (err) => console.error('Error', err),
  });

  // ---- start / stop impl ---------------------------------------------------
  const start = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId: 'agent_01jy85t07ae65tgp6wbz25dwye' });
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // ---- expose methods to parent -------------------------------------------
  useImperativeHandle(
    ref,
    () => ({
      start,
      stop,
      get status() {
        return conversation.status;
      },
      get isSpeaking() {
        return conversation.isSpeaking;
      },
    }),
    [start, stop, conversation.status, conversation.isSpeaking],
  );

  // ---- (optional) hide internal UI if you don’t need it --------------------
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
  );
});

ConversationComponent.displayName = 'ConversationComponent';
export default ConversationComponent;