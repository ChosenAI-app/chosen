"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ChevronUp, X, SendHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ContractorChatWindow({ projectId }: { projectId: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/contractor",
      body: { projectId },
    }),
  })

  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    sendMessage({ text: trimmed })
    setInput("")
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-all duration-150 hover:border-primary/30"
      >
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
        <span className="flex-1 text-left text-sm text-muted-foreground">
          Ask a technical question...
        </span>
        <ChevronUp className="size-4 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div className="flex h-80 flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          AI Assistant
        </span>
        <button
          onClick={() => setIsExpanded(false)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Ask about permits, codes, fees, or project strategy.
            </p>
          )}
          {messages.map((m) => {
            const text = m.parts
              .filter(
                (p): p is Extract<typeof p, { type: "text" }> =>
                  p.type === "text"
              )
              .map((p) => p.text)
              .join("")

            if (!text) return null

            return (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary"
                    : "mr-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
                }
              >
                {text}
              </div>
            )
          })}
          {isLoading && (
            <div className="mr-auto flex gap-1 rounded-lg bg-muted px-3 py-2">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              <span
                className="size-1.5 animate-pulse rounded-full bg-primary"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="size-1.5 animate-pulse rounded-full bg-primary"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex gap-2 border-t border-border p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          rows={1}
          placeholder="Ask about permits, codes, or project strategy..."
          className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          type="button"
          size="icon"
          disabled={isLoading || !input.trim()}
          onClick={handleSend}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  )
}
