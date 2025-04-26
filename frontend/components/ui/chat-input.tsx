"use client"

import { useState, type FormEvent } from "react"
import { SendIcon } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string) => void
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="w-full bg-gray-100 rounded-full py-3 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
