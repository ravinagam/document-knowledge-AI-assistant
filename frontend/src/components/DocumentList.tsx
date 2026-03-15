"use client";

import { Trash2, FileText, Loader2, RefreshCw } from "lucide-react";
import type { DocumentRecord } from "@/lib/types";

interface Props {
  documents: DocumentRecord[];
  isLoading: boolean;
  error: string | null;
  onDelete: (docId: string) => Promise<void>;
  onRefresh: () => void;
}

export default function DocumentList({
  documents,
  isLoading,
  error,
  onDelete,
  onRefresh,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading documents…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">
        {error}
        <button onClick={onRefresh} className="ml-3 underline hover:no-underline">
          Retry
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No documents indexed yet. Upload some above.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">
          {documents.length} document{documents.length !== 1 ? "s" : ""} indexed
        </span>
        <button
          onClick={onRefresh}
          className="btn-secondary py-1 px-2 text-xs"
          title="Refresh list"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
        {documents.map((doc) => (
          <li
            key={doc.doc_id}
            className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
              <p className="text-xs text-gray-400">{doc.total_chunks} chunks</p>
            </div>
            <button
              onClick={() => onDelete(doc.doc_id)}
              className="btn-danger"
              title="Delete document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
