import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ArchitectureGraph } from '@/components/graph/ArchitectureGraph';
import {
  Network,
  Search,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  X,
  Loader2,
  Info,
} from 'lucide-react';
import { RelationshipGraphResponse } from '@/types';

export const ArchitecturePage: React.FC = () => {
  const { activeProject, activeDocument, documents } = useProjectStore();
  const navigate = useNavigate();

  const [graphData, setGraphData] = useState<RelationshipGraphResponse>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocument?.document_id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelType, setSelectedRelType] = useState('All');

  // Graph selections
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);

  // Evidence for selected edge
  const [edgeEvidence, setEdgeEvidence] = useState<string | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);

  useEffect(() => {
    if (activeDocument && !selectedDocId) {
      setSelectedDocId(activeDocument.document_id);
    }
  }, [activeDocument]);

  const loadGraph = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    try {
      const data = await api.getRelationshipGraph(activeProject.id, selectedDocId || undefined);
      setGraphData(data);
    } catch (err) {
      console.error(err);
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [activeProject, selectedDocId]);

  // Derive relationship types
  const relTypes = useMemo(() => {
    const set = new Set<string>();
    graphData.edges.forEach((e) => {
      if (e.relationship) set.add(e.relationship);
    });
    return ['All', ...Array.from(set)];
  }, [graphData.edges]);

  // Filtered nodes and edges
  const filteredEdges = useMemo(() => {
    return graphData.edges.filter((e) => {
      if (selectedRelType !== 'All' && e.relationship !== selectedRelType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          e.source.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q) ||
          e.relationship.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [graphData.edges, selectedRelType, searchQuery]);

  const filteredNodes = useMemo(() => {
    const connectedNodeIds = new Set<string>();
    filteredEdges.forEach((e) => {
      connectedNodeIds.add(e.source);
      connectedNodeIds.add(e.target);
    });

    return graphData.nodes.filter((n) => {
      if (searchQuery) {
        const matchesQuery = n.label.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesQuery || connectedNodeIds.has(n.id);
      }
      return connectedNodeIds.has(n.id) || graphData.nodes.length < 20;
    });
  }, [graphData.nodes, filteredEdges, searchQuery]);

  // When edge is clicked, load evidence if possible
  useEffect(() => {
    if (selectedEdgeId && activeProject) {
      const edge = graphData.edges.find((e) => e.id === selectedEdgeId);
      if (edge && (edge.document_id || selectedDocId || activeDocument?.document_id)) {
        const docId = edge.document_id || selectedDocId || activeDocument!.document_id;
        setIsLoadingEvidence(true);
        api
          .getDocumentEvidence(activeProject.id, docId, edge.source, edge.page || undefined)
          .then((res) => setEdgeEvidence(res.context))
          .catch(() => setEdgeEvidence('No contextual excerpt found for this relationship.'))
          .finally(() => setIsLoadingEvidence(false));
      } else {
        setEdgeEvidence(null);
      }
    } else {
      setEdgeEvidence(null);
    }
  }, [selectedEdgeId, graphData.edges, activeProject, selectedDocId, activeDocument]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData.nodes]);

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) return null;
    return graphData.edges.find((e) => e.id === selectedEdgeId) || null;
  }, [selectedEdgeId, graphData.edges]);

  const nodeConnectedEdges = useMemo(() => {
    if (!selectedNodeId) return { incoming: [], outgoing: [] };
    const outgoing = graphData.edges.filter((e) => e.source === selectedNodeId);
    const incoming = graphData.edges.filter((e) => e.target === selectedNodeId);
    return { incoming, outgoing };
  }, [selectedNodeId, graphData.edges]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-blue-400" />
            Architecture Knowledge Graph
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Interactive visualization of extracted AUTOSAR entities, ports, interfaces, and communication dependencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">
            {filteredNodes.length} Nodes
          </Badge>
          <Badge variant="purple" size="sm">
            {filteredEdges.length} Edges
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadGraph}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Graph
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <Card variant="glass" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Filter Node / Edge
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search component, interface, or relationship..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Relationship Type
            </label>
            <select
              value={selectedRelType}
              onChange={(e) => setSelectedRelType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {relTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[550px]">
        {/* Graph Canvas */}
        <div className="lg:col-span-3 h-[550px] relative">
          {isLoading ? (
            <div className="w-full h-full rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                <p className="text-xs text-slate-400">Rendering architecture knowledge graph...</p>
              </div>
            </div>
          ) : filteredNodes.length > 0 ? (
            <ArchitectureGraph
              nodes={filteredNodes}
              edges={filteredEdges}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                setSelectedEdgeId(null);
              }}
              onSelectEdge={(id) => {
                setSelectedEdgeId(id);
                setSelectedNodeId(null);
              }}
            />
          ) : (
            <div className="w-full h-full rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-center">
              <EmptyState
                icon={Network}
                title="No Graph Elements Found"
                description="Upload an AUTOSAR specification or adjust your search filter to visualize architectural relationships."
              />
            </div>
          )}
        </div>

        {/* Inspector Side Drawer */}
        <div className="lg:col-span-1">
          <Card variant="elevated" className="h-full max-h-[550px] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Graph Inspector
              </div>
              {(selectedNodeId || selectedEdgeId) && (
                <button
                  onClick={() => {
                    setSelectedNodeId(null);
                    setSelectedEdgeId(null);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* When a Node is Selected */}
            {selectedNode && (
              <div className="space-y-4">
                <div>
                  <Badge variant="blue" size="sm" className="mb-1.5">
                    Component / Entity
                  </Badge>
                  <h3 className="text-base font-bold text-white break-words">
                    {selectedNode.label}
                  </h3>
                </div>

                {/* Outgoing connections */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">
                    Outgoing Calls ({nodeConnectedEdges.outgoing.length})
                  </div>
                  {nodeConnectedEdges.outgoing.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {nodeConnectedEdges.outgoing.map((e) => (
                        <div
                          key={e.id}
                          className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs flex items-center gap-1.5"
                        >
                          <Badge variant="purple" size="sm">{e.relationship}</Badge>
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-cyan-300 font-medium truncate">{e.target}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No outgoing connections</p>
                  )}
                </div>

                {/* Incoming connections */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">
                    Incoming Calls ({nodeConnectedEdges.incoming.length})
                  </div>
                  {nodeConnectedEdges.incoming.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {nodeConnectedEdges.incoming.map((e) => (
                        <div
                          key={e.id}
                          className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs flex items-center gap-1.5"
                        >
                          <span className="text-blue-300 font-medium truncate">{e.source}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                          <Badge variant="purple" size="sm">{e.relationship}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No incoming connections</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate('/traceability')}
                    rightIcon={<ExternalLink className="w-3 h-3" />}
                  >
                    View in Traceability Matrix
                  </Button>
                </div>
              </div>
            )}

            {/* When an Edge is Selected */}
            {selectedEdge && (
              <div className="space-y-4">
                <div>
                  <Badge variant="purple" size="sm" className="mb-1.5">
                    Relationship Link
                  </Badge>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Source:</span>
                      <span className="font-semibold text-blue-300">{selectedEdge.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Rel:</span>
                      <Badge variant="purple" size="sm">{selectedEdge.relationship}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Target:</span>
                      <span className="font-semibold text-cyan-300">{selectedEdge.target}</span>
                    </div>
                    {selectedEdge.page && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Page:</span>
                        <span className="font-mono text-slate-200">Page {selectedEdge.page}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence snippet */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span>Source Excerpt</span>
                    {isLoadingEvidence && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {edgeEvidence || (isLoadingEvidence ? 'Retrieving citation...' : 'No citation available.')}
                  </div>
                </div>
              </div>
            )}

            {/* When nothing is selected */}
            {!selectedNode && !selectedEdge && (
              <div className="py-12 text-center space-y-3">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click on any component node or directed link on the canvas to inspect dependencies and source page citations.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
