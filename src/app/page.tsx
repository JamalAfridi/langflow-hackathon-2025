import Image from "next/image";
import ElevenLabsConvAI from "./components/ElevenLabsConvAI";
import WebhookDashboard from "./components/WebhookDashboard";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Top Section */}
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen gap-16">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          
    
          {/* ElevenLabs ConvAI Voice Agent */}
          <div className="mt-8 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-center">
              🎤 Voice Agent
            </h2>
            <ElevenLabsConvAI agentId="agent_01jy7kfmaaed8v0pyjf7enekqe" />
          </div>
        </main>
        
      </div>

      {/* Webhook Dashboard Section */}
      <div className="mt-16 max-w-6xl mx-auto">
        <WebhookDashboard />
      </div>
    </div>
  );
}
