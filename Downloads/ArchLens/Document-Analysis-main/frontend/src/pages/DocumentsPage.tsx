import React, { useState, useRef } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  History,
  Layers,
  Sparkles,
  Tag,
  Network,
  Calendar,
  Loader2,
} from 'lucide-react';
import { DocumentVersion } from '@/types';

export const DocumentsPage: React.FC = () => {
  const {
    activeProject,
    documents,
    activeDocument,
    selectDocumentById,
    loadDocuments,
  } = useProjectStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);
  const [uploadStep, setUploadStep] = useState<string>('');

  // Version history modal state
  const [selectedDocForHistory, setSelectedDocForHistory] = useState<string | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Please select a valid PDF file (.pdf)');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Please drop a valid PDF file (.pdf)');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !activeProject) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadStep('Parsing PDF pages & extracting structured tables...');

    try {
      const timer1 = setTimeout(() => {
        setUploadStep('Generating text chunks & vector embeddings...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setUploadStep('Extracting traceability entities & architecture triples...');
      }, 3000);

      const result = await api.uploadDocument(activeProject.id, selectedFile);

      clearTimeout(timer1);
      clearTimeout(timer2);

      setUploadSuccess(result);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload document list and set as active
      await loadDocuments(activeProject.id);
      selectDocumentById(result.document_id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Document processing failed');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const handleOpenVersions = async (documentId: string) => {
    if (!activeProject) return;
    setSelectedDocForHistory(documentId);
    setIsLoadingVersions(true);
    try {
      const data = await api.getDocumentVersions(activeProject.id, documentId);
      setVersions(data);
    } catch (err) {
      console.error(err);
      setVersions([]);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-blue-400" />
          Document Management &amp; Ingestion
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload AUTOSAR High-Level Design specifications (PDF) for full-pipeline parsing, chunking, and knowledge graph extraction.
        </p>
      </div>

      {/* Upload Dropzone Card */}
      <Card variant="elevated" className="p-6 md:p-8">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-400" />
          Upload AUTOSAR Specification
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Supported format: PDF. The ingestion pipeline extracts text, structural metadata, system entities, and relationship triples.
        </p>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-8 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/70 transition-all duration-200 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />

          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          {selectedFile ? (
            <div>
              <p className="text-sm font-semibold text-slate-100">{selectedFile.name}</p>
              <p className="text-xs text-slate-400 mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB &bull; Ready to process
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-200">
                Click to browse or drag and drop your AUTOSAR PDF here
              </p>
              <p className="text-xs text-slate-500 mt-1">Maximum file size: 50MB</p>
            </div>
          )}
        </div>

        {/* Upload Feedback & Action */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {isUploading && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2.5 animate-pulse">
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-blue-400" />
                <span className="font-medium">{uploadStep || 'Processing document...'}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  Successfully processed &ldquo;{uploadSuccess.filename}&rdquo; ({uploadSuccess.pages} pages, {uploadSuccess.chunks} chunks, {uploadSuccess.traceability_count} entities)!
                </span>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || !activeProject}
            isLoading={isUploading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Process &amp; Ingest
          </Button>
        </div>
      </Card>

      {/* Documents Library Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Document Library ({documents.length})
          </h2>
          {activeProject && (
            <Badge variant="blue" size="sm">
              Project: {activeProject.name}
            </Badge>
          )}
        </div>

        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => {
              const isSelected = activeDocument?.document_id === doc.document_id;
              return (
                <Card
                  key={doc.document_id}
                  variant={isSelected ? 'elevated' : 'default'}
                  className={`relative flex flex-col justify-between transition-all ${
                    isSelected ? 'ring-2 ring-blue-500/80 bg-blue-950/20' : ''
                  }`}
                >
                  <div>
                    {/* Header: Title and Version */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="p-2 rounded-xl bg-slate-800 text-blue-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-semibold text-slate-100 truncate" title={doc.filename}>
                            {doc.filename}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            ID: {doc.document_id}
                          </div>
                        </div>
                      </div>

                      <Badge variant={isSelected ? 'emerald' : 'slate'} size="sm">
                        v{doc.version || 1}
                      </Badge>
                    </div>

                    {/* Stats Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-3 my-2 border-y border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pages:</span>
                        <span className="font-semibold text-slate-200">{doc.pages}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Chunks:</span>
                        <span className="font-semibold text-slate-200">{doc.chunks}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Tag className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Entities:</span>
                        <span className="font-semibold text-slate-200">{doc.traceability_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Network className="w-3.5 h-3.5 text-purple-400" />
                        <span>Triples:</span>
                        <span className="font-semibold text-slate-200">{doc.relationship_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenVersions(doc.document_id)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors"
                      title="View Versions"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>History</span>
                    </button>

                    <Button
                      variant={isSelected ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => selectDocumentById(doc.document_id)}
                      disabled={isSelected}
                    >
                      {isSelected ? 'Active Document' : 'Set as Active'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No Documents Found"
            description="Upload an AUTOSAR PDF specification above to populate your workspace."
          />
        )}
      </div>

      {/* Version History Modal */}
      <Modal
        isOpen={!!selectedDocForHistory}
        onClose={() => setSelectedDocForHistory(null)}
        title="Document Version History"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Document ID: <code className="text-blue-300 font-mono">{selectedDocForHistory}</code>
          </p>

          {isLoadingVersions ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading version records...</p>
            </div>
          ) : versions.length > 0 ? (
            <div className="space-y-2.5">
              {versions.map((ver) => (
                <div
                  key={ver.version}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="blue" size="sm">
                      Version {ver.version}
                    </Badge>
                    <div className="text-xs text-slate-400">
                      <span>{ver.page_count} Pages</span> &bull; <span>{ver.chunk_count} Chunks</span>
                    </div>
                  </div>
                  {ver.upload_timestamp && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(ver.upload_timestamp).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-4">
              Only initial version recorded.
            </div>
          )}

          <div className="flex justify-end pt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedDocForHistory(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
