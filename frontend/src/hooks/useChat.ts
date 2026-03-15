"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { streamChat } from "@/lib/api";
import { useAppStore } from "@/store/appStore";
import type { Message, SourceCitation } from "@/lib/types";

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const { messages, addMessage, updateLastMessage, clearMessages } = useAppStore();

  const sendMessage = useCallback(
    async (question: string) => {
      if (isLoading || !question.trim()) return;

      // Add user message
      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: question.trim(),
      };
      addMessage(userMsg);

      // Add placeholder assistant message
      const assistantMsg: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "",
        isStreaming: true,
      };
      addMessage(assistantMsg);
      setIsLoading(true);

      // Build history for context (exclude the placeholder we just added)
      const history = messages.map((m) => ({
        role: (m.role === "user" ? "human" : "assistant") as "human" | "assistant",
        content: m.content,
      }));
      // Add the current user question to history
      history.push({ role: "human", content: question.trim() });

      let accumulated = "";
      let sources: SourceCitation[] = [];

      try {
        for await (const event of streamChat(question.trim(), history)) {
          switch (event.type) {
            case "token":
              accumulated += event.data as string;
              updateLastMessage({ content: accumulated });
              break;
            case "sources":
              sources = event.data as SourceCitation[];
              break;
            case "done":
              updateLastMessage({ isStreaming: false, sources });
              break;
            case "error":
              updateLastMessage({
                content: `Error: ${event.data as string}`,
                isStreaming: false,
                isError: true,
              });
              break;
          }
        }
      } catch (err) {
        updateLastMessage({
          content: `Network error: ${String(err)}`,
          isStreaming: false,
          isError: true,
        });
      } finally {
        setIsLoading(false);
        updateLastMessage({ isStreaming: false });
      }
    },
    [isLoading, messages, addMessage, updateLastMessage]
  );

  return { messages, sendMessage, isLoading, clearMessages };
}
