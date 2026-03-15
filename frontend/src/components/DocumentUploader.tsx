"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { uploadDocument } from "@/lib/api";
import { useAppStore } from "@/store/appStore";
import type { IngestionResult } from "@/lib/types";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

interface UploadStatus {
  filename: string;
  status: "uploading" | "success" | "error";
  message?: string;
  result?: IngestionResult;
}

export default function DocumentUploader() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const { addDocument } = useAppStore();

  const processFile = useCallback(
    async (file: File) => {
      setUploads((prev) => [
        { filename: file.name, status: "uploading" },
        ...prev,
      ]);

      try {
        const result = await uploadDocument(file);
        setUploads((prev) =>
          prev.map((u) =>
            u.filename === file.name && u.status === "uploading"
              ? { ...u, status: "success", result }
              : u
          )
        );
        addDocument({
          doc_id: result.doc_id,
          filename: result.filename,
          total_chunks: result.total_chunks,
        });
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.filename === file.name && u.status === "uploading"
              ? { ...u, status: "error", message: String(err) }
              : u
          )
        );
      }
    },
    [addDocument]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach(processFile);
    },
    [processFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024,
    multiple: true,
  });

  return (
    <div>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload
          className={`w-10 h-10 mx-auto mb-3 ${
            isDragActive ? "text-blue-500" : "text-gray-400"
          }`}
        />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? "Drop files here…" : "Drag & drop files, or click to browse"}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, MD · Max 50 MB each</p>
      </div>

      {/* Upload status list */}
      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2">
          {uploads.map((u, i) => (
            <li key={i} className="flex items-start gap-3 p-3 card text-sm">
              {u.status === "uploading" && (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
              )}
              {u.status === "success" && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              {u.status === "error" && (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{u.filename}</p>
                {u.status === "uploading" && (
                  <p className="text-gray-400 text-xs">Uploading and indexing…</p>
                )}
                {u.status === "success" && u.result && (
                  <p className="text-green-600 text-xs">
                    Indexed {u.result.total_chunks} chunks from {u.result.total_pages} page
                    {u.result.total_pages !== 1 ? "s" : ""}
                  </p>
                )}
                {u.status === "error" && (
                  <p className="text-red-500 text-xs">{u.message}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
