/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto'
import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'

type TranscriptEntry = {
  readonly role: 'agent' | 'user'
  readonly message: string
  readonly time_in_call_secs: number
  readonly tool_calls: any | null
  readonly tool_results: any | null
  readonly feedback: any | null
  readonly conversation_turn_metrics: any | null
}

type WebhookPayload = {
  readonly type: 'post_call_transcription'
  readonly event_timestamp: number
  readonly data: {
    readonly agent_id: string
    readonly conversation_id: string
    readonly status: string
    readonly transcript: TranscriptEntry[]
    readonly metadata: {
      readonly start_time_unix_secs: number
      readonly call_duration_secs: number
      readonly cost: number
      readonly deletion_settings: {
        readonly deletion_time_unix_secs: number
        readonly deleted_logs_at_time_unix_secs: null | number
        readonly deleted_audio_at_time_unix_secs: null | number
        readonly deleted_transcript_at_time_unix_secs: null | number
        readonly delete_transcript_and_pii: boolean
        readonly delete_audio: boolean
      }
      readonly feedback: {
        readonly overall_score: null | number
        readonly likes: number
        readonly dislikes: number
      }
    }
    readonly analysis: {
      readonly evaluation_criteria_results: Record<string, any>
      readonly data_collection_results: Record<string, any>
      readonly call_successful: 'success' | 'failure'
      readonly transcript_summary: string
    }
  }
}

// Langflow API types
interface LangflowApiPayload {
  readonly input_value: string
  readonly output_type: 'chat'
  readonly input_type: 'chat'
  readonly session_id: string
}

interface LangflowMessageContent {
  readonly message: string
  readonly sender: string
  readonly sender_name: string
  readonly session_id: string
  readonly type: string
}

interface LangflowMessageResult {
  readonly text: string
  readonly data?: Record<string, unknown>
}

interface LangflowOutputResult {
  readonly message?: LangflowMessageResult
  readonly [key: string]: unknown
}

interface LangflowOutputItem {
  readonly results?: LangflowOutputResult
  readonly artifacts?: {
    readonly message?: string
    readonly [key: string]: unknown
  }
  readonly outputs?: {
    readonly message?: {
      readonly message: string
      readonly type: string
    }
    readonly [key: string]: unknown
  }
  readonly messages?: readonly {
    readonly message: string
    readonly [key: string]: unknown
  }[]
  readonly [key: string]: unknown
}

interface LangflowOutput {
  readonly outputs?: readonly Record<string, unknown>[]
  readonly messages?: readonly LangflowMessageContent[]
  readonly [key: string]: unknown
}

interface LangflowApiResponse {
  readonly session_id: string
  readonly outputs: readonly LangflowOutput[]
}

let webhookData: WebhookPayload[] = []

