import { create } from "zustand";
import type { Message, DocumentRecord } from "@/lib/types";

interface AppState {
  // Chat
  messages: Message[];
  addMessage: (m: Message) => void;
  updateLastMessage: (patch: Partial<Message>) => void;
  clearMessages: () => void;

  // Documents
  documents: DocumentRecord[];
  setDocuments: (docs: DocumentRecord[]) => void;
  addDocument: (doc: DocumentRecord) => void;
  removeDocument: (docId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Chat
  messages: [],
  addMessage: (m) =>
    set((s) => ({ messages: [...s.messages, m] })),
  updateLastMessage: (patch) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = [...s.messages];
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...patch };
      return { messages: msgs };
    }),
  clearMessages: () => set({ messages: [] }),

  // Documents
  documents: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) =>
    set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (docId) =>
    set((s) => ({ documents: s.documents.filter((d) => d.doc_id !== docId) })),
}));
