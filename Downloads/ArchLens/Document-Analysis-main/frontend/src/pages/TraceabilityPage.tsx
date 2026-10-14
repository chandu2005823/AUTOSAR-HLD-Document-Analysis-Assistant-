import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ListTree,
  Search,
  ExternalLink,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { TraceabilityRecord, RelationshipRecord } from '@/types';

export const TraceabilityPage: React.FC = () => {
  const { activeProject, activeDocument, documents } = useProjectStore();

  const [records, setRecords] = useState<TraceabilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocument?.document_id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Inspector state
  const [selectedEntity, setSelectedEntity] = useState<TraceabilityRecord | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'evidence' | 'relationships'>('overview');
  const [evidenceContext, setEvidenceContext] = useState<string | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [entityRelationships, setEntityRelationships] = useState<RelationshipRecord[]>([]);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);

  // Sync active document selection if changed
  useEffect(() => {
    if (activeDocument && !selectedDocId) {
      setSelectedDocId(activeDocument.document_id);
    }
  }, [activeDocument]);

  // Load records
  useEffect(() => {
    if (!activeProject) return;

    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const data = await api.listTraceability(activeProject.id, {
          document_id: selectedDocId || undefined,
          entity_type: selectedType !== 'All' ? selectedType : undefined,
          search: searchQuery || undefined,
        });
        setRecords(data);
      } catch (err) {
        console.error(err);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [activeProject, selectedDocId, selectedType, searchQuery]);

  // Handle entity selection in inspector
  const handleSelectEntity = async (entity: TraceabilityRecord) => {
    setSelectedEntity(entity);
    setInspectorTab('overview');
    setEvidenceContext(null);
    setEntityRelationships([]);

    if (!activeProject) return;
    const docId = entity.document_id || selectedDocId || activeDocument?.document_id;

    // Pre-fetch evidence if docId available
    if (docId) {
      setIsLoadingEvidence(true);
      try {
        const res = await api.getDocumentEvidence(activeProject.id, docId, entity.entity, entity.page);
        setEvidenceContext(res.context);
      } catch {
        setEvidenceContext('No explicit contextual excerpt found for this entity.');
      } finally {
        setIsLoadingEvidence(false);
      }
    }

    // Pre-fetch relationships involving this entity
    setIsLoadingRelationships(true);
    try {
      const [srcRels, tgtRels] = await Promise.all([
        api.listRelationships(activeProject.id, { document_id: docId, source: entity.entity }),
        api.listRelationships(activeProject.id, { document_id: docId, target: entity.entity }),
      ]);
      // Deduplicate relationships
      const combined = [...srcRels];
      for (const r of tgtRels) {
        if (!combined.some((c) => c.source === r.source && c.target === r.target && c.relationship === r.relationship)) {
          combined.push(r);
        }
      }
      setEntityRelationships(combined);
    } catch {
      setEntityRelationships([]);
    } finally {
      setIsLoadingRelationships(false);
    }
  };

  // Derive distinct entity types for filter
  const entityTypes = ['All', 'Component', 'Interface', 'Port', 'DataType', 'Runnable', 'Requirement'];

  const getTypeBadgeVariant = (type: string = '') => {
    switch (type.toLowerCase()) {
      case 'component':
        return 'blue';
      case 'interface':
        return 'emerald';
      case 'port':
        return 'amber';
      case 'datatype':
        return 'purple';
      case 'requirement':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <ListTree className="w-6 h-6 text-blue-400" />
          Traceability Matrix &amp; Entity Registry
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Cross-reference AUTOSAR software components, interfaces, ports, and requirements against exact source document page numbers.
        </p>
      </div>

      {/* Filter and Control Bar */}
      <Card variant="glass" className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Document Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Document Scope
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Documents in Project</option>
              {documents.map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  {d.filename} (v{d.version || 1})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Search Entity Name
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword (e.g. Engine, CAN, Sensor)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Entity Classification
            </label>
            <div className="flex flex-wrap gap-1.5">
              {entityTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    selectedType === t
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Layout: Table & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table / List Container */}
        <div className={selectedEntity ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Extracted Entities ({records.length})
              </span>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            </div>

            {records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Entity Identifier</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Page</th>
                      <th className="py-3 px-4">Document</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {records.map((rec, idx) => {
                      const isSelected = selectedEntity?.entity === rec.entity && selectedEntity?.page === rec.page;
                      return (
                        <tr
                          key={idx}
                          onClick={() => handleSelectEntity(rec)}
                          className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-950/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            <span>{rec.entity}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getTypeBadgeVariant(rec.type)} size="sm">
                              {rec.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300">
                              P.{rec.page}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                            {rec.document_id || selectedDocId || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectEntity(rec);
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              !isLoading && (
                <EmptyState
                  icon={ListTree}
                  title="No Traceability Records Found"
                  description="No entities match the selected document scope, classification, or search query."
                />
              )
            )}
          </Card>
        </div>

        {/* Right Inspector Panel */}
        {selectedEntity && (
          <div className="lg:col-span-1">
            <Card variant="elevated" className="sticky top-20 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="truncate">
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    Entity Inspector
                  </div>
                  <h3 className="text-base font-bold text-white truncate" title={selectedEntity.entity}>
                    {selectedEntity.entity}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setInspectorTab('overview')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    inspectorTab === 'overview'
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setInspectorTab('evidence')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    inspectorTab === 'evidence'
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Source Context
                </button>
                <button
                  onClick={() => setInspectorTab('relationships')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    inspectorTab === 'relationships'
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Links ({entityRelationships.length})
                </button>
              </div>

              {/* Tab 1: Overview */}
              {inspectorTab === 'overview' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Classification:</span>
                      <Badge variant={getTypeBadgeVariant(selectedEntity.type)} size="sm">
                        {selectedEntity.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Source Page:</span>
                      <span className="text-slate-100 font-bold">Page {selectedEntity.page}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Document Scope:</span>
                      <span className="text-blue-300 font-mono text-[11px] truncate max-w-[140px]">
                        {selectedEntity.document_id || selectedDocId || '-'}
                      </span>
                    </div>
                  </div>

                  {selectedEntity.context && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-medium">Quick Context:</span>
                      <p className="text-slate-300 leading-relaxed italic">
                        &ldquo;{selectedEntity.context}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Full Evidence Excerpt */}
              {inspectorTab === 'evidence' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Source Excerpt (Page {selectedEntity.page})</span>
                    {isLoadingEvidence && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {evidenceContext || (isLoadingEvidence ? 'Retrieving source context...' : 'No context excerpt found.')}
                  </div>
                </div>
              )}

              {/* Tab 3: Connected Relationships */}
              {inspectorTab === 'relationships' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Architectural Links for <strong>{selectedEntity.entity}</strong>
                  </div>

                  {isLoadingRelationships ? (
                    <div className="py-6 text-center">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400 mx-auto" />
                    </div>
                  ) : entityRelationships.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {entityRelationships.map((r, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="font-semibold text-blue-300 truncate max-w-[100px]">{r.source}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                            <Badge variant="purple" size="sm">{r.relationship}</Badge>
                            <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="font-semibold text-cyan-300 truncate max-w-[100px]">{r.target}</span>
                          </div>
                          {r.page && (
                            <div className="text-[10px] text-slate-500">
                              Document Page {r.page}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-4">
                      No connected relationships recorded for this entity.
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