const extractLangflowMessage = (response: unknown): string | null => {
  try {
    const typedResponse = response as LangflowApiResponse

    console.log('=== ATTEMPTING MESSAGE EXTRACTION ===')

    // Try to extract from multiple possible paths in the response
    const firstOutput = typedResponse.outputs?.[0] as Record<string, unknown>

    if (!firstOutput) {
      console.log('❌ No first output found')
      return null
    }

    console.log('First output keys:', Object.keys(firstOutput))

    // Path 1: outputs[0].outputs[0].message.message
    const nestedOutputs = firstOutput.outputs as
      | Record<string, unknown>[]
      | undefined
    if (
      nestedOutputs?.[0]?.message &&
      typeof (nestedOutputs[0].message as Record<string, unknown>).message ===
        'string'
    ) {
      console.log(
        '✅ Found message via Path 1: outputs[0].outputs[0].message.message',
      )
      return (nestedOutputs[0].message as Record<string, unknown>)
        .message as string
    }

    // Path 2: outputs[0].messages[0].message
    const messages = firstOutput.messages as
      | Record<string, unknown>[]
      | undefined
    if (messages?.[0]?.message && typeof messages[0].message === 'string') {
      console.log('✅ Found message via Path 2: outputs[0].messages[0].message')
      return messages[0].message as string
    }

    // Path 3: outputs[0].outputs[0].results.message.text (new structure)
    if (nestedOutputs?.[0]?.results) {
      const results = nestedOutputs[0].results as Record<string, unknown>
      if (
        results.message &&
        typeof (results.message as Record<string, unknown>).text === 'string'
      ) {
        console.log(
          '✅ Found message via Path 3: outputs[0].outputs[0].results.message.text',
        )
        return (results.message as Record<string, unknown>).text as string
      }
    }

    // Path 4: outputs[0].outputs[0].outputs.message.message (another possible structure)
    if (nestedOutputs?.[0]?.outputs) {
      const nestedNestedOutputs = nestedOutputs[0].outputs as Record<
        string,
        unknown
      >
      if (
        nestedNestedOutputs.message &&
        typeof (nestedNestedOutputs.message as Record<string, unknown>)
          .message === 'string'
      ) {
        console.log(
          '✅ Found message via Path 4: outputs[0].outputs[0].outputs.message.message',
        )
        return (nestedNestedOutputs.message as Record<string, unknown>)
          .message as string
      }
    }

    // Path 5: Direct text in artifacts (as seen in the example)
    const artifacts = firstOutput.artifacts as
      | Record<string, unknown>
      | undefined
    if (artifacts?.message && typeof artifacts.message === 'string') {
      console.log('✅ Found message via Path 5: artifacts.message')
      return artifacts.message
    }

    // Path 6: Check outputs[0].outputs[0].artifacts.message
    if (nestedOutputs?.[0]?.artifacts) {
      const nestedArtifacts = nestedOutputs[0].artifacts as Record<
        string,
        unknown
      >
      if (
        nestedArtifacts.message &&
        typeof nestedArtifacts.message === 'string'
      ) {
        console.log(
          '✅ Found message via Path 6: outputs[0].outputs[0].artifacts.message',
        )
        return nestedArtifacts.message
      }
    }

    console.log('❌ No message found in any expected path')
    console.log('Available paths in response:')
    console.log('- outputs length:', typedResponse.outputs?.length)
    console.log('- first output keys:', Object.keys(firstOutput))
    if (nestedOutputs?.[0]) {
      console.log(
        '- first output.outputs[0] keys:',
        Object.keys(nestedOutputs[0]),
      )
    }

    return null
  } catch (error) {
    console.error('Error extracting message from Langflow response:', error)
    return null
  }
}

const formatLangflowOutput = (message: string): string => {
  // Clean up the message and make it more readable
  return message
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold formatting
    .replace(/- /g, '• ') // Replace dashes with bullet points
    .trim()
}

const formatTranscript = (transcript: TranscriptEntry[]): string => {
  return transcript
    .map(entry => {
      // Capitalize the role and add a colon
      const speaker = entry.role === 'agent' ? 'Agent' : 'User'
      return `${speaker}: ${entry.message}`
    })
    .join('\n\n')
}

