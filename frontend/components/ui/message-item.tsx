import type { Message } from "./chat-interface"
import { cn } from "@/lib/utils"

interface MessageItemProps {
  message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.sender === "user"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <img
            src={message.avatar || "/placeholder.svg?height=40&width=40"}
            alt={message.name || "User"}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-900">{message.name}</span>
          {!isUser && message.rating && (
            <div className="ml-auto bg-white rounded-full px-2 py-0.5 text-sm font-semibold text-gray-700 border border-gray-100">
              {message.rating.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div className="pl-12">
        <div
          className={cn(
            "rounded-2xl p-3 inline-block max-w-[85%]",
            isUser ? "bg-gray-100 text-gray-900" : "bg-white border border-gray-100 shadow-sm text-gray-900",
          )}
        >
          <p className="text-sm">{message.content}</p>
        </div>

        {!isUser && (
          <div className="flex items-center gap-4 mt-2">
            <button className="flex items-center gap-1 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-red-400"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </button>
            <button className="flex items-center gap-1 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button className="flex items-center gap-1 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
          {isUser ? "" : " • 2 likes"}
        </div>
      </div>
    </div>
  )
}
