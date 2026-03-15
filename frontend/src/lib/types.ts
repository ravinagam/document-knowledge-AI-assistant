export interface SourceCitation {
  filename: string;
  page?: number | null;
  excerpt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  isStreaming?: boolean;
  isError?: boolean;
}

export interface DocumentRecord {
  doc_id: string;
  filename: string;
  total_chunks: number;
}

export interface IngestionResult {
  doc_id: string;
  filename: string;
  total_pages: number;
  total_chunks: number;
}

export interface SSEEvent {
  type: "token" | "sources" | "done" | "error";
  data?: string | SourceCitation[];
}
