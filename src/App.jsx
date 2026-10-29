import React, { useCallback, useState } from 'react';
import './App.css';
import Topbar        from './components/topbar';
import GraphCanvas   from './components/Graphcanvas';
import Sidebar       from './components/sidebar';
import LeftSidebar   from './components/LeftSidebar';
import BottomNav     from './components/BottomNav';
import FileBar       from './components/FileBar';
import ExpandDialog  from './components/ExpandDialog'
import Login         from './components/Login';
import Signup        from './components/Signup';
import SharedGraph   from './components/SharedGraph';
import ShareModal     from './components/ShareModal';
import { shareGraph } from './utils/graphApi';
import { exportGraphAsPDF } from './utils/exportPdf'; 
import { useKnowledgeGraph } from './hooks/useKnowledgeGraph';
import { useAuth } from './components/AuthContext';

export default function App() {
  //check if this is a shared graph URl
  const urlParams = new URLSearchParams(window.location.search);
  const shareToken = urlParams.get('share');

  const [showShareModal, setShowShareModal] = useState(false);  
  const [shareGraphId, setShareGraphId] = useState(null);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const { isLoggedIn, loading: authLoading, user, logoutUser, token } = useAuth();
  const [authPage, setAuthPage] = useState('login');

  const {
    graph, selectedNode, setSelected,
    status, loading, loadingText,
    history, activeId,
    generate, openFromHistory, deleteFromHistory, newGraph, expandNode,
    uploadedFiles, internetOn, setInternetOn, addFiles, removeFile,
    showExpandDialog, pendingExpand, handleExpandKeep, handleExpandUseInternet,
    contextualNode, contextualLoading, generateContextual,
  } = useKnowledgeGraph(user?.id, token);

  const [leftCollapsed, setLeftCollapsed] = useState(false);

  // Mobile: which panel is currently visible
  const [mobilePanel, setMobilePanel] = useState('graph');

  const handleNodeSelect = useCallback(node => {
    setSelected(node);
    // Auto-switch to notes panel when a node is selected on mobile
    if (node) {
      //update selectedNodeId first so graphcanvas knows where to attach
      setSelectedNodeId(node.id);
      //Do not auto switch to notes on mobile - user wants to see contextual node
      //only switch if they're on history tab
      setMobilePanel(prev => prev === 'history' ? 'graph' : prev);
      generateContextual(node.id, node.label); //trigger contextual generation
    }else{
      setSelectedNodeId(null);
    }
  }, [setSelected, generateContextual]);

  const handleExpand = useCallback((id, label) => expandNode(id, label), [expandNode]);
  //share handlers
  async function handleShare(graphId){
    const FRONTEND_URL = 'https://synapse-ai.onrender.com';
    const {shareToken} = await shareGraph(graphId);
    return `${FRONTEND_URL}/?share=${shareToken}`;
  }

  function handleExport(){
    if (graph && rootTopic){
      exportGraphAsPDF(graph, rootTopic);
    }
  }

  //if share token in url - show shared graph (no login needed)
  if(shareToken){
    return <SharedGraph token={shareToken} />
  }

  if (authLoading) return <div className="app" />;

  if (!isLoggedIn) {
    return authPage === 'login' ? (
      <Login onSwitchToSignup={() => setAuthPage('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthPage('login')} />
    );
  }

  return (
    <div className="app">
      <Topbar
        onGenerate={(topic) => {
          generate(topic);
          setMobilePanel('graph'); // auto-switch to graph when generating
        }}
        loading={loading}
        user={user}
        onLogout={logoutUser}
        onFilesAdded={addFiles}
        internetOn={internetOn}
        onToggleInternet={()=> setInternetOn(p => !p)}
        onExport={graph ? handleExport : null} //only show when the graph is loaded
      />
      {/*file bar- shows when files are uploaded */}
      <FileBar
        files={uploadedFiles}
        onRemove={removeFile}
      />

      <div className="app__main">
        {/* Left sidebar — hidden on mobile unless history tab active */}
        <div className={`app__left ${mobilePanel === 'history' ? 'app__panel--visible' : 'app__panel--hidden-mobile'}`}>
          <LeftSidebar
            history={history}
            activeId={activeId}
            onOpen={(entry) => {
              openFromHistory(entry);
              setMobilePanel('graph');
            }}
            onDelete={deleteFromHistory}
            onNew={() => {
              newGraph();
              setMobilePanel('graph');
            }}
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed(p => !p)}
            onShare={(id) => {setShareGraphId(id); setShowShareModal(true);}}
          />
        </div>

        {/* Graph canvas — hidden on mobile unless graph tab active */}
        <div className={`app__canvas ${mobilePanel === 'graph' ? 'app__panel--visible' : 'app__panel--hidden-mobile'}`}>
          <GraphCanvas
            graph={graph}
            onNodeSelect={handleNodeSelect}
            loading={loading}
            loadingText={loadingText}
            contextualNode = {contextualNode}
            contextualLoading={contextualLoading}
            selectedNodeId={selectedNodeId} //stable, updates first
          />
        </div>

        {/* Right sidebar — hidden on mobile unless notes tab active */}
        <div className={`app__right ${mobilePanel === 'notes' ? 'app__panel--visible' : 'app__panel--hidden-mobile'}`}>
          <Sidebar selectedNode={selectedNode} onExpand={handleExpand} />
        </div>
      </div>

      {/* Bottom nav — only visible on mobile */}
      <BottomNav
        activePanel={mobilePanel}
        onChange={(panel) => {
          setMobilePanel(panel);
        }}
        hasGraph={!!graph}
        hasNode={!!selectedNode}
      />

      {/* Status bar — hidden on mobile */}
      <div className="app__statusbar">
        <div className={`app__dot ${status.active ? 'app__dot--active' : ''}`} />
        <span className="app__status-text">{status.text}</span>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <ShareModal
          graphId={shareGraphId}
          onClose={() => setShowShareModal(false)}
        />  
      )}
      {/* Expand dialog - shown when file expansion has no content */}
    {showExpandDialog && (
      <ExpandDialog
      nodeLabel={pendingExpand?.nodeLabel}
      onKeep={handleExpandKeep}
      onUseInternet={handleExpandUseInternet}
      onClose={handleExpandKeep}
      />
    )}
    </div>
    
  );
}