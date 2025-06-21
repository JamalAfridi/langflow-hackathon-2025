import {cookies} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'

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

interface LangflowOutput {
  readonly outputs?: readonly Record<string, unknown>[]
  readonly messages?: readonly LangflowMessageContent[]
  readonly [key: string]: unknown
}

interface LangflowApiResponse {
  readonly session_id: string
  readonly outputs: readonly LangflowOutput[]
}

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

export async function POST(req: NextRequest) {
  const {transcript} = (await req.json()) as {
    transcript: {role: 'user' | 'ai'; message: string}[]
  }

  const cookieStore = await cookies()
  console.log('Available cookies:', cookieStore.getAll())

  const summaryText = transcript
    .map(t => `${t.role === 'user' ? 'Child' : 'Dr Wobble'}: ${t.message}`)
    .join('\n')

  console.log('=== CONVERSATION TRANSCRIPT RECEIVED ===')
  console.log('Transcript entries:', transcript.length)
  console.log('Formatted transcript:')
  console.log(summaryText)

  // Generate a conversation ID for this session
  const conversationId = `conversation-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`

  // Send transcript to Langflow API
  console.log('\n=== SENDING TO LANGFLOW API ===')
  const apiResult = await sendToLangflowApi(summaryText, conversationId)

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

  console.log('=== END CONVERSATION PROCESSING ===\n')

  return NextResponse.json({
    stored: true,
    conversation_id: conversationId,
    langflow_api: {
      success: apiResult.success,
      error: apiResult.error,
      response_received: !!apiResult.response,
      extracted_message: apiResult.extractedMessage || null,
      message_length: apiResult.extractedMessage?.length || 0,
    },
    received_at: new Date().toISOString(),
  })
}
