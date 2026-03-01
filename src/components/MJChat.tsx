import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactMarkdown from "react-markdown";
import mjAvatar from "@/assets/mj-avatar.jpg";

type Msg = { role: "user" | "assistant"; content: string };

const FAREWELL_MARKER = "[[FAREWELL]]";

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
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const charQueueRef = useRef<string[]>([]);
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealedRef = useRef("");

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens & lock body scroll on mobile
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (isMobile) {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.left = '';
          document.body.style.right = '';
          document.body.style.overflow = '';
          window.scrollTo(0, scrollY);
        };
      }
    }
  }, [open, isMobile]);

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
          gmt_hour: new Date().getUTCHours(),
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to connect to MJ");
      }

      // Check if server returned a guest_id (for newly resolved guests)
      const contentType = resp.headers.get("content-type") || "";
      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      const CHAR_DELAY_MS = 18; // ~18ms per char ≈ 10s for ~550 chars

      const startRevealTimer = () => {
        if (revealTimerRef.current) return;
        revealTimerRef.current = setInterval(() => {
          if (charQueueRef.current.length === 0) {
            if (revealTimerRef.current) {
              clearInterval(revealTimerRef.current);
              revealTimerRef.current = null;
            }
            return;
          }
          const nextChar = charQueueRef.current.shift()!;
          revealedRef.current += nextChar;

          const hasFarewell = revealedRef.current.includes(FAREWELL_MARKER);
          const displayContent = revealedRef.current.replace(FAREWELL_MARKER, "").trim();

          if (hasFarewell) {
            setTimeout(() => setShowRating(true), 500);
          }

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last !== prev[0]) {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: displayContent } : m
              );
            }
            return [...prev, { role: "assistant", content: displayContent }];
          });
        }, CHAR_DELAY_MS);
      };

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        // Queue each character for gradual reveal
        for (const ch of chunk) {
          charQueueRef.current.push(ch);
        }
        startRevealTimer();
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
    [guestId, messages]
  );

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    // Reset typewriter state
    charQueueRef.current = [];
    revealedRef.current = "";
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);


    try {
      await streamChat(newMessages);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm experiencing a temporary issue. Please try again in a moment.",
        },
      ]);
      console.error("MJ Chat error:", e);
    } finally {
      // Wait for typewriter queue to finish before removing loading state
      const waitForReveal = () => {
        if (charQueueRef.current.length === 0) {
          setIsLoading(false);
        } else {
          setTimeout(waitForReveal, 100);
        }
      };
      waitForReveal();
    }
  };

  const submitRating = async (selectedRating: number) => {
    setRatingSubmitted(true);
    if (guestId) {
      try {
        await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [],
            guest_id: guestId,
            rating: selectedRating,
          }),
        });
      } catch (e) {
        console.error("Rating submission error:", e);
      }
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
            initial={{ opacity: 0, y: isMobile ? "100%" : 20, scale: isMobile ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? "100%" : 20, scale: isMobile ? 1 : 0.95 }}
            transition={{ duration: 0.3 }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100) setOpen(false);
            }}
            className={`fixed z-[100] flex flex-col overflow-hidden bg-card ${
              isMobile
                ? "inset-0 rounded-none touch-none overscroll-none"
                : "bottom-6 right-6 w-[340px] max-h-[600px] rounded-2xl shadow-2xl border border-border"
            }`}
            style={isMobile ? { overflow: 'hidden' } : undefined}
          >
            {/* Header */}
            {isMobile && (
              <div className="flex justify-center pt-2 pb-0 bg-primary">
                <div className="w-10 h-1 rounded-full bg-primary-foreground/30" />
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-4 bg-primary text-primary-foreground">
              <div className="flex items-center gap-3">
                <img src={mjAvatar} alt="MJ" className="relative h-9 w-9 rounded-full object-cover ring-2 ring-green-400 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] ring-offset-1 ring-offset-primary" />
                <div>
                  <p className="font-serif font-semibold text-sm">MJ</p>
                  <p className="text-[10px] text-primary-foreground/70 flex items-center gap-1">
                    {isLoading ? "typing..." : "Online"}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat">
                <X size={20} />
              </button>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              className={`flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 ${
                isMobile ? "min-h-0" : "min-h-[300px] max-h-[420px]"
              }`}
            >
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
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* Quick actions — show when no messages yet */}
              {messages.length === 0 && !isLoading && (
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

              {/* Rating prompt after farewell */}
              {showRating && !ratingSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 py-4 px-3 bg-muted/50 rounded-2xl mt-2"
                >
                  <p className="text-sm font-sans text-foreground font-medium">
                    How was your experience with MJ?
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={`transition-colors ${
                              star <= (hoverRating || rating)
                                ? "fill-accent text-accent"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => submitRating(rating)}
                      className="text-xs bg-accent text-accent-foreground rounded-full px-4 py-1.5 font-medium font-sans"
                    >
                      Submit Rating
                    </motion.button>
                  )}
                </motion.div>
              )}

              {ratingSubmitted && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-muted-foreground font-sans py-2"
                >
                  Thank you for your feedback!
                </motion.p>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className={`flex items-center gap-2 px-4 py-3 border-t border-border shrink-0 ${
                isMobile ? "pb-[max(env(safe-area-inset-bottom,12px),16px)]" : ""
              }`}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send your message"
                disabled={isLoading}
                className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground font-sans"
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-8 w-8 shrink-0 rounded-full bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MJChat;
