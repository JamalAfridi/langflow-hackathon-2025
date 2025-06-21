import { NextRequest, NextResponse } from 'next/server';

const LANGFLOW_SERVER = process.env.LANGFLOW_SERVER_ADDRESS!;
const FLOW_ID         = process.env.LANGFLOW_FLOW_ID!;

export async function POST(request: NextRequest) {
    try {
        const {transcript} = await request.json() as {transcript: string};

    const payload = {
        "output_type": "chat",
        "input_type": "chat",
        "input_value": transcript,
        session_id:  `summarize_${Date.now()}`
    };

    const resp = await fetch(
        `${LANGFLOW_SERVER}/api/v1/run/${FLOW_ID}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        }
      );

      if (!resp.ok) {
        const err = await resp.text();
        console.error('LangFlow error:', err);
        return NextResponse.json({ error: 'Failed to summarize' }, { status: 502 });
      }
    
      // 4. Extract the AI’s message text from the nested outputs array :contentReference[oaicite:4]{index=4}
    const result = await resp.json();
    const aiMessage =
      // According to example response: outputs[0].outputs[0].outputs.message.message
      result.outputs?.[0]?.outputs?.[0]?.outputs?.message?.message
      ?? result.outputs?.[0]?.artifacts?.message
      ?? '';

      if (!aiMessage) {
        console.warn('Langflow run succeeded but no message found', result);
        return NextResponse.json({ error: 'No summary generated' }, { status: 500 });
      }
  
      // 5. Return summary to front-end
      return NextResponse.json({ summary: aiMessage.trim() });
    } catch (e) {
        console.error('Unexpected error in /api/summarize:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    
    
      
}