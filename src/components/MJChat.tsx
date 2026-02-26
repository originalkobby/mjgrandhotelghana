import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mj-ai`;

const QUICK_ACTIONS = [
  "View My Reservation",
  "Upgrade My Room",
  "Request Late Checkout",
  "Report an Issue",
];

const MJChat = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && !showNamePrompt) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, showNamePrompt]);

  const initGuest = async (name: string) => {
    setGuestName(name);
    setShowNamePrompt(false);

    // Create or find guest
    const { data: existing } = await supabase
      .from("guests")
      .select("id")
      .eq("full_name", name)
      .limit(1)
      .maybeSingle();

    let id: string;
    if (existing) {
      id = existing.id;
    } else {
      const { data: newGuest } = await supabase
        .from("guests")
        .insert({ full_name: name })
        .select("id")
        .single();
      id = newGuest?.id || "";
    }
    setGuestId(id);

    // Add welcome message
    setMessages([
      {
        role: "assistant",
        content: `Welcome to MJ Grand Hotel, ${name}! 🏨✨\n\nI'm **MJ**, your personal support assistant. I'm here to help with anything you need during your stay — from reservations and room upgrades to restaurant recommendations and local attractions.\n\nHow can I assist you today?`,
      },
    ]);
  };

  const streamChat = useCallback(
    async (userMessages: Msg[]) => {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: userMessages,
          guest_id: guestId,
          guest_name: guestName,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to connect to MJ");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last !== prev[0]) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    },
    [guestId, guestName, messages]
  );

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(newMessages.filter((m) => m !== messages[0])); // exclude welcome
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm experiencing a temporary issue. Please try again in a moment.",
        },
      ]);
      console.error("MJ Chat error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center"
            aria-label="Open chat with MJ"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`fixed z-[100] flex flex-col overflow-hidden bg-card ${
              isMobile
                ? "inset-0 rounded-none"
                : "bottom-6 right-6 w-[380px] max-h-[600px] rounded-2xl shadow-2xl border border-border"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-primary text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-serif font-bold text-sm">
                  MJ
                </div>
                <div>
                  <p className="font-serif font-semibold text-sm">MJ Concierge</p>
                  <p className="text-xs opacity-70">MJ Grand Hotel</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat">
                <X size={20} />
              </button>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 space-y-3 ${isMobile ? "min-h-0" : "min-h-[300px] max-h-[420px]"}`}>
              {showNamePrompt ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                  <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-serif font-bold text-2xl">
                    MJ
                  </div>
                  <p className="text-center text-sm text-muted-foreground font-sans">
                    Welcome! May I have your name to get started?
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (input.trim()) initGuest(input.trim());
                    }}
                    className="flex gap-2 w-full px-4"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Your name..."
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-medium"
                    >
                      Start
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-sans ${
                          msg.role === "user"
                            ? "bg-accent text-accent-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <Loader2 size={16} className="animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Quick actions — show after welcome only */}
                  {messages.length === 1 && !isLoading && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action}
                          onClick={() => send(action)}
                          className="text-xs border border-border rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-sans"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            {!showNamePrompt && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2 px-4 py-3 border-t border-border"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground font-sans"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MJChat;
