"use client";

import { useState, useEffect } from "react";

type TranscriptEntry = {
  role: "agent" | "user";
  message: string;
  time_in_call_secs: number;
  tool_calls: any | null;
  tool_results: any | null;
  feedback: any | null;
  conversation_turn_metrics: any | null;
};

type WebhookData = {
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
      deletion_settings: any;
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

export default function WebhookDashboard() {
  const [webhookData, setWebhookData] = useState<WebhookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [forwardingStatus, setForwardingStatus] = useState<{
    [key: string]: "idle" | "sending" | "sent" | "error";
  }>({});

  const fetchWebhookData = async () => {
    try {
      const response = await fetch("/api/webhook");
      const data = await response.json();
      if (data.recent_calls) {
        setWebhookData(data.recent_calls);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch webhook data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const forwardTranscript = async (callData: WebhookData) => {
    const conversationId = callData.data.conversation_id;
    setForwardingStatus((prev) => ({ ...prev, [conversationId]: "sending" }));

    try {
      // Replace with your actual server endpoint
      const response = await fetch("/api/forward-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          transcript: callData.data.transcript,
          analysis: callData.data.analysis,
          metadata: callData.data.metadata,
        }),
      });

      if (response.ok) {
        setForwardingStatus((prev) => ({ ...prev, [conversationId]: "sent" }));
        setTimeout(() => {
          setForwardingStatus((prev) => ({
            ...prev,
            [conversationId]: "idle",
          }));
        }, 3000);
      } else {
        throw new Error("Failed to forward");
      }
    } catch (error) {
      console.error("Failed to forward transcript:", error);
      setForwardingStatus((prev) => ({ ...prev, [conversationId]: "error" }));
      setTimeout(() => {
        setForwardingStatus((prev) => ({ ...prev, [conversationId]: "idle" }));
      }, 3000);
    }
  };

  useEffect(() => {
    fetchWebhookData();
    const interval = setInterval(fetchWebhookData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl h-32"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-96"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Simple Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          💬 Conversation History
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Recent conversations with the AI agent
        </p>
        {lastUpdate && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()} •{" "}
            {webhookData.length} conversations
          </p>
        )}
      </div>

      {/* Conversations List */}
      {webhookData.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="text-6xl mb-6">🎤</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            No Conversations Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Start a conversation with the voice agent to see it here!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {webhookData
            .slice()
            .reverse()
            .map((call, index) => {
              const conversationId = call.data.conversation_id;
              const forwardStatus = forwardingStatus[conversationId] || "idle";

              return (
                <div
                  key={conversationId}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
                >
                  {/* Call Header */}
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            call.data.analysis.call_successful === "success"
                              ? "bg-green-500"
                              : "bg-red-500"
                          } shadow-lg`}
                        ></div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            Conversation #{webhookData.length - index}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {formatTimestamp(
                              call.data.metadata.start_time_unix_secs
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {formatDuration(
                              call.data.metadata.call_duration_secs
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {call.data.transcript.length} messages •{" "}
                            {formatCost(call.data.metadata.cost)}
                          </div>
                        </div>
                        <button
                          onClick={() => forwardTranscript(call)}
                          disabled={forwardStatus === "sending"}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            forwardStatus === "sent"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : forwardStatus === "error"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : forwardStatus === "sending"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                          }`}
                        >
                          {forwardStatus === "sending"
                            ? "📤 Sending..."
                            : forwardStatus === "sent"
                            ? "✅ Sent"
                            : forwardStatus === "error"
                            ? "❌ Error"
                            : "📤 Forward"}
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    {call.data.analysis.transcript_summary && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500 mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                          <span className="mr-2">📋</span> Summary
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {call.data.analysis.transcript_summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Full Conversation - Always Visible */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {call.data.transcript.map((entry, entryIndex) => (
                        <div
                          key={entryIndex}
                          className={`flex ${
                            entry.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-4xl px-6 py-4 rounded-2xl shadow-sm ${
                              entry.role === "user"
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold">
                                  {entry.role === "user"
                                    ? "👤 You"
                                    : "🤖 AI Agent"}
                                </span>
                                <span className="text-xs opacity-60">
                                  {formatDuration(entry.time_in_call_secs)}
                                </span>
                              </div>
                            </div>
                            <p className="text-base leading-relaxed whitespace-pre-wrap">
                              {entry.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats Footer */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-6">
                        <span>
                          📊{" "}
                          {call.data.analysis.call_successful === "success"
                            ? "Successful"
                            : "Failed"}
                        </span>
                        <span>
                          👍 {call.data.metadata.feedback.likes} likes
                        </span>
                        <span>
                          👎 {call.data.metadata.feedback.dislikes} dislikes
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {conversationId.slice(-8)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
