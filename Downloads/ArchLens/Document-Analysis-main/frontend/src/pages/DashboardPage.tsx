import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  FileText,
  HelpCircle,
  Network,
  ListTree,
  Upload,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { activeProject, activeDocument, documents, selectDocumentById } = useProjectStore();
  const navigate = useNavigate();

  const [quickQuestion, setQuickQuestion] = useState('');

  const handleQuickAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    navigate(`/qa?q=${encodeURIComponent(quickQuestion.trim())}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-[#0F172A] border border-blue-900/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <Badge variant="cyan" size="sm" className="mb-3">
            AUTOSAR Adaptive &amp; Classic HLD Engine
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            AI-Powered AUTOSAR High-Level Design Intelligence
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Extract traceability matrices, verify architecture relationships, query multi-page specifications with grounded citations, and detect version drift across ECU specifications.
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => navigate('/documents')}
            >
              Upload Document
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<HelpCircle className="w-4 h-4" />}
              onClick={() => navigate('/qa')}
            >
              Grounded Q&amp;A
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Network className="w-4 h-4" />}
              onClick={() => navigate('/architecture')}
            >
              Explore Architecture
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ListTree className="w-4 h-4" />}
              onClick={() => navigate('/traceability')}
            >
              Traceability Matrix
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Query Bar */}
      <Card variant="glass" className="p-4 sm:p-6">
        <form onSubmit={handleQuickAsk} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 w-full">
            <input
              type="text"
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
              placeholder="Ask any architectural question (e.g. 'What are the main communication channels in the BSW?')..."
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0"
          >
            Investigate
          </Button>
        </form>
      </Card>

      {/* Grid: Active Document Metrics & Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Document Card */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Active Document Analysis
              </h2>
              {activeDocument && (
                <Badge variant="emerald" size="sm">
                  Loaded &amp; Ready
                </Badge>
              )}
            </div>

            {activeDocument ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-sm font-bold text-slate-100 mb-1">
                    {activeDocument.filename}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Document ID: <code className="text-blue-300 font-mono">{activeDocument.document_id}</code></span>
                    <span>&bull;</span>
                    <span>Version: v{activeDocument.version || 1}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Pages
                    </div>
                    <div className="text-lg font-bold text-slate-100">
                      {activeDocument.pages ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Chunks
                    </div>
                    <div className="text-lg font-bold text-slate-100">
                      {activeDocument.chunks ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      Entities
                    </div>
                    <div className="text-lg font-bold text-slate-100">
                      {activeDocument.traceability_count ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <Network className="w-3.5 h-3.5 text-purple-400" />
                      Triples
                    </div>
                    <div className="text-lg font-bold text-slate-100">
                      {activeDocument.relationship_count ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No Active Document"
                description="Upload a new AUTOSAR specification or select one from your library to begin analysis."
                actionLabel="Go to Documents"
                onAction={() => navigate('/documents')}
              />
            )}
          </div>

          {activeDocument && (
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Processed with Vector RAG &amp; Rule Extraction
              </span>
              <div className="flex items-center gap-2">
                <Link
                  to="/traceability"
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  View Matrix &rarr;
                </Link>
                <span className="text-slate-600">&bull;</span>
                <Link
                  to="/architecture"
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                >
                  View Graph &rarr;
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Security & Access Summary */}
        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Session &amp; Security
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">Logged in as</span>
                <span className="font-semibold text-slate-200">{user?.username}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">System Role</span>
                <Badge variant={user?.role === 'admin' ? 'purple' : 'blue'} size="sm">
                  {user?.role}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">Active Project</span>
                <span className="font-semibold text-slate-200 truncate max-w-[140px]">
                  {activeProject?.name || 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">Project Role</span>
                <Badge variant="slate" size="sm">
                  {activeProject?.role || 'viewer'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">Vector Engine</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ChromaDB
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              to="/settings"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Account &amp; Project Settings &rarr;
            </Link>
          </div>
        </Card>
      </div>

      {/* Document Library List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Project Documents ({documents.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/documents')}
          >
            Manage Library
          </Button>
        </div>

        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const isSelected = activeDocument?.document_id === doc.document_id;
              return (
                <Card
                  key={doc.document_id}
                  variant={isSelected ? 'elevated' : 'interactive'}
                  onClick={() => selectDocumentById(doc.document_id)}
                  className={`relative ${
                    isSelected ? 'ring-1 ring-blue-500/80 bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {doc.filename}
                    </span>
                    <Badge variant={isSelected ? 'blue' : 'slate'} size="sm">
                      v{doc.version || 1}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 my-3">
                    <div>Pages: <span className="font-semibold text-slate-200">{doc.pages}</span></div>
                    <div>Chunks: <span className="font-semibold text-slate-200">{doc.chunks}</span></div>
                    <div>Entities: <span className="font-semibold text-slate-200">{doc.traceability_count}</span></div>
                    <div>Triples: <span className="font-semibold text-slate-200">{doc.relationship_count}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {isSelected ? 'Currently Selected' : 'Click to select'}
                    </span>
                    <span className="text-blue-400 font-medium">Select &rarr;</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No Documents Uploaded Yet"
            description="Your active project does not contain any processed AUTOSAR specifications."
            actionLabel="Upload PDF"
            onAction={() => navigate('/documents')}
          />
        )}
      </div>
    </div>
  );
};
