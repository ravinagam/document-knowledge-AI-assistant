"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot, AlertCircle } from "lucide-react";
import SourceCitations from "./SourceCitations";
import type { Message } from "@/lib/types";

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : message.isError
              ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              {message.isError && (
                <AlertCircle className="w-4 h-4 mb-1 inline-block mr-1" />
              )}
              <div className="prose-chat text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content || (message.isStreaming ? " " : "")}
                </ReactMarkdown>
                {message.isStreaming && <span className="cursor-blink" />}
              </div>
            </>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full mt-1">
            <SourceCitations sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  );
}
