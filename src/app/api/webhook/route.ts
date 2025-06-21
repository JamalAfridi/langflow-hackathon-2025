import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

type TranscriptEntry = {
  role: "agent" | "user";
  message: string;
  time_in_call_secs: number;
  tool_calls: any | null;
  tool_results: any | null;
  feedback: any | null;
  conversation_turn_metrics: any | null;
};

type WebhookPayload = {
  type: "post_call_transcription";
  event_timestamp: number;
  data: {
    agent_id: string;
    conversation_id: string;
    status: string;
    transcript: TranscriptEntry[];
    metadata: {
      start_time_unix_secs: number;
      call_duration_secs: number;
      cost: number;
      deletion_settings: {
        deletion_time_unix_secs: number;
        deleted_logs_at_time_unix_secs: null | number;
        deleted_audio_at_time_unix_secs: null | number;
        deleted_transcript_at_time_unix_secs: null | number;
        delete_transcript_and_pii: boolean;
        delete_audio: boolean;
      };
      feedback: {
        overall_score: null | number;
        likes: number;
        dislikes: number;
      };
    };
    analysis: {
      evaluation_criteria_results: Record<string, any>;
      data_collection_results: Record<string, any>;
      call_successful: "success" | "failure";
      transcript_summary: string;
    };
  };
};

let webhookData: WebhookPayload[] = [];

export async function GET() {
  return NextResponse.json(
    {
      status: "webhook listening",
      recent_calls: webhookData.slice(-10), // Return last 10 calls
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const secret =
    process.env.ELEVENLABS_WEBHOOK_SECRET;
  const { event, error } = await constructWebhookEvent(req, secret);

  if (error) {
    return NextResponse.json({ error: error }, { status: 401 });
  }

  if (event.type === "post_call_transcription") {
    // Store the webhook data
    webhookData.push(event);

    // Keep only last 50 entries to prevent memory issues
    if (webhookData.length > 50) {
      webhookData = webhookData.slice(-50);
    }

    const { conversation_id, transcript, analysis } = event.data;

    console.log("📞 New Call Completed!");
    console.log("Conversation ID:", conversation_id);
    console.log("Transcript entries:", transcript.length);
    console.log("Call successful:", analysis.call_successful);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

const constructWebhookEvent = async (req: NextRequest, secret?: string) => {
  const body = await req.text();
  const signatureHeader = req.headers.get("ElevenLabs-Signature");

  if (!signatureHeader) {
    return { event: null, error: "Missing signature header" };
  }

  const headers = signatureHeader.split(",");
  const timestamp = headers.find((e) => e.startsWith("t="))?.substring(2);
  const signature = headers.find((e) => e.startsWith("v0="));

  if (!timestamp || !signature) {
    return { event: null, error: "Invalid signature format" };
  }

  // Validate timestamp
  const reqTimestamp = Number(timestamp) * 1000;
  const tolerance = Date.now() - 30 * 60 * 1000;
  if (reqTimestamp < tolerance) {
    return { event: null, error: "Request expired" };
  }

  // Validate hash
  const message = `${timestamp}.${body}`;
  if (!secret) {
    return { event: null, error: "Webhook secret not configured" };
  }

  const digest =
    "v0=" + crypto.createHmac("sha256", secret).update(message).digest("hex");
  if (signature !== digest) {
    return { event: null, error: "Invalid signature" };
  }

  const event = JSON.parse(body);
  return { event, error: null };
};
