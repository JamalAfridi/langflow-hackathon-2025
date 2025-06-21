import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Replace this URL with your actual server endpoint
    const FORWARD_SERVER_URL =
      process.env.FORWARD_SERVER_URL ||
      "https://your-server.com/api/transcripts";

    // Forward the transcript data to your server
    const response = await fetch(FORWARD_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any authentication headers if needed
        Authorization: process.env.FORWARD_SERVER_AUTH_TOKEN
          ? `Bearer ${process.env.FORWARD_SERVER_AUTH_TOKEN}`
          : "",
      },
      body: JSON.stringify({
        conversation_id: body.conversation_id,
        transcript: body.transcript,
        analysis: body.analysis,
        metadata: body.metadata,
        forwarded_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to forward transcript: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json().catch(() => ({}));

    console.log(
      `✅ Successfully forwarded transcript for conversation: ${body.conversation_id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Transcript forwarded successfully",
        conversation_id: body.conversation_id,
        server_response: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Failed to forward transcript:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
