"use client";

import { useEffect, useState, useCallback } from "react";
import { listDocuments, deleteDocument } from "@/lib/api";
import { useAppStore } from "@/store/appStore";

export function useDocuments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { documents, setDocuments, removeDocument } = useAppStore();

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, [setDocuments]);

  const handleDelete = useCallback(
    async (docId: string) => {
      try {
        await deleteDocument(docId);
        removeDocument(docId);
      } catch (e) {
        setError(String(e));
      }
    },
    [removeDocument]
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, isLoading, error, refetch: fetchDocuments, deleteDoc: handleDelete };
}
