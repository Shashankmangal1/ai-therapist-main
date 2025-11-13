"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  PlusCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import {
  createChatSession,
  sendChatMessage,
  getChatHistory,
  getAllChatSessions,
  ChatMessage,
  ChatSession,
} from "@/lib/api/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const SUGGESTED_QUESTIONS = [
  { text: "How can I manage my anxiety better?" },
  { text: "I've been feeling overwhelmed lately" },
  { text: "Can we talk about improving sleep?" },
  { text: "I need help with work-life balance" },
];

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

export default function TherapyPage() {
  const params = useParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(
    params.sessionId as string
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const hasCreatedRef = useRef(false);

  // ✅ Only create one session at mount (fixes double new chat)
  useEffect(() => {
    const initChat = async () => {
      if (hasCreatedRef.current) return;
      hasCreatedRef.current = true;
      try {
        setIsLoading(true);
        if (!sessionId || sessionId === "new") {
          const newSessionId = await createChatSession();
          setSessionId(newSessionId);
          window.history.replaceState({}, "", `/therapy/${newSessionId}`);
        } else {
          const history = await getChatHistory(sessionId);
          if (Array.isArray(history)) {
            setMessages(
              history.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
            );
          } else setMessages([]);
        }
      } catch (err) {
        console.error("Init chat error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [sessionId]);

  // Load all sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllChatSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    };
    loadSessions();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (!isTyping) scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isTyping || !sessionId) return;

    const current = message.trim();
    setMessage("");
    setIsTyping(true);

    const userMsg: ChatMessage = {
      role: "user",
      content: current,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await sendChatMessage(sessionId, current);
      const aiResponse =
        typeof response === "string" ? JSON.parse(response) : response;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          aiResponse.response ||
          aiResponse.message ||
          "I'm here to support you. Could you tell me more about what's on your mind?",
        timestamp: new Date(),
        metadata: aiResponse.metadata || {},
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      const newSessionId = await createChatSession();
      const newSession: ChatSession = {
        sessionId: newSessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setSessionId(newSessionId);
      setMessages([]);
      window.history.replaceState({}, "", `/therapy/${newSessionId}`);
    } catch (err) {
      console.error("New session error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Makes suggestions actually send messages
  const handleSuggestedQuestion = async (text: string) => {
    if (!sessionId) {
      const newSessionId = await createChatSession();
      setSessionId(newSessionId);
      window.history.replaceState({}, "", `/therapy/${newSessionId}`);
    }
    setMessage(text);
    await new Promise((r) => setTimeout(r, 100));
    handleSubmit();
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    if (selectedSessionId === sessionId) return;
    try {
      setIsLoading(true);
      const history = await getChatHistory(selectedSessionId);
      if (Array.isArray(history)) {
        setMessages(
          history.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
        );
        setSessionId(selectedSessionId);
        window.history.replaceState({}, "", `/therapy/${selectedSessionId}`);
      }
    } catch (err) {
      console.error("Load session error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  return (
    <div className="relative max-w-7xl mx-auto px-4">
      <div className="flex h-[calc(100vh-4rem)] mt-20 gap-6">
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r bg-muted/30">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Chat Sessions</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewSession}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleNewSession}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              New Session
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={cn(
                    "p-3 rounded-lg text-sm cursor-pointer hover:bg-primary/5 transition-colors",
                    session.sessionId === sessionId
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10"
                  )}
                  onClick={() => handleSessionSelect(session.sessionId)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-medium">
                      {session.messages[0]?.content.slice(0, 30) || "New Chat"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground">
                    {session.messages[session.messages.length - 1]?.content ||
                      "No messages yet"}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{session.messages.length} messages</span>
                    <span>
                      {formatDistanceToNow(new Date(session.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">AI Therapist</h2>
                <p className="text-sm text-muted-foreground">
                  {messages.length} messages
                </p>
              </div>
            </div>
          </div>

          {messages.length === 0 ? (
            // Welcome with clickable suggestions
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="relative inline-flex flex-col items-center">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                      initial="initial"
                      animate="animate"
                      variants={glowAnimation}
                    />
                    <div className="relative flex items-center gap-2 text-2xl font-semibold">
                      <Sparkles className="w-6 h-6 text-primary" />
                      <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                        AI Therapist
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2">
                      How can I assist you today?
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 relative">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <motion.div
                      key={q.text}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 + 0.5 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 px-6 text-left justify-start hover:bg-muted/50 hover:border-primary/50"
                        onClick={() => handleSuggestedQuestion(q.text)}
                      >
                        {q.text}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Chat messages
            <div className="flex-1 overflow-y-auto scroll-smooth">
              <div className="max-w-3xl mx-auto">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.timestamp.toISOString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "px-6 py-8",
                        msg.role === "assistant" ? "bg-muted/30" : "bg-background"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="w-8 h-8 shrink-0 mt-1">
                          {msg.role === "assistant" ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <Bot className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-sm">
                            {msg.role === "assistant" ? "AI Therapist" : "You"}
                          </p>
                          <div className="prose prose-sm dark:prose-invert leading-relaxed">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.metadata?.technique && (
                            <Badge variant="secondary" className="text-xs">
                              {msg.metadata.technique}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-8 flex gap-4 bg-muted/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Typing...</p>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t bg-background/50 p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-4 items-end">
              <div className="flex-1 relative group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full resize-none rounded-2xl border bg-background p-3 pr-12 min-h-[48px]"
                  rows={1}
                  disabled={isTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1.5 bottom-3.5 h-[36px] w-[36px] rounded-xl bg-primary hover:bg-primary/90"
                  disabled={isTyping || !message.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Press <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd>{" "}
              to send, <kbd className="px-2 py-0.5 rounded bg-muted ml-1">Shift + Enter</kbd> for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
