import { useState, useCallback, useEffect } from "react";
import { generateGraphData, expandNodeData } from "../utils/GroqApi";
import { fetchGraphs, saveGraph, updateGraph, deleteGraph } from "../utils/graphApi";

export function useKnowledgeGraph(userId, token) {
  const [graph, setGraph]             = useState(null);
  const [selectedNode, setSelected]   = useState(null);
  const [rootTopic, setRootTopic]     = useState(null);
  const [status, setStatus]           = useState({
    text: "READY - ENTER TOPIC TO BEGIN",
    active: false
  });
  const [loading, setLoading]         = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError]             = useState(null);
  const [history, setHistory]         = useState([]);
  const [activeId, setActiveId]       = useState(null);

  // ── Load history from MongoDB when user logs in ───────────
  useEffect(() => {
    if (!userId || !token) {
      setHistory([]);
      setGraph(null);
      setActiveId(null);
      return;
    }

    async function loadHistory() {
      try {
        const graphs = await fetchGraphs();
        // Convert MongoDB format to our app format
        const formatted = graphs.map(g => ({
          id: g._id,      // use MongoDB _id as our id
          topic: g.topic,
          graph: g.graph,
          createdAt: g.createdAt,
        }));
        setHistory(formatted);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }

    loadHistory();
    // Clear current graph when user changes
    setGraph(null);
    setActiveId(null);
    setSelected(null);
    setRootTopic(null);
    setStatus({ text: "READY - ENTER TOPIC TO BEGIN", active: false });
  }, [userId, token]);

  // ── Generate graph ────────────────────────────────────────
  const generate = useCallback(async (topic) => {
    if (!topic.trim()) return;
    setLoading(true);
    setLoadingText("Generating knowledge graph...");
    setError(null);
    setSelected(null);
    setRootTopic(topic);
    setStatus({ text: "GENERATING GRAPH...", active: false });

    try {
      const data = await generateGraphData(topic);

      // Save to MongoDB
      const saved = await saveGraph(topic, data);

      const entry = {
        id: saved._id,   // MongoDB _id
        topic,
        graph: data,
        createdAt: saved.createdAt,
      };

      setHistory(prev => [entry, ...(Array.isArray(prev) ? prev : [])]);
      setActiveId(entry.id);
      setGraph(data);

      const total = (data.nodes?.length || 0) + 1;
      setStatus({
        text: `GRAPH GENERATED - ${total} NODES - CLICK TO EXPLORE`,
        active: true
      });
    } catch (err) {
      setError(err.message);
      setStatus({ text: "FAILED TO GENERATE GRAPH", active: false });
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Open from history ─────────────────────────────────────
  const openFromHistory = useCallback((entry) => {
    setGraph(entry.graph);
    setRootTopic(entry.topic);
    setActiveId(entry.id);
    setSelected(null);
    const total = (entry.graph.nodes?.length || 0) + 1;
    setStatus({
      text: `GRAPH LOADED - ${total} NODES - CLICK TO EXPLORE`,
      active: true
    });
  }, []);

  // ── Delete from history ───────────────────────────────────
  const deleteFromHistory = useCallback(async (id) => {
    try {
      await deleteGraph(id);
      setHistory(prev => prev.filter(e => e.id !== id));
      if (id === activeId) {
        setGraph(null);
        setActiveId(null);
        setStatus({ text: "READY - ENTER TOPIC TO BEGIN", active: false });
      }
    } catch (err) {
      console.error('Failed to delete graph:', err);
    }
  }, [activeId]);

  // ── New graph ─────────────────────────────────────────────
  const newGraph = useCallback(() => {
    setGraph(null);
    setSelected(null);
    setActiveId(null);
    setRootTopic("");
    setStatus({ text: "READY - ENTER TOPIC TO BEGIN", active: false });
  }, []);

  // ── Expand node ───────────────────────────────────────────
  const expandNode = useCallback(async (nodeId, nodeLabel) => {
    setLoading(true);
    setLoadingText(`Expanding "${nodeLabel}"...`);
    setError(null);
    setStatus({
      text: `EXPANDING "${nodeLabel.toUpperCase()}"...`,
      active: false
    });

    try {
      const { nodes: children } = await expandNodeData(nodeLabel, rootTopic);

      const ts = Date.now();
      const newNodes = children.map((n, i) => ({
        ...n,
        id: `exp_${ts}_${i}`,
        tier: 2,
      }));

      const newEdges = newNodes.map(n => ({
        source: nodeId,
        target: n.id
      }));

      setGraph(prev => {
        const updated = {
          ...prev,
          nodes: [...(prev.nodes || []), ...newNodes],
          edges: [...(prev.edges || []), ...newEdges],
        };

        // Update in MongoDB
        if (activeId) {
          updateGraph(activeId, updated).catch(console.error);
        }

        // Update in local history
        setHistory(h => h.map(e =>
          e.id === activeId ? { ...e, graph: updated } : e
        ));

        return updated;
      });

      setStatus({ text: `EXPANDED GRAPH UPDATED`, active: true });
    } catch (err) {
      setError(err.message);
      setStatus({ text: `FAILED TO EXPAND - TRY AGAIN`, active: false });
    } finally {
      setLoading(false);
    }
  }, [rootTopic, activeId]);

  return {
    graph,
    selectedNode,
    setSelected,
    rootTopic,
    history,
    openFromHistory,
    deleteFromHistory,
    newGraph,
    activeId,
    status,
    loading,
    loadingText,
    error,
    generate,
    expandNode,
  };
}