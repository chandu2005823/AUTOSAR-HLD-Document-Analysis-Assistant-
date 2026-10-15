import React, { useEffect, useRef } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import { GraphNode, GraphEdge } from '@/types';

interface ArchitectureGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (nodeId: string | null) => void;
  onSelectEdge?: (edgeId: number | null) => void;
  selectedNodeId?: string | null;
  selectedEdgeId?: number | null;
  className?: string;
}

export const ArchitectureGraph: React.FC<ArchitectureGraphProps> = ({
  nodes,
  edges,
  onSelectNode,
  onSelectEdge,
  selectedNodeId,
  selectedEdgeId,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Map nodes to vis-network format with thematic coloring
    const visNodes = new DataSet(
      nodes.map((node) => {
        let bgColor = '#1E293B';
        let borderColor = '#3B82F6';

        const labelLower = node.label.toLowerCase();
        if (labelLower.includes('rte') || labelLower.includes('engine') || labelLower.includes('bsw')) {
          bgColor = '#1E3A8A';
          borderColor = '#60A5FA';
        } else if (labelLower.includes('sensor') || labelLower.includes('actuator') || labelLower.includes('io')) {
          bgColor = '#064E3B';
          borderColor = '#34D399';
        } else if (labelLower.includes('can') || labelLower.includes('com') || labelLower.includes('network')) {
          bgColor = '#4C1D95';
          borderColor = '#A78BFA';
        } else if (labelLower.includes('diag') || labelLower.includes('dem') || labelLower.includes('dcm')) {
          bgColor = '#78350F';
          borderColor = '#FBBF24';
        }

        return {
          id: node.id,
          label: node.label,
          shape: 'box',
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
          borderWidth: 1.5,
          color: {
            background: bgColor,
            border: borderColor,
            highlight: {
              background: '#2563EB',
              border: '#93C5FD',
            },
            hover: {
              background: '#1D4ED8',
              border: '#60A5FA',
            },
          },
          font: {
            color: '#F8FAFC',
            size: 13,
            face: 'Inter, system-ui, sans-serif',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.4)',
            size: 8,
            x: 2,
            y: 4,
          },
        };
      })
    );

    // Map edges to vis-network format
    const visEdges = new DataSet(
      edges.map((edge) => ({
        id: edge.id,
        from: edge.source,
        to: edge.target,
        label: edge.relationship,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.75,
          },
        },
        color: {
          color: '#475569',
          highlight: '#38BDF8',
          hover: '#94A3B8',
        },
        font: {
          color: '#94A3B8',
          size: 10,
          align: 'middle',
          background: '#0B1020',
          strokeWidth: 0,
        },
        smooth: {
          type: 'cubicBezier',
          forceDirection: 'none',
          roundness: 0.25,
        },
      }))
    );

    const data: any = {
      nodes: visNodes,
      edges: visEdges,
    };

    const options = {
      autoResize: true,
      height: '100%',
      width: '100%',
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 120,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 0.8,
        },
        stabilization: {
          iterations: 150,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
        dragNodes: true,
      },
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    network.on('click', (params: any) => {
      if (params.nodes && params.nodes.length > 0) {
        onSelectNode?.(params.nodes[0]);
        onSelectEdge?.(null);
      } else if (params.edges && params.edges.length > 0) {
        onSelectEdge?.(params.edges[0]);
        onSelectNode?.(null);
      } else {
        onSelectNode?.(null);
        onSelectEdge?.(null);
      }
    });

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [nodes, edges]);

  // Handle external selection
  useEffect(() => {
    if (!networkRef.current) return;
    if (selectedNodeId) {
      networkRef.current.selectNodes([selectedNodeId]);
    } else if (selectedEdgeId) {
      networkRef.current.selectEdges([selectedEdgeId]);
    } else {
      networkRef.current.unselectAll();
    }
  }, [selectedNodeId, selectedEdgeId]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[500px] rounded-2xl bg-[#090E1A] border border-slate-800 relative overflow-hidden ${
        className || ''
      }`}
    />
  );
};
