import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Loader } from "lucide-react"

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-100",
        )}
      >
        {message.content}
        {message.pending && <Loader className="inline ml-1 h-3 w-3 animate-spin" />}
      </div>
    </div>
  )
}
