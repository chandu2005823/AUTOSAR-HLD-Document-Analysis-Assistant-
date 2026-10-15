import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  HelpCircle,
  Sparkles,
  Send,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { QAResponse } from '@/types';

export const GroundedQAPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProject } = useProjectStore();

  const [question, setQuestion] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QAResponse | null>(null);
  const [showAllSources, setShowAllSources] = useState(false);

  const presetQuestions = [
    'What are the core components of the AUTOSAR BSW?',
    'Explain the relationship between RTE and SWC.',
    'What are the functional safety and diagnostic requirements?',
    'What communication stacks (CAN, LIN, FlexRay, Ethernet) are specified?',
  ];

  const executeAsk = async (queryText: string) => {
    if (!activeProject || !queryText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.askQuestion(activeProject.id, queryText.trim());
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query architecture');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run if query param provided
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && activeProject && !result && !isLoading) {
      setQuestion(q);
      executeAsk(q);
    }
  }, [searchParams, activeProject, result, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSearchParams({ q: question.trim() });
    executeAsk(question);
  };

  const handleReset = () => {
    setQuestion('');
    setResult(null);
    setError(null);
    setSearchParams({});
  };

  const getConfidenceBadge = (level: string = '') => {
    switch (level.toLowerCase()) {
      case 'high':
        return <Badge variant="emerald" size="sm">High Confidence</Badge>;
      case 'medium':
        return <Badge variant="amber" size="sm">Medium Confidence</Badge>;
      case 'low':
      default:
        return <Badge variant="rose" size="sm">Low Confidence</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            Grounded Architectural Q&amp;A
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Ask complex architectural questions with verified page citations, vector retrieval confidence, and hallucination grounding checks.
          </p>
        </div>

        {result && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            New Investigation
          </Button>
        )}
      </div>

      {/* Query Input Card */}
      <Card variant="elevated" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Architectural Question
            </label>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., How does the Runtime Environment (RTE) mediate communication between software components (SWC) and the Basic Software (BSW)?"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Preset Question Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Suggested:
            </span>
            {presetQuestions.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(preset);
                  setSearchParams({ q: preset });
                  executeAsk(preset);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-colors text-left"
              >
                {preset}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!question.trim() || isLoading || !activeProject}
              isLoading={isLoading}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Analyze Architecture
            </Button>
          </div>
        </form>
      </Card>

      {/* Query Result Section */}
      {result ? (
        <div className="space-y-6">
          {/* Main Answer Card */}
          <Card variant="default" className="p-6 md:p-8 space-y-6 border-blue-900/40 shadow-xl">
            {/* Header: Status badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-slate-200">Confidence:</span>
                {getConfidenceBadge(result.retrieval_confidence?.level)}
                <span className="text-xs text-slate-400">
                  ({Math.round((result.retrieval_confidence?.score || 0) * 100)}%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">Grounding:</span>
                {result.grounding?.supported ? (
                  <Badge variant="emerald" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                    Verified Evidence ({Math.round((result.grounding?.score || 0) * 100)}%)
                  </Badge>
                ) : (
                  <Badge variant="amber" size="sm" icon={<ShieldAlert className="w-3.5 h-3.5" />}>
                    Partial Support ({Math.round((result.grounding?.score || 0) * 100)}%)
                  </Badge>
                )}
              </div>
            </div>

            {/* Answer Content */}
            <div className="text-sm sm:text-base leading-relaxed text-slate-100 whitespace-pre-wrap">
              {result.answer}
            </div>

            {/* Primary Citation Box */}
            {result.primary_source && (
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                    Primary Evidence Anchor
                  </span>
                  <span>Page {result.primary_source.page} &bull; Chunk #{result.primary_source.chunk_id}</span>
                </div>
                {result.primary_source.text && (
                  <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    &ldquo;{result.primary_source.text}&rdquo;
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Supporting Evidence Sources Accordion */}
          {result.sources && result.sources.length > 0 && (
            <Card className="p-6">
              <div
                onClick={() => setShowAllSources(!showAllSources)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Supporting Citations &amp; Excerpts ({result.sources.length})
                  </h3>
                </div>
                <button className="text-slate-400 hover:text-white p-1">
                  {showAllSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showAllSources && (
                <div className="mt-4 space-y-3 pt-3 border-t border-slate-800">
                  {result.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <span className="text-blue-300">Citation #{idx + 1}</span>
                        <span>Page {src.page} &bull; Chunk #{src.chunk_id}</span>
                      </div>
                      {src.text && (
                        <p className="text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
                          {src.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      ) : (
        !isLoading && (
          <EmptyState
            icon={HelpCircle}
            title="No Active Architectural Investigation"
            description="Type a question above or select one of the suggested prompts to query your AUTOSAR specification with verified citations."
          />
        )
      )}
    </div>
  );
};
