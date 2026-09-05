import React, { useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';
import './Graphcanvas.css';

const CY_STYLE = [
  {
    selector: 'node',
    style: {
      'background-color': '#151515',
      'border-color': '#2a2a2a',
      'border-width': '0.5px',
      label: 'data(label)',
      color: '#aaaaaa',
      'font-size': '11px',
      'font-family': "'DM Sans', sans-serif",
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '80px',
      width: '90px',
      height: '36px',
      shape: 'roundrectangle',
    },
  },
  {
    selector: 'node[tier = 0]',
    style: {
      'background-color': '#1e1e1e',
      'border-color': '#555555',
      'border-width': '1px',
      color: '#e8e8e8',
      'font-size': '12px',
      'font-weight': '500',
      width: '110px',
      height: '42px',
    },
  },
  {
    selector: 'node[tier = 2]',
    style: {
      'background-color': '#0f0f0f',
      'border-color': '#1e1e1e',
      color: '#666666',
      'font-size': '10px',
      width: '78px',
      height: '30px',
    },
  },
  {
    selector: 'node.highlighted',
    style: {
      'border-color': '#e8e8e8',
      'border-width': '1px',
      color: '#ffffff',
      'background-color': '#222222',
    },
  },
  {
    selector: 'node[type = "contextual"]',
    style: {
      'background-color': '#0d1117',
      'border-color': '#3a3a5c',
      'border-width': '1px',
      'border-style': 'dashed',
      label: 'data(label)',
      color: '#a0a8c0',
      'font-size': '10px',
      'font-family': "'Space Mono', monospace",
      'text-valign': 'center',
      'text-halign': 'left',
      'text-justification':'left',
      'text-wrap': 'wrap',
      'text-max-width': '280px',
      'text-overflow-wrap': 'whitespace',
      'text-margin-x':'12px',
      width: '300px',
      height: 'label',
      padding: '14px',
      shape: 'roundrectangle',
    },
  },
  {
    selector: 'node[type = "contextual-loading"]',
    style: {
      'background-color': '#0d1117',
      'border-color': '#3a3a5c',
      'border-width': '1px',
      'border-style': 'dashed',
      label: '✦ generating...',
      color: '#555577',
      'font-size': '10px',
      'font-family': "'Space Mono', monospace",
      'text-valign': 'center',
      'text-halign': 'center',
      width: '160px',
      height: '44px',
      shape: 'roundrectangle',
    },
  },
  {
    selector: 'edge',
    style: {
      width: '0.5px',
      'line-color': '#1e1e1e',
      'curve-style': 'bezier',
      'target-arrow-color': '#2a2a2a',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.6,
    },
  },
  {
    selector: 'edge[type = "contextual"]',
    style: {
      width: '0.5px',
      'line-color': '#3a3a5c',
      'line-style': 'dashed',
      'line-dash-pattern': [4, 3],
      'curve-style': 'bezier',
      'target-arrow-shape': 'none',
    },
  },
];

const LAYOUT = {
  name: 'cose',
  animate: true,
  animationDuration: 500,
  padding: 48,
  nodeRepulsion: 9000,
  idealEdgeLength: 110,
  fit: true,
};

const CONTEXTUAL_NODE_ID = '__contextual__';
const CONTEXTUAL_EDGE_ID = '__contextual_edge__';

export default function GraphCanvas({
  graph,
  onNodeSelect,
  loading,
  loadingText,
  contextualNode,
  contextualLoading,
  selectedNodeId,  // ← NEW prop: pass the selected node's ID from App
}) {
  const containerRef    = useRef(null);
  const cyRef           = useRef(null);
  // ── KEY FIX: store callback in ref so it never triggers graph rebuild ──
  const onNodeSelectRef = useRef(onNodeSelect);
  useEffect(() => { onNodeSelectRef.current = onNodeSelect; }, [onNodeSelect]);

  // ── Build graph — only rebuilds when graph DATA changes ──────
  useEffect(() => {
    if (!graph || !graph.root || !containerRef.current) return;

    if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null; }

    const elements = [];

    elements.push({
      data: { id: 'root', label: graph.root.label, tier: 0, nodeData: graph.root }
    });

    (graph.nodes || []).forEach(n => {
      if (!n || !n.id) return;
      elements.push({
        data: { id: n.id, label: n.label, tier: n.tier ?? 1, nodeData: n }
      });
    });

    (graph.edges || []).forEach((e, i) => {
      if (!e || !e.source || !e.target) return;
      elements.push({ data: { id: `e_${i}`, source: e.source, target: e.target } });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: CY_STYLE,
      layout: LAYOUT,
      userZoomingEnabled: true,
      userPanningEnabled: true,
    });

    cy.on('tap', 'node', evt => {
      const node = evt.target;
      if (node.data('type') === 'contextual') return;
      cy.nodes().removeClass('highlighted');
      node.addClass('highlighted');
      // Use ref — never stale, never causes rebuild
      onNodeSelectRef.current(node.data('nodeData'));
    });

    cy.on('tap', evt => {
      if (evt.target === cy) {
        cy.nodes().removeClass('highlighted');
        onNodeSelectRef.current(null);
      }
    });

    cyRef.current = cy;
    return () => { if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null; } };
  }, [graph]); // ← ONLY graph in deps — not onNodeSelect

  // ── Render contextual node — separate from graph rebuild ─────
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Always remove old contextual node first
    cy.getElementById(CONTEXTUAL_NODE_ID).remove();
    cy.getElementById(CONTEXTUAL_EDGE_ID).remove();

    // No selected node — nothing to attach to
    if (!selectedNodeId) return;
    if (!contextualLoading && !contextualNode) return;

    const parentNode = cy.getElementById(selectedNodeId);
    if (!parentNode || parentNode.length === 0) return;

    if (contextualLoading) {
      cy.add([
        { data: { id: CONTEXTUAL_NODE_ID, type: 'contextual-loading' } },
        { data: { id: CONTEXTUAL_EDGE_ID, source: selectedNodeId, target: CONTEXTUAL_NODE_ID, type: 'contextual' } }
      ]);
    } else if (contextualNode) {
      const { data } = contextualNode;
      const separator = '-'.repeat(32);
      const lines = [
        `[${data.badge}] ${data.title}`,
        separator,
        data.content,
      ];
      if (data.footer) {
        lines.push(separator);
        lines.push(data.footer);
      }
      const label = lines.join('\n');

      cy.add([
        { data: { id: CONTEXTUAL_NODE_ID, label, type: 'contextual' } },
        { data: { id: CONTEXTUAL_EDGE_ID, source: selectedNodeId, target: CONTEXTUAL_NODE_ID, type: 'contextual' } }
      ]);
    }

    // Position to the right of parent
    const parentPos = cy.getElementById(selectedNodeId).position();
    if (parentPos) {
      cy.getElementById(CONTEXTUAL_NODE_ID).position({
        x: parentPos.x + 240,
        y: parentPos.y,
      });
    }

  }, [contextualNode, contextualLoading, selectedNodeId]);
  // ↑ selectedNodeId in deps — stable string, won't cause graph rebuild

  return (
    <div className="graph-canvas">
      <div ref={containerRef} className="graph-canvas__cy" />

      {!graph && !loading && (
        <div className="graph-canvas__hint">
          <div className="graph-canvas__hint-icon">⬡</div>
          <p>enter a topic to generate a knowledge graph</p>
        </div>
      )}

      {loading && (
        <div className="graph-canvas__loading">
          <div className="graph-canvas__dots">
            <span /><span /><span />
          </div>
          <p>{loadingText}</p>
        </div>
      )}
    </div>
  );
}