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
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

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

  const toggleCallExpansion = (conversationId: string) => {
    setExpandedCalls((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
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

  const getCallStats = () => {
    const totalCalls = webhookData.length;
    const successfulCalls = webhookData.filter(
      (call) => call.data.analysis.call_successful === "success"
    ).length;
    const totalCost = webhookData.reduce(
      (sum, call) => sum + call.data.metadata.cost,
      0
    );
    const avgDuration =
      webhookData.length > 0
        ? webhookData.reduce(
            (sum, call) => sum + call.data.metadata.call_duration_secs,
            0
          ) / webhookData.length
        : 0;

    return { totalCalls, successfulCalls, totalCost, avgDuration };
  };

  const stats = getCallStats();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl h-40"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎯  Response</h1>
              <p className="text-white/80 text-lg">
                Real-time conversation insights & webhook monitoring
              </p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-black">{stats.totalCalls}</div>
              <div className="text-white/80">Total Conversations</div>
            </div>
          </div>

          {lastUpdate && (
            <div className="flex items-center space-x-2 text-white/70 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Success Rate
              </p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalCalls > 0
                  ? Math.round((stats.successfulCalls / stats.totalCalls) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total Cost
              </p>
              <p className="text-3xl font-bold text-blue-600">
                ${stats.totalCost.toFixed(3)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Avg Duration
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {formatDuration(stats.avgDuration)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Webhook Status
              </p>
              <p className="text-lg font-bold text-green-600">Active</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Calls List */}
      {webhookData.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="text-6xl mb-6">🎤</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            No Conversations Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Start a conversation with the voice agent to see analytics here!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Recent Conversations
          </h2>
          {webhookData
            .slice()
            .reverse()
            .map((call, index) => {
              const conversationId = call.data.conversation_id;
              const isExpanded = expandedCalls.has(conversationId);
              const forwardStatus = forwardingStatus[conversationId] || "idle";

              return (
                <div
                  key={conversationId}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Call Header */}
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
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
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatDuration(
                              call.data.metadata.call_duration_secs
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCost(call.data.metadata.cost)}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCallExpansion(conversationId)}
                          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <svg
                            className={`w-5 h-5 transform transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {call.data.transcript.length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Messages
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {call.data.metadata.feedback.likes}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          👍 Likes
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {call.data.metadata.feedback.dislikes}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          👎 Dislikes
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl">
                          {call.data.analysis.call_successful === "success"
                            ? "✅"
                            : "❌"}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Status
                        </div>
                      </div>
                      <div className="text-center">
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
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 space-y-6">
                      {/* Summary */}
                      {call.data.analysis.transcript_summary && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                            <span className="mr-2">📋</span> Conversation
                            Summary
                          </h4>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {call.data.analysis.transcript_summary}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Transcript */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <span className="mr-2">💬</span> Full Conversation
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
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
                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                  entry.role === "user"
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-xs font-medium opacity-75">
                                    {entry.role === "user"
                                      ? "👤 You"
                                      : "🤖 Agent"}
                                  </span>
                                  <span className="text-xs opacity-50">
                                    {formatDuration(entry.time_in_call_secs)}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed">
                                  {entry.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
