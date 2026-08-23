"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/panel/AppShell";
import {
  fetchLiveSessions,
  toggleLiveTakeover,
  sendLiveChatMessage,
  type LiveChatSession,
  type LiveSessionMessage,
} from "@/lib/adminApi";
import { MessageSquare, UserCheck, Bot, Send, Bell, ShieldAlert, Wifi, CheckCircle2 } from "lucide-react";

interface LiveHelpdeskCardProps {
  botId: string;
}

export function LiveHelpdeskCard({ botId }: LiveHelpdeskCardProps) {
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevSessionsCountRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        new Notification("ochreshift Helpdesk", {
          body: "Desktop alerts enabled for high-intent conversations and live intervention requests!",
          icon: "/favicon.ico",
        });
      }
    }
  };

  const loadSessions = async () => {
    try {
      const data = await fetchLiveSessions(botId);
      // Check for desktop notification on new incoming message / session
      if (
        data.length > prevSessionsCountRef.current &&
        prevSessionsCountRef.current !== 0 &&
        notifPermission === "granted"
      ) {
        new Notification("New Handoff & Live Chat Activity", {
          body: `A customer on bot ${botId} is active and might require human support!`,
        });
      }
      prevSessionsCountRef.current = data.length;
      setSessions(data);
      if (!selectedSessionId && data.length > 0) {
        setSelectedSessionId(data[0].sessionId);
      }
    } catch (err) {
      console.error("Failed to fetch live sessions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 3000);
    return () => clearInterval(interval);
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedSessionId, sessions]);

  const selectedSession = sessions.find((s) => s.sessionId === selectedSessionId);

  const handleToggleOverride = async (enable: boolean) => {
    if (!selectedSessionId) return;
    try {
      await toggleLiveTakeover(selectedSessionId, enable);
      await loadSessions();
    } catch (err) {
      console.error("Error toggling AI takeover", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSessionId || sending) return;
    setSending(true);
    try {
      // If AI hasn't been turned off yet, auto-enable human takeover when rep replies!
      if (selectedSession && !selectedSession.isAiOverridden) {
        await toggleLiveTakeover(selectedSessionId, true);
      }
      await sendLiveChatMessage(selectedSessionId, replyText, "agent");
      setReplyText("");
      await loadSessions();
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <b className="block text-[15px] font-[750] text-fg">Live Agent Helpdesk & Real-Time Intervention</b>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Monitor active customer widget sessions, intercept high-intent inquiries, and toggle live human takeover.
            </p>
          </div>
        </div>

        {notifPermission !== "granted" ? (
          <button
            type="button"
            onClick={requestNotifications}
            className="flex items-center gap-1.5 rounded-r1 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[12px] font-[650] text-indigo-600 hover:bg-indigo-500/20 transition-colors"
          >
            <Bell className="h-3.5 w-3.5" />
            Enable Desktop Alerts
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-[12px] font-[650] text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Push Alerts Active
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex h-[480px] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-r-transparent" />
            <span className="text-[13px] font-[600] text-muted">Connecting to Live Stream...</span>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center">
          <Wifi className="mx-auto h-8 w-8 text-faint mb-2 opacity-60 animate-pulse" />
          <p className="text-[13.5px] font-[650] text-fg">No active live chat sessions right now.</p>
          <p className="mt-1 text-[12px] text-muted max-w-md mx-auto">
            When website visitors open your widget and chat on <b>{botId}</b>, their real-time conversations will appear here for immediate intervention.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 h-[480px]">
          {/* Left Columns: Session List */}
          <div className="border border-border rounded-r2 bg-panel overflow-y-auto p-2 flex flex-col gap-2">
            <div className="px-2 py-1 text-[11.5px] font-[700] text-faint uppercase tracking-wider">
              Active Sessions ({sessions.length})
            </div>
            {sessions.map((s) => {
              const isSelected = s.sessionId === selectedSessionId;
              const lastMsg = s.messages[s.messages.length - 1];
              return (
                <button
                  key={s.sessionId}
                  type="button"
                  onClick={() => setSelectedSessionId(s.sessionId)}
                  className={`group flex flex-col gap-1.5 rounded-r1 p-3 text-left transition-all border ${
                    isSelected
                      ? "bg-surface border-accent shadow-sm ring-1 ring-accent/20"
                      : "bg-surface/50 border-border/50 hover:border-accent/40 hover:bg-surface hover:shadow-sm hover:-translate-y-[1px]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-mono text-[12px] font-[650] text-fg truncate">
                      Visitor #{s.sessionId.slice(-6).toUpperCase()}
                    </span>
                    {s.isAiOverridden ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-[700] text-amber-600 border border-amber-500/30">
                        <UserCheck className="h-2.5 w-2.5" /> Human
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10.5px] font-[700] text-indigo-600 border border-indigo-500/30">
                        <Bot className="h-2.5 w-2.5" /> RAG AI
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="text-[11.5px] text-muted truncate line-clamp-1">
                      <b className="capitalize font-[600]">{lastMsg.sender}:</b> {lastMsg.text}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10.5px] text-faint mt-0.5">
                    <span>{s.messages.length} messages</span>
                    <span>{new Date(s.lastActive * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Columns: Chat Transcript & Takeover Switch */}
          <div className="md:col-span-2 border border-border rounded-r2 bg-surface flex flex-col justify-between overflow-hidden">
            {selectedSession ? (
              <>
                {/* Transcript Header with AI Override Switch */}
                <div className="flex items-center justify-between gap-2 bg-panel border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-accent" />
                    <span className="font-[700] text-[13.5px] text-fg">
                      Visitor #{selectedSession.sessionId.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  {/* AI Override Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleOverride(!selectedSession.isAiOverridden)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-r1 font-[700] text-[12px] transition-all shadow-sm ${
                      selectedSession.isAiOverridden
                        ? "bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-400/30"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {selectedSession.isAiOverridden ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        Take Over Active (Re-enable AI)
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Take Over Conversation
                      </>
                    )}
                  </button>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-paper/30">
                  {selectedSession.messages.length === 0 && (
                    <div className="text-center text-[12px] text-faint py-8">No conversation history yet.</div>
                  )}
                  {selectedSession.messages.map((m, i) => {
                    const isVisitor = m.sender === "visitor";
                    const isSystem = m.sender === "system";
                    if (isSystem) {
                      return (
                        <div key={i} className="flex justify-center my-2">
                          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[11px] font-[650] px-3 py-1 rounded-full">
                            {m.text}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className={`flex flex-col ${isVisitor ? "items-start" : "items-end"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] shadow-sm leading-relaxed ${
                            isVisitor
                              ? "bg-panel text-fg border border-border rounded-tl-sm"
                              : "bg-accent text-white rounded-tr-sm font-[500]"
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[10px] text-faint mt-1 px-1 capitalize font-mono">
                          {m.sender} · {new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Live Agent Reply Input */}
                <form onSubmit={handleSendMessage} className="p-3 bg-panel border-t border-border flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      selectedSession.isAiOverridden
                        ? "Type a direct message to the visitor..."
                        : "Type to reply & automatically take over from RAG AI..."
                    }
                    className="flex-1 rounded-r1 border border-border bg-surface px-3 py-2 text-[13px] text-fg focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-r1 font-[700] text-[13px] hover:bg-accent-strong disabled:opacity-50 transition-colors"
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 grid place-items-center text-[13px] text-muted">
                Select a conversation on the left to inspect or take over.
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
