import React, { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  GitCompare,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Equal,
  FileText,
} from 'lucide-react';
import { ComparisonResult } from '@/types';

export const ComparePage: React.FC = () => {
  const { activeProject, documents } = useProjectStore();

  const [mode, setMode] = useState<'stored' | 'files'>('stored');

  // Stored mode state
  const [baselineDocId, setBaselineDocId] = useState<string>('');
  const [currentDocId, setCurrentDocId] = useState<string>('');

  // Files mode state
  const [baselineFile, setBaselineFile] = useState<File | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // Result state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<'added' | 'removed' | 'unchanged'>('added');

  const handleRunComparison = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === 'stored') {
        if (!baselineDocId || !currentDocId) {
          setError('Please select both a baseline and current document.');
          setIsLoading(false);
          return;
        }
        if (baselineDocId === currentDocId) {
          setError('Please select two distinct documents for comparison.');
          setIsLoading(false);
          return;
        }
        const res = await api.compareDocuments(activeProject.id, baselineDocId, currentDocId);
        setResult(res);
      } else {
        if (!baselineFile || !currentFile) {
          setError('Please upload both baseline and current PDF files.');
          setIsLoading(false);
          return;
        }
        const res = await api.compareFiles(activeProject.id, baselineFile, currentFile);
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <GitCompare className="w-6 h-6 text-blue-400" />
          Specification Drift &amp; Architecture Comparison
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Compare two versions of an AUTOSAR specification to detect added components, removed interfaces, and altered page allocations.
        </p>
      </div>

      {/* Mode Selector and Input Card */}
      <Card variant="elevated" className="p-6 space-y-6">
        {/* Toggle Mode */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => {
              setMode('stored');
              setResult(null);
              setError(null);
            }}
            className={`text-xs px-4 py-2 rounded-xl font-medium transition-colors ${
              mode === 'stored'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Compare Library Documents
          </button>
          <button
            onClick={() => {
              setMode('files');
              setResult(null);
              setError(null);
            }}
            className={`text-xs px-4 py-2 rounded-xl font-medium transition-colors ${
              mode === 'files'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Direct Dual-PDF Upload
          </button>
        </div>

        {/* Form Inputs based on mode */}
        {mode === 'stored' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Baseline Document (Previous Version)
              </label>
              <select
                value={baselineDocId}
                onChange={(e) => setBaselineDocId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select baseline document...</option>
                {documents.map((d) => (
                  <option key={d.document_id} value={d.document_id}>
                    {d.filename} (v{d.version || 1}) - {d.pages} pages
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Current Document (Newer Version)
              </label>
              <select
                value={currentDocId}
                onChange={(e) => setCurrentDocId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select current document...</option>
                {documents.map((d) => (
                  <option key={d.document_id} value={d.document_id}>
                    {d.filename} (v{d.version || 1}) - {d.pages} pages
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Baseline File Upload */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Baseline PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setBaselineFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              {baselineFile && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>{baselineFile.name} ({(baselineFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            {/* Current File Upload */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Current PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setCurrentFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              {currentFile && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentFile.name} ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleRunComparison}
            isLoading={isLoading}
            leftIcon={<GitCompare className="w-4 h-4" />}
          >
            Compute Specification Drift
          </Button>
        </div>
      </Card>

      {/* Comparison Results */}
      {result ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              variant="interactive"
              onClick={() => setActiveTab('added')}
              className={`p-5 flex items-center justify-between border-emerald-900/40 ${
                activeTab === 'added' ? 'ring-2 ring-emerald-500/60 bg-emerald-950/20' : ''
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                  <PlusCircle className="w-4 h-4" />
                  Added Entities
                </div>
                <div className="text-2xl font-bold text-white">{result.added.length}</div>
              </div>
              <Badge variant="emerald" size="sm">New</Badge>
            </Card>

            <Card
              variant="interactive"
              onClick={() => setActiveTab('removed')}
              className={`p-5 flex items-center justify-between border-rose-900/40 ${
                activeTab === 'removed' ? 'ring-2 ring-rose-500/60 bg-rose-950/20' : ''
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                  <MinusCircle className="w-4 h-4" />
                  Removed Entities
                </div>
                <div className="text-2xl font-bold text-white">{result.removed.length}</div>
              </div>
              <Badge variant="rose" size="sm">Deprecated</Badge>
            </Card>

            <Card
              variant="interactive"
              onClick={() => setActiveTab('unchanged')}
              className={`p-5 flex items-center justify-between border-blue-900/40 ${
                activeTab === 'unchanged' ? 'ring-2 ring-blue-500/60 bg-blue-950/20' : ''
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                  <Equal className="w-4 h-4" />
                  Unchanged Entities
                </div>
                <div className="text-2xl font-bold text-white">{result.unchanged.length}</div>
              </div>
              <Badge variant="blue" size="sm">Stable</Badge>
            </Card>
          </div>

          {/* Details Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white capitalize">
                {activeTab} Entities ({result[activeTab].length})
              </h3>
            </div>

            {result[activeTab].length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Entity Identifier</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Page Information</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {result[activeTab].map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-100">{item.entity}</td>
                        <td className="py-3 px-4">
                          <Badge variant="slate" size="sm">
                            {item.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {item.page_changed ? (
                            <span className="text-amber-400">
                              Moved from P.{item.old_page} &rarr; P.{item.new_page}
                            </span>
                          ) : item.page ? (
                            `Page ${item.page}`
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 italic">
                No {activeTab} entities in this comparison.
              </div>
            )}
          </Card>
        </div>
      ) : (
        !isLoading && (
          <EmptyState
            icon={GitCompare}
            title="No Comparison Executed"
            description="Select baseline and current specifications above and click 'Compute Specification Drift' to inspect added and removed entities."
          />
        )
      )}
    </div>
  );
};
