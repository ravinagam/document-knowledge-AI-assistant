"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type { Message } from "@/lib/types";
import { Bot } from "lucide-react";

interface Props {
  messages: Message[];
}

export default function ChatWindow({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-8">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Bot className="w-8 h-8 text-blue-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">Ask your documents anything</p>
          <p className="text-sm mt-1">
            Upload documents in the{" "}
            <a href="/documents" className="text-blue-600 underline hover:text-blue-800">
              Documents
            </a>{" "}
            tab, then start chatting.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 max-w-xl w-full">
          {[
            "Summarize the key points from my document",
            "What are the main conclusions?",
            "Find all mentions of budget or costs",
          ].map((suggestion) => (
            <div
              key={suggestion}
              className="card p-3 text-sm text-gray-500 text-center cursor-default hover:border-blue-200 transition-colors"
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
