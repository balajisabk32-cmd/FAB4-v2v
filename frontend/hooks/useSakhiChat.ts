import { useState } from "react";

export type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
};

export function useSakhiChat(onChartUpdate: (data: any) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim()) return;

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: prompt };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask-sakhi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      
      const data = await res.json();
      
      // Add bot message
      if (data.reply) {
        setMessages(prev => [
          ...prev, 
          { id: (Date.now() + 1).toString(), role: "bot", text: data.reply }
        ]);
      }

      // If backend returned updated ML data, pass it up to refresh charts
      if (data.updatedChartData) {
        onChartUpdate(data.updatedChartData);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: "bot", text: "I'm having trouble connecting to my network right now. Please try again gently." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage };
}
