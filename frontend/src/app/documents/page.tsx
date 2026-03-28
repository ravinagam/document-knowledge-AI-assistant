"use client";

import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import { useDocuments } from "@/hooks/useDocuments";

export default function DocumentsPage() {
  const { documents, isLoading, error, refetch, deleteDoc } = useDocuments();

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      {/* Upload section */}
      <section>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Upload Documents</h1>
        <p className="text-sm text-gray-500 mb-4">
          Supported formats: PDF, DOCX, DOC, XLSX, XLS, TXT, MD, PNG, JPG, GIF, BMP, TIFF, WEBP · Files are indexed locally — nothing leaves your machine.
        </p>
        <DocumentUploader />
      </section>

      {/* Indexed documents section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Indexed Documents</h2>
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          error={error}
          onDelete={deleteDoc}
          onRefresh={refetch}
        />
      </section>
    </div>
  );
}
