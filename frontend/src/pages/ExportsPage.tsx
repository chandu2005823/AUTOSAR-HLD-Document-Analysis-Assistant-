import React, { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  Download,
  FileSpreadsheet,
  FileJson,
  ListTree,
  Network,
  GitCompare,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ExportsPage: React.FC = () => {
  const { activeProject, documents } = useProjectStore();

  const [downloadingArtifact, setDownloadingArtifact] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Comparison export document parameters
  const [baselineDocId, setBaselineDocId] = useState<string>('');
  const [currentDocId, setCurrentDocId] = useState<string>('');

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExport = async (
    artifact: 'traceability' | 'relationships' | 'comparison',
    format: 'json' | 'csv'
  ) => {
    if (!activeProject) return;

    if (artifact === 'comparison' && (!baselineDocId || !currentDocId)) {
      setError('Please select both baseline and current documents for comparison export.');
      return;
    }

    setDownloadingArtifact(`${artifact}-${format}`);
    setError(null);
    setSuccess(null);

    try {
      const blob = await api.downloadExport(
        activeProject.id,
        artifact,
        format,
        baselineDocId || undefined,
        currentDocId || undefined
      );

      const filename = `autoarch_${artifact}_project${activeProject.id}_${Date.now()}.${format}`;
      triggerDownload(blob, filename);
      setSuccess(`Exported ${artifact.toUpperCase()} as ${format.toUpperCase()}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setDownloadingArtifact(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Download className="w-6 h-6 text-blue-400" />
          Data Artifact Exports
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Export full traceability matrices, architecture dependency tables, and specification drift reports into JSON or CSV.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Traceability Export */}
        <Card variant="elevated" className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 w-fit mb-3">
              <ListTree className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white">Traceability Matrix</h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete index of AUTOSAR entities, component classifications, source page mappings, and context excerpts.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-between"
              leftIcon={<FileJson className="w-4 h-4 text-amber-400" />}
              isLoading={downloadingArtifact === 'traceability-json'}
              onClick={() => handleExport('traceability', 'json')}
            >
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
              isLoading={downloadingArtifact === 'traceability-csv'}
              onClick={() => handleExport('traceability', 'csv')}
            >
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Architecture Relationships Export */}
        <Card variant="elevated" className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit mb-3">
              <Network className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white">Architecture Relationships</h2>
            <p className="text-xs text-slate-400 mt-1">
              Extracted knowledge graph triples connecting source components, call relationships, and destination ports.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-between"
              leftIcon={<FileJson className="w-4 h-4 text-amber-400" />}
              isLoading={downloadingArtifact === 'relationships-json'}
              onClick={() => handleExport('relationships', 'json')}
            >
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
              isLoading={downloadingArtifact === 'relationships-csv'}
              onClick={() => handleExport('relationships', 'csv')}
            >
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Specification Drift Export */}
        <Card variant="elevated" className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 w-fit mb-3">
              <GitCompare className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white">Specification Drift</h2>
            <p className="text-xs text-slate-400 mt-1">
              Diff comparison dataset capturing additions, deletions, and page movements between two specification versions.
            </p>

            <div className="space-y-2 mt-4">
              <select
                value={baselineDocId}
                onChange={(e) => setBaselineDocId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="">Baseline Document...</option>
                {documents.map((d) => (
                  <option key={d.document_id} value={d.document_id}>
                    {d.filename} (v{d.version || 1})
                  </option>
                ))}
              </select>

              <select
                value={currentDocId}
                onChange={(e) => setCurrentDocId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="">Current Document...</option>
                {documents.map((d) => (
                  <option key={d.document_id} value={d.document_id}>
                    {d.filename} (v{d.version || 1})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-between"
              leftIcon={<FileJson className="w-4 h-4 text-amber-400" />}
              isLoading={downloadingArtifact === 'comparison-json'}
              onClick={() => handleExport('comparison', 'json')}
            >
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
              isLoading={downloadingArtifact === 'comparison-csv'}
              onClick={() => handleExport('comparison', 'csv')}
            >
              Export CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
