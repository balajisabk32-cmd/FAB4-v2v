"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type MessagePart = {
  text?: string;
  functionCall?: any;
  functionResponse?: any;
};

type Message = {
  role: "user" | "model" | "tool";
  parts: MessagePart[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      parts: [
        {
          text: "Namaste! I am SAKHI, your health companion. How can I help you today? I can help predict your cycle regularity or check your PCOS risk based on your stats.",
        },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    const userText = input.trim();
    setInput("");
    setError(null);

    // 1. Add user message locally
    const userMsg: Message = {
      role: "user",
      parts: [{ text: userText }],
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // 2. Call Express orchestration server
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: user.email,
          message: userText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with SAKHI's orchestration backend.");
      }

      const data = await response.json();

      // 3. Update chat history with backend result
      if (data.history) {
        setMessages(data.history);
      } else if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "model", parts: [{ text: data.reply }] },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!user) return;
    try {
      await fetch("http://localhost:3001/api/chat/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: user.email }),
      });
      setMessages([
        {
          role: "model",
          parts: [
            {
              text: "Chat cleared! How can I help you now?",
            },
          ],
        },
      ]);
      setError(null);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    }
  };

  const handleLogOut = () => {
    sessionStorage.removeItem("user");
    router.push("/");
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505] text-white">
        Loading portal...
      </div>
    );
  }

  return (
    <main className="flex h-[100vh] w-full bg-[#050505] overflow-hidden">
      {/* Sidebar with User Profile Info */}
      <section className="hidden md:flex w-80 flex-col bg-[#0c0c0e] border-r border-zinc-800/40 p-6 justify-between">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              SAKHI <span className="text-xs uppercase tracking-widest text-indigo-400 font-normal">Dashboard</span>
            </h2>
            <div className="h-px bg-zinc-800/60 my-4" />
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">Active Profile</span>
              <div className="text-white font-medium">{user.name}</div>
              <div className="text-zinc-400 text-xs truncate">{user.email}</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">Personal Metrics</span>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Weight:</span>
                <span className="text-white font-semibold">{user.weight} kg</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Cycle Length:</span>
                <span className="text-white font-semibold">{user.cycleLength} days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleClearChat}
            className="w-full py-2.5 px-4 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-sm font-medium transition-all"
          >
            Clear History
          </button>
          <button
            onClick={handleLogOut}
            className="w-full py-2.5 px-4 rounded-full bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white text-sm font-medium transition-all"
          >
            Sign Out
          </button>
        </div>
      </section>

      {/* Main Chat Interface */}
      <section className="flex-1 flex flex-col justify-between relative bg-gradient-to-b from-[#0c0c0e]/30 to-[#050505]">
        
        {/* Header bar */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-800/40 px-6 bg-[#0c0c0e]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">SAKHI AI Health Companion</span>
          </div>
          <button
            onClick={handleLogOut}
            className="md:hidden py-1.5 px-3 rounded-full bg-zinc-800 text-zinc-300 text-xs"
          >
            Log Out
          </button>
        </header>

        {/* Message Window */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.map((msg, index) => {
            // Check if there is text in any of the parts
            const textPart = msg.parts.find((p) => p.text);
            const functionCallPart = msg.parts.find((p) => p.functionCall);
            const functionResponsePart = msg.parts.find((p) => p.functionResponse);

            if (!textPart && !functionCallPart && !functionResponsePart) return null;

            const isUser = msg.role === "user";
            
            return (
              <div
                key={index}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-2xl px-5 py-4 rounded-3xl ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-br-none shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                      : "bg-[#0c0c0e] text-zinc-100 rounded-bl-none border border-zinc-800/40"
                  }`}
                >
                  {/* Handle text messages */}
                  {textPart?.text && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{textPart.text}</p>
                  )}

                  {/* Handle functionCall system notification */}
                  {functionCallPart && (
                    <div className="text-[11px] font-mono text-zinc-500 mt-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      Invoking local ML model: {functionCallPart.functionCall.name}
                    </div>
                  )}

                  {/* Handle functionResponse system notification */}
                  {functionResponsePart && (
                    <div className="text-[11px] font-mono text-emerald-500 mt-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      FastAPI prediction completed successfully
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex w-full justify-start">
              <div className="bg-[#0c0c0e] border border-zinc-800/40 text-zinc-400 px-5 py-4 rounded-3xl rounded-bl-none flex items-center gap-2">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2.5 h-2.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2.5 h-2.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-zinc-500 ml-2">SAKHI is thinking...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full flex justify-center">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-3 rounded-full text-xs">
                ⚠️ Error: {error}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-6 border-t border-zinc-800/40 bg-[#0c0c0e]/30">
          <div className="flex items-center gap-4 bg-[#0c0c0e] border border-zinc-800/60 rounded-full p-2 pl-6 focus-within:ring-1 focus-within:ring-indigo-500 transition-all duration-300">
            <input
              type="text"
              placeholder="Ask SAKHI about your health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="py-3 px-6 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              Send
            </button>
          </div>
        </form>

      </section>
    </main>
  );
}
