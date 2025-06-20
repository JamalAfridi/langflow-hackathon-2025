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
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📞 Call Dashboard</h2>
            <p className="text-blue-100">Real-time webhook monitoring</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Total Calls</div>
            <div className="text-3xl font-bold">{webhookData.length}</div>
          </div>
        </div>
        {lastUpdate && (
          <div className="mt-4 text-xs text-blue-200">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Webhook Status */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 dark:text-green-300 font-medium">
            Webhook Endpoint Active
          </span>
          <code className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
            /api/webhook
          </code>
        </div>
      </div>

      {/* Calls List */}
      {webhookData.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-4">🔊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No calls yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start a conversation with the voice agent above to see call data
            here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhookData
            .slice()
            .reverse()
            .map((call, index) => (
              <div
                key={call.data.conversation_id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Call Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          call.data.analysis.call_successful === "success"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Call #{webhookData.length - index}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimestamp(
                            call.data.metadata.start_time_unix_secs
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDuration(call.data.metadata.call_duration_secs)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatCost(call.data.metadata.cost)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Stats */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {call.data.transcript.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Messages
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {call.data.metadata.feedback.likes}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        👍 Likes
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {call.data.metadata.feedback.dislikes}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        👎 Dislikes
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {call.data.analysis.call_successful === "success"
                          ? "✅"
                          : "❌"}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Status
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transcript Summary */}
                {call.data.analysis.transcript_summary && (
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      📝 Summary
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      {call.data.analysis.transcript_summary}
                    </p>
                  </div>
                )}

                {/* Transcript */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    💬 Conversation
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
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
                          className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                            entry.role === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs opacity-75">
                              {entry.role === "user" ? "👤" : "🤖"} {entry.role}
                            </span>
                            <span className="text-xs opacity-50">
                              {formatDuration(entry.time_in_call_secs)}
                            </span>
                          </div>
                          <p>{entry.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
