"use client";

import { Trash2 } from "lucide-react";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import SystemBanner from "@/components/SystemBanner";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { messages, sendMessage, isLoading, clearMessages } = useChat();

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-800">Chat with your documents</h1>
            <p className="text-xs text-gray-400">
              Answers are grounded in your uploaded documents only
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="btn-secondary py-1 px-2 text-xs"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* System info banner (model + hardware + speed advice) */}
      <SystemBanner />

      {/* Messages */}
      <ChatWindow messages={messages} />

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
