import type { DocumentRecord, IngestionResult, SSEEvent, SourceCitation } from "./types";

const API_BASE = "/api";

// ─── Documents ────────────────────────────────────────────────────────────────

export async function uploadDocument(file: File): Promise<IngestionResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }

  return res.json();
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function deleteDocument(docId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Delete failed");
  }
}

// ─── Chat streaming ───────────────────────────────────────────────────────────

export interface ChatHistoryTurn {
  role: "human" | "assistant";
  content: string;
}

export async function* streamChat(
  question: string,
  history: ChatHistoryTurn[]
): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, conversation_history: history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    yield { type: "error", data: err.detail ?? "Chat request failed" };
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(trimmed.slice(6)) as SSEEvent;
        yield event;
        if (event.type === "done" || event.type === "error") return;
      } catch {
        // malformed SSE line — skip
      }
    }
  }
}
