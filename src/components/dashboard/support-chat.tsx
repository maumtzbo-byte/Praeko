"use client";

import { useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { sendSupportChatMessage } from "@/app/dashboard/ayuda/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! Soy el asistente de Praeko. Pregúntame cómo conectar tus redes, cómo generar contenido, o cualquier otra duda sobre el panel.",
};

export function SupportChat({ businessId }: { businessId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    const result = await sendSupportChatMessage(
      businessId,
      nextMessages.filter((m) => m !== GREETING),
    );

    if (result.success) {
      setMessages((prev) => [...prev, { role: "assistant", content: result.data.reply }]);
    } else {
      setError(result.error);
    }
    setSending(false);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={listRef} className="flex h-80 flex-col gap-3 overflow-y-auto rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
        {messages.map((message, i) => (
          <div
            key={i}
            className={cn("flex items-start gap-2", message.role === "user" && "flex-row-reverse")}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                message.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
              )}
            >
              {message.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </span>
            <p
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                message.role === "user"
                  ? "rounded-tr-sm bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                  : "rounded-tl-sm bg-white text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
              )}
            >
              {message.content}
            </p>
          </div>
        ))}
        {sending && (
          <div className="flex items-start gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
              <Bot className="h-3.5 w-3.5" />
            </span>
            <p className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-sm text-zinc-400 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-zinc-700">
              Escribiendo…
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={sending}
        />
        <Button type="submit" size="md" disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
