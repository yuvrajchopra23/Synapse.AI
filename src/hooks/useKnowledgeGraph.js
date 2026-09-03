import { useState, useCallback, useEffect, useRef } from "react";
import { generateGraphData, expandNodeData, generateGraphFromFiles, generateGraphFromFilesAndInternet, expandNodeFromFiles, generateContextualContent } from "../utils/GroqApi";
import { fetchGraphs, saveGraph, updateGraph, deleteGraph } from "../utils/graphApi";
import { extractTextFromFiles } from "../utils/uploadApi";

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

  // File State
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [internetOn, setInternetOn]       = useState(true);
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [pendingExpand, setPendingExpand] = useState(null);
  
  //Contextual node state
  const contextualCacheRef = useRef({});
  const [contextualNode, setContextualNode] = useState(null); // {nodeId, data}
  const [contextualLoading, setContextualLoading] = useState(false);

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
        const formatted = graphs.map(g => ({
          id:            g._id,
          topic:         g.topic,
          graph:         g.graph,
          createdAt:     g.createdAt,
          sourceFiles:   g.sourceFiles   || [],
          extractedText: g.extractedText || '',
        }));
        setHistory(formatted);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }

    loadHistory();
    setGraph(null);
    setActiveId(null);
    setSelected(null);
    setRootTopic(null);
    setStatus({ text: "READY - ENTER TOPIC TO BEGIN", active: false });
  }, [userId, token]);

  // ── Add files ─────────────────────────────────────────────
  const addFiles = useCallback((newFiles) => {
    setUploadedFiles(prev => [...prev, ...Array.from(newFiles)]);
  }, []);

  // ── Remove a file ─────────────────────────────────────────
  const removeFile = useCallback((index) => {
    setUploadedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) setExtractedText('');
      return updated;
    });
  }, []);

  // ── Clear all files ───────────────────────────────────────
  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setExtractedText('');
  }, []);

  // ── Generate graph ────────────────────────────────────────
  const generate = useCallback(async (topic) => {
    const hasFiles = uploadedFiles.length > 0;

    // Block only if nothing to work with
    if (!hasFiles && !topic?.trim()) {
      setStatus({ text: "PLEASE ENTER A TOPIC OR UPLOAD FILES", active: false });
      return;
    }

    setLoading(true);
    setLoadingText("Starting...");
    setError(null);
    setSelected(null);
    setStatus({ text: "GENERATING GRAPH...", active: false });

    try {
      let data;
      let graphTopic = topic || '';
      let filenames  = [];
      let fileText   = '';

      if (hasFiles) {
        // ── Step 1: extract text from files ──────────────────
        setLoadingText("Reading your files...");
        const extracted = await extractTextFromFiles(uploadedFiles);
        fileText  = extracted.text;
        filenames = extracted.files.map(f => f.filename);
        setExtractedText(fileText);

        // ── Step 2: generate graph ────────────────────────────
        if (internetOn && topic?.trim()) {
          // Mode 3 — files + internet
          setLoadingText("Generating from files + internet...");
          data = await generateGraphFromFilesAndInternet(fileText, filenames, topic);
        } else {
          // Mode 2 — files only
          setLoadingText("Generating from your files only...");
          data = await generateGraphFromFiles(fileText, filenames);
        }

        // ── Step 3: use AI root label as graph name ───────────
        graphTopic = data.root?.label || topic || filenames[0].replace(/\.[^/.]+$/, '');
        setRootTopic(graphTopic);

        // ── Step 4: save to MongoDB with extracted text ───────
        const saved = await saveGraph(graphTopic, data, filenames, fileText);
        const entry = {
          id:            saved._id,
          topic:         graphTopic,
          graph:         data,
          createdAt:     saved.createdAt,
          sourceFiles:   filenames,
          extractedText: fileText,
        };

        setHistory(prev => [entry, ...(Array.isArray(prev) ? prev : [])]);
        setActiveId(entry.id);
        setGraph(data);
        contextualCacheRef.current = {};
        setContextualNode(null);

      } else {
        // ── Mode 1: topic only ────────────────────────────────
        setLoadingText("Generating knowledge graph...");
        setRootTopic(topic);
        data = await generateGraphData(topic);
        graphTopic = topic;

        const saved = await saveGraph(graphTopic, data, [], '');
        const entry = {
          id:            saved._id,
          topic:         graphTopic,
          graph:         data,
          createdAt:     saved.createdAt,
          sourceFiles:   [],
          extractedText: '',
        };

        setHistory(prev => [entry, ...(Array.isArray(prev) ? prev : [])]);
        setActiveId(entry.id);
        setGraph(data);
      }

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
  }, [uploadedFiles, internetOn]);

  // ── Open from history ─────────────────────────────────────
  const openFromHistory = useCallback((entry) => {
    setGraph(entry.graph);
    setRootTopic(entry.topic);
    setActiveId(entry.id);
    setSelected(null);
    // Restore extracted text so file-based expansion works after reload
    setExtractedText(entry.extractedText || '');
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
        setExtractedText('');
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
    setRootTopic('');
    setExtractedText('');
    contextualCacheRef.current = {}; //clear cache
    setContextualNode(null);
    setStatus({ text: "READY - ENTER TOPIC TO BEGIN", active: false });
  }, []);

  // ── Expand node ───────────────────────────────────────────
  const expandNode = useCallback(async (nodeId, nodeLabel) => {
    const hasFileText = extractedText.length > 0;

    if (hasFileText && !internetOn) {
      // File-only mode — try expanding from file content
      setLoading(true);
      setLoadingText(`Searching files for "${nodeLabel}"...`);

      try {
        const result = await expandNodeFromFiles(nodeLabel, rootTopic, extractedText);

        if (result.insufficient || !result.nodes || result.nodes.length === 0) {
          setPendingExpand({ nodeId, nodeLabel });
          setShowExpandDialog(true);
          setLoading(false);
          return;
        }

        applyExpandedNodes(nodeId, result.nodes);
      } catch (err) {
        setError(err.message);
        setStatus({ text: "FAILED TO EXPAND", active: false });
      } finally {
        setLoading(false);
      }
    } else {
      // Internet mode — expand normally
      await expandFromInternet(nodeId, nodeLabel);
    }
  }, [extractedText, internetOn, rootTopic]);

  // ── Expand using internet ─────────────────────────────────
  const expandFromInternet = useCallback(async (nodeId, nodeLabel) => {
    setLoading(true);
    setLoadingText(`Expanding "${nodeLabel}"...`);
    setError(null);
    setStatus({ text: `EXPANDING "${nodeLabel.toUpperCase()}"...`, active: false });

    try {
      const { nodes: children } = await expandNodeData(nodeLabel, rootTopic);
      applyExpandedNodes(nodeId, children);
    } catch (err) {
      setError(err.message);
      setStatus({ text: "FAILED TO EXPAND - TRY AGAIN", active: false });
    } finally {
      setLoading(false);
    }
  }, [rootTopic]);

  // ── Apply expanded nodes to graph ─────────────────────────
  const applyExpandedNodes = useCallback((nodeId, children) => {
    const ts       = Date.now();
    const newNodes = children.map((n, i) => ({ ...n, id: `exp_${ts}_${i}`, tier: 2 }));
    const newEdges = newNodes.map(n => ({ source: nodeId, target: n.id }));

    setGraph(prev => {
      const updated = {
        ...prev,
        nodes: [...(prev.nodes || []), ...newNodes],
        edges: [...(prev.edges || []), ...newEdges],
      };
      if (activeId) updateGraph(activeId, updated).catch(console.error);
      setHistory(h => h.map(e => e.id === activeId ? { ...e, graph: updated } : e));
      return updated;
    });

    setStatus({ text: "EXPANDED GRAPH UPDATED", active: true });
  }, [activeId]);

  // ── Expand dialog handlers ────────────────────────────────
  const handleExpandKeep = useCallback(() => {
    setShowExpandDialog(false);
    setPendingExpand(null);
  }, []);

  const handleExpandUseInternet = useCallback(() => {
    setShowExpandDialog(false);
    if (pendingExpand) {
      expandFromInternet(pendingExpand.nodeId, pendingExpand.nodeLabel);
      setPendingExpand(null);
    }
  }, [pendingExpand, expandFromInternet]);
//generate contextual node for clicked node
const generateContextual = useCallback(async (nodeId, nodeLabel) => {
  //if same node clicked again - toggle off
  if (contextualNode?.nodeId == nodeId){
    setContextualNode(null);
    return;
  }

  //check cache first - don't call API again for the same node
  if(contextualCacheRef.current[nodeId]){
    setContextualNode({nodeId, data: contextualCacheRef.current[nodeId]});
    return;
  }

  setContextualLoading(true);
  setContextualNode(null);//clear old one immediately

  try{
    const data =  await generateContextualContent(nodeLabel, rootTopic);

    //save to cache
    contextualCacheRef.current[nodeId] = data; //store in ref, no re- render
    setContextualNode({nodeId, data});
  }catch(err){
    console.error('Failed to generate contextual node:', err);
  }finally{
    setContextualLoading(false);
  }
},[contextualNode, rootTopic]);

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
    uploadedFiles,
    internetOn,
    setInternetOn,
    addFiles,
    removeFile,
    clearFiles,
    showExpandDialog,
    pendingExpand,
    handleExpandKeep,
    handleExpandUseInternet,
    contextualNode,
    contextualLoading,
    generateContextual
  };
}