const sendToLangflowApi = async (
  transcript: string,
  conversationId: string,
): Promise<{
  success: boolean
  response?: unknown
  error?: string
  extractedMessage?: string
}> => {
  try {
    const apiUrl = process.env.LANGFLOW_API_URL

    if (!apiUrl) {
      throw new Error('LANGFLOW_API_URL environment variable not configured')
    }

    // Generate a unique session ID to avoid caching issues
    const uniqueSessionId = `${conversationId}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`

    console.log('Transcript:', transcript)

    const payload: LangflowApiPayload = {
      input_value: transcript,
      output_type: 'chat',
      input_type: 'chat',
      session_id: uniqueSessionId,
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }

    console.log('Sending transcript to Langflow API...')
    console.log('API URL:', apiUrl)
    console.log('=== TRANSCRIPT BEING SENT ===')
    console.log('Transcript length:', transcript.length)
    console.log(
      'Transcript preview (first 200 chars):',
      transcript.substring(0, 200),
    )
    console.log('Full transcript:', transcript)
    console.log('=== END TRANSCRIPT ===')
    console.log('Session ID:', uniqueSessionId)
    console.log('Full payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(apiUrl, options)

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`)
    }

    const responseData = await response.json()

    console.log('=== LANGFLOW API RESPONSE ===')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('=== END API RESPONSE ===')

    // Extract the formatted message
    const extractedMessage = extractLangflowMessage(responseData)

    if (extractedMessage) {
      const formattedMessage = formatLangflowOutput(extractedMessage)
      console.log('\n=== EXTRACTED LANGFLOW MESSAGE ===')
      console.log(formattedMessage)
      console.log('=== END EXTRACTED MESSAGE ===\n')

      return {
        success: true,
        response: responseData,
        extractedMessage: formattedMessage,
      }
    }

    return {
      success: true,
      response: responseData,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to send transcript to Langflow API:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

const processPostCallTranscription = async (
  payload: WebhookPayload,
): Promise<{
  success: boolean
  langflowResponse?: unknown
  error?: string
  extractedMessage?: string
}> => {
  const {data} = payload

  console.log('=== POST CALL TRANSCRIPTION RECEIVED ===')
  console.log(`Agent ID: ${data.agent_id}`)
  console.log(`Conversation ID: ${data.conversation_id}`)
  console.log(`Status: ${data.status}`)
  console.log(
    `Event Timestamp: ${new Date(
      payload.event_timestamp * 1000,
    ).toISOString()}`,
  )

  if (data.transcript && data.transcript.length > 0) {
    console.log('\n=== FORMATTED TRANSCRIPT ===')
    const formattedTranscript = formatTranscript(data.transcript)
    console.log(formattedTranscript)

    console.log('\n=== TRANSCRIPT METADATA ===')
    console.log(`Total turns: ${data.transcript.length}`)
    console.log(`Call duration: ${data.metadata.call_duration_secs} seconds`)

    if (data.analysis?.transcript_summary) {
      console.log('\n=== TRANSCRIPT SUMMARY ===')
      console.log(data.analysis.transcript_summary)
    }

    // Send transcript to Langflow API
    console.log('\n=== SENDING TO LANGFLOW API ===')
    const apiResult = await sendToLangflowApi(
      formattedTranscript,
      data.conversation_id,
    )

    if (apiResult.success) {
      console.log('✅ Successfully sent transcript to Langflow API')

      if (apiResult.extractedMessage) {
        console.log('✅ Successfully extracted formatted message')
      }
    } else {
      console.log(
        '❌ Failed to send transcript to Langflow API:',
        apiResult.error,
      )
    }

    console.log('=== END TRANSCRIPTION PROCESSING ===\n')

    return {
      ...apiResult,
      langflowResponse: apiResult.response,
    }
  } else {
    console.log('No transcript data available')
    console.log('=== END TRANSCRIPTION PROCESSING ===\n')

    return {
      success: false,
      error: 'No transcript data available',
    }
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'webhook listening',
      recent_calls: webhookData.slice(-10), // Return last 10 calls
      langflow_integration: 'enabled',
      endpoint: '/api/elevenlabs-webhook',
      methods: ['GET', 'POST'],
      supported_types: ['post_call_transcription'],
    },
    {status: 200},
  )
}

export async function POST(req: NextRequest) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET
  const {event, error} = await constructWebhookEvent(req, secret)

  if (error) {
    return NextResponse.json({error: error}, {status: 401})
  }

  if (event.type === 'post_call_transcription') {
    // Store the webhook data
    webhookData.push(event)

    // Keep only last 50 entries to prevent memory issues
    if (webhookData.length > 50) {
      webhookData = webhookData.slice(-50)
    }

    const {conversation_id, transcript, analysis} = event.data

    console.log('📞 New Call Completed!')
    console.log('Conversation ID:', conversation_id)
    console.log('Transcript entries:', transcript.length)
    console.log('Call successful:', analysis.call_successful)

    // Process transcript with Langflow API
    const processingResult = await processPostCallTranscription(event)

    return NextResponse.json(
      {
        received: true,
        conversation_id,
        status: 'processed',
        langflow_api: {
          success: processingResult.success,
          error: processingResult.error,
          response_received: !!processingResult.langflowResponse,
          extracted_message: processingResult.extractedMessage || null,
          message_length: processingResult.extractedMessage?.length || 0,
        },
        received_at: new Date().toISOString(),
      },
      {status: 200},
    )
  }

  return NextResponse.json({received: true}, {status: 200})
}

const constructWebhookEvent = async (req: NextRequest, secret?: string) => {
  const body = await req.text()
  const signatureHeader = req.headers.get('ElevenLabs-Signature')

  if (!signatureHeader) {
    return {event: null, error: 'Missing signature header'}
  }

  const headers = signatureHeader.split(',')
  const timestamp = headers.find(e => e.startsWith('t='))?.substring(2)
  const signature = headers.find(e => e.startsWith('v0='))

  if (!timestamp || !signature) {
    return {event: null, error: 'Invalid signature format'}
  }

  // Validate timestamp
  const reqTimestamp = Number(timestamp) * 1000
  const tolerance = Date.now() - 30 * 60 * 1000
  if (reqTimestamp < tolerance) {
    return {event: null, error: 'Request expired'}
  }

  // Validate hash
  const message = `${timestamp}.${body}`
  if (!secret) {
    return {event: null, error: 'Webhook secret not configured'}
  }

  const digest =
    'v0=' + crypto.createHmac('sha256', secret).update(message).digest('hex')
  if (signature !== digest) {
    return {event: null, error: 'Invalid signature'}
  }

  const event = JSON.parse(body)
  return {event, error: null}
}
