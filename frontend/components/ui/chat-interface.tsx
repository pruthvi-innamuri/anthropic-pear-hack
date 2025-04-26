"use client"

import { useState } from "react"
import MessageList from "@/components/ui/message-list"
import ChatInput from "@/components/ui/chat-input"

export type Message = {
  id: string
  content: string
  sender: "user" | "other"
  timestamp: Date
  avatar?: string
  name?: string
  rating?: number
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      sender: "other",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      avatar: "/placeholder.svg?height=40&width=40",
      name: "Emily",
    },
    {
      id: "2",
      content: "I'm looking for restaurant recommendations in NYC",
      sender: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 4),
      avatar: "/placeholder.svg?height=40&width=40",
      name: "You",
    },
    {
      id: "3",
      content: "I'd recommend da Umberto in Chelsea. Their chicken parm is amazing!",
      sender: "other",
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
      avatar: "/placeholder.svg?height=40&width=40",
      name: "Emily",
      rating: 8.0,
    },
  ])

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
      avatar: "/placeholder.svg?height=40&width=40",
      name: "You",
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate response after a short delay
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "You should also try Pastrami Queen on the Upper East Side. One of the best pastrami sandwiches in the city!",
        sender: "other",
        timestamp: new Date(),
        avatar: "/placeholder.svg?height=40&width=40",
        name: "Eliot",
        rating: 8.5,
      }
      setMessages((prev) => [...prev, responseMessage])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gray-100 flex gap-2 overflow-x-auto">
        <button className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-sm whitespace-nowrap shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Recs Nearby
        </button>
        <button className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-sm whitespace-nowrap shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          Trending
        </button>
        <button className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-sm whitespace-nowrap shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Friend recs
        </button>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold tracking-wide text-gray-900">YOUR CHAT</h2>
      </div>

      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>

      <div className="p-4">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
