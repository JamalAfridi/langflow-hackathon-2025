"use client";

import Script from "next/script";

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": {
        "agent-id": string;
      };
    }
  }
}

interface ElevenLabsConvAIProps {
  agentId: string;
}

export default function ElevenLabsConvAI({ agentId }: ElevenLabsConvAIProps) {
  return (
    <>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        async
      />
      <div
        dangerouslySetInnerHTML={{
          __html: `<elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>`,
        }}
      />
    </>
  );
}
