import React, { useEffect, useRef } from 'react';
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

export default function GraphCanvas({ graph, onNodeSelect, loading, loadingText }) {
  const containerRef = useRef(null);
  const cyRef        = useRef(null);

  useEffect(() => {
    // ── GUARD: don't run if graph is null or root is missing ──
    if (!graph || !graph.root || !containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const elements = [];

    // Root node — safely access graph.root now
    elements.push({
      data: {
        id: 'root',
        label: graph.root.label || 'Root',
        tier: 0,
        nodeData: graph.root,
      }
    });

    // Child nodes — guard each one too
    (graph.nodes || []).forEach(n => {
      if (!n || !n.id) return; // skip malformed nodes
      elements.push({
        data: {
          id: n.id,
          label: n.label || '',
          tier: n.tier ?? 1,
          nodeData: n,
        }
      });
    });

    // Edges
    (graph.edges || []).forEach((e, i) => {
      if (!e || !e.source || !e.target) return; // skip malformed edges
      elements.push({
        data: { id: `e_${i}`, source: e.source, target: e.target }
      });
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
      cy.nodes().removeClass('highlighted');
      evt.target.addClass('highlighted');
      onNodeSelect(evt.target.data('nodeData'));
    });

    cy.on('tap', evt => {
      if (evt.target === cy) {
        cy.nodes().removeClass('highlighted');
        onNodeSelect(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [graph, onNodeSelect]);

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