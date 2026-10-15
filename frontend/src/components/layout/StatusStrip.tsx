import React from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Badge } from '@/components/common/Badge';
import { FileText, Layers, Tag, Network, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StatusStrip: React.FC = () => {
  const { activeDocument, activeProject } = useProjectStore();

  if (!activeDocument) {
    return (
      <div className="bg-slate-900/80 border-b-2 border-slate-700/80 px-6 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-200 font-medium">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" />
            <span className="font-semibold tracking-wide">
              {activeProject
                ? `Project: ${activeProject.name} — No document loaded.`
                : 'No project selected.'}
            </span>
          </div>
          <Link
            to="/documents"
            className="text-blue-300 hover:text-blue-200 font-bold transition-colors tracking-wide"
          >
            Upload or select an AUTOSAR document &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#101827]/95 border-b-2 border-slate-700/90 px-6 py-3 backdrop-blur-md shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Document Identifier */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/15 text-blue-300 border-2 border-blue-500/30 shadow-md">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-100 truncate max-w-xs md:max-w-md tracking-wide">
              {activeDocument.filename}
            </span>
            <Badge variant="blue" size="sm">
              v{activeDocument.version || 1}
            </Badge>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-semibold" title="Total Pages">
            <Layers className="w-4 h-4 text-slate-300" />
            <span className="font-bold text-slate-100 text-sm">
              {activeDocument.pages ?? 0}
            </span>
            <span className="hidden sm:inline tracking-wide">pages</span>
          </div>

          <div className="h-4 w-px bg-slate-600" />

          <div className="flex items-center gap-2 text-slate-200 font-semibold" title="Extracted Chunks">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="font-bold text-slate-100 text-sm">
              {activeDocument.chunks ?? 0}
            </span>
            <span className="hidden sm:inline tracking-wide">chunks</span>
          </div>

          <div className="h-4 w-px bg-slate-600" />

          <div className="flex items-center gap-2 text-slate-200 font-semibold" title="Traceability Entities">
            <Tag className="w-4 h-4 text-cyan-300" />
            <span className="font-bold text-slate-100 text-sm">
              {activeDocument.traceability_count ?? 0}
            </span>
            <span className="hidden sm:inline tracking-wide">entities</span>
          </div>

          <div className="h-4 w-px bg-slate-600" />

          <div className="flex items-center gap-2 text-slate-200 font-semibold" title="Relationship Triples">
            <Network className="w-4 h-4 text-purple-300" />
            <span className="font-bold text-slate-100 text-sm">
              {activeDocument.relationship_count ?? 0}
            </span>
            <span className="hidden sm:inline tracking-wide">triples</span>
          </div>
        </div>
      </div>
    </div>
  );
};
