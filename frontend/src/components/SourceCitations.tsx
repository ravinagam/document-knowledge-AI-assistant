"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { SourceCitation } from "@/lib/types";

interface Props {
  sources: SourceCitation[];
}

export default function SourceCitations({ sources }: Props) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden text-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 font-medium"
      >
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {sources.length} source{sources.length > 1 ? "s" : ""} retrieved
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="divide-y divide-gray-100">
          {sources.map((src, i) => (
            <div key={i} className="px-3 py-2.5 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {src.filename}
                  {src.page != null ? ` · p.${src.page + 1}` : ""}
                </span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">
                {src.excerpt}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
