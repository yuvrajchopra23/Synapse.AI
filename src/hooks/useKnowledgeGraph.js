import { useState, useCallback, useEffect } from "react";
import { generateGraphData, expandNodeData } from "../utils/GroqApi";

// Make loadHistory bulletproof — now scoped per user
function LoadHistory(userId) {
  try {
    if (!userId) return [];
    const key = `synapse_history_${userId}`;
    const saved = localStorage.getItem(key);

    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useKnowledgeGraph(userId) {
    const [graph, setGraph] = useState(null);
    const [selectedNode, setSelected] = useState(null);
    const [rootTopic, setRootTopic] = useState(null);
    const [status,setStatus] = useState({
        text: "READY - ENTER TOPIC TO BEGIN",
        active: false
    });

    const[loading,setLoading] = useState(false);
    const[loadingText,setLoadingText] = useState("");
    const [error,setError] = useState(null);

    //history = array of {id, topic, graph, createdAt}
    const [history, setHistory] = useState(()=> {
        const loaded = LoadHistory(userId);
        return Array.isArray(loaded) ? loaded : [];
    });

    const [activeId, setActiveId] = useState(null); //which graph is opened

    // ── Whenever the logged-in user changes (login/logout/switch account),
    //    reload history scoped to THAT user and clear the current graph view
    useEffect(() => {
        setHistory(LoadHistory(userId));
        setGraph(null);
        setActiveId(null);
        setSelected(null);
        setRootTopic(null);
        setStatus({
            text: "READY - ENTER TOPIC TO BEGIN",
            active: false
        });
    }, [userId]);

    //persist history to localstorage whenever it changes — scoped per user
    useEffect(() => {
        if (!userId) return;
        const key = `synapse_history_${userId}`;
        localStorage.setItem(key, JSON.stringify(history));
    }, [history, userId]);

    const generate = useCallback(async (topic) => {
        if(!topic.trim()) return;

        setLoading(true);
        setLoadingText("Generating knowledge graph...");
        setError(null);
        setSelected(null);
        setRootTopic(topic);
        setStatus({
        text: "GENERATING GRAPH...",
            active: false
        });

        try{
            const data = await generateGraphData(topic);

            //save to history 
            const entry = {
                id: Date.now(),
                topic,
                graph: data,
                createdAt: new Date().toISOString()
            };
            setHistory(prev => [entry, ...(Array.isArray(prev) ? prev : [])]);
            setActiveId(entry.id);
            setGraph(data);
            
            const total =  (data.nodes?.length || 0) + 1; // including root
            setStatus({
                text: `GRAPH GENERATED - ${total} NODES - CLICK TO EXPLORE`,
                active: true
            });
        } catch (err) {
            setError(err.message);
            setStatus({
                text: "FAILED TO GENERATE GRAPH",
                active: false
            });
        } finally {
            setLoading(false);
        }
    },[]);

    //open graph from history
    const openFromHistory = useCallback((entry)=>{
        setGraph(entry.graph);
        setRootTopic(entry.topic);
        setActiveId(entry.id);
        setSelected(null);
        const total = (entry.graph.nodes?.length || 0) + 1;
        setStatus({
            text: `GRAPH LOADED - ${total} NODES - CLICK TO EXPLORE`,
            active: true
        });
        },[]);
    
    //delete graph from history
    const deleteFromHistory = useCallback((id)=>{
        setHistory(prev => prev.filter(e => e.id !== id));
        if(id === activeId){
            setGraph(null);
            setActiveId(null);
            setStatus({
                text: "READY - ENTER TOPIC TO BEGIN",
                active: false});
        }
    }, [activeId]);

    const newGraph = useCallback(()=>{
        setGraph(null);
        setSelected(null);
        setActiveId(null);
        setRootTopic("");
        setStatus({
            text: "READY - ENTER TOPIC TO BEGIN",
            active: false
    });
    },[]);  

    const expandNode = useCallback(async (nodeId, nodeLabel) => {
        setLoading(true);
        setLoadingText(`Expanding "${nodeLabel}"...`);
        setError(null);
        setStatus({
            text: `EXPANDING "${nodeLabel.toUpperCase()}"...`,
            active: false
        });
        try{
            const{nodes: children} = await expandNodeData(nodeLabel, rootTopic);

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
                // Also update history with the expanded graph
                setHistory(h => h.map(e => 
                    e.id === activeId?{...e, graph: updated} : e
                ));
                return updated;
            });

            setStatus({
                text: `EXPANDED GRAPH UPDATED`,
                active: true
            });
        } catch (err) {
            setError(err.message);
            setStatus({
                text: `FAILED TO EXPAND - TRY AGAIN`,
                active: false
            });
        } finally {
            setLoading(false);
        }
    },[rootTopic, activeId]);

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