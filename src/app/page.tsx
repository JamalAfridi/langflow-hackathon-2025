import Image from "next/image";
import ElevenLabsConvAI from "./components/ElevenLabsConvAI";
import WebhookDashboard from "./components/WebhookDashboard";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
      {/* Voice Agent Section */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          🎤 Voice Agent
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Start a conversation with our AI voice agent
        </p>
        <div className="max-w-2xl mx-auto">
          <ElevenLabsConvAI agentId="agent_01jy7kfmaaed8v0pyjf7enekqe" />
        </div>
      </div>

      {/* Webhook Dashboard Section */}
      <div className="max-w-6xl mx-auto">
        <WebhookDashboard />
      </div>
    </div>
  );
}
