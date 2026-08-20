import React, { useCallback, useState } from 'react';
import './App.css';
import Topbar        from './components/Topbar';
import GraphCanvas   from './components/GraphCanvas';
import Sidebar       from './components/Sidebar';
import LeftSidebar   from './components/LeftSidebar';
import BottomNav     from './components/BottomNav';
import Login         from './pages/Login';
import Signup        from './pages/Signup';
import { useKnowledgeGraph } from './hooks/useKnowledgeGraph';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isLoggedIn, loading: authLoading, user, logoutUser } = useAuth();
  const [authPage, setAuthPage] = useState('login');

  const {
    graph, selectedNode, setSelected,
    status, loading, loadingText,
    history, activeId,
    generate, openFromHistory, deleteFromHistory, newGraph, expandNode,
  } = useKnowledgeGraph(user?.id);

  const [leftCollapsed, setLeftCollapsed] = useState(false);

  // Mobile: which panel is currently visible
  const [mobilePanel, setMobilePanel] = useState('graph');

  const handleNodeSelect = useCallback(node => {
    setSelected(node);
    // Auto-switch to notes panel when a node is selected on mobile
    if (node) setMobilePanel('notes');
  }, [setSelected]);

  const handleExpand = useCallback((id, label) => expandNode(id, label), [expandNode]);

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
          />
        </div>

        {/* Graph canvas — hidden on mobile unless graph tab active */}
        <div className={`app__canvas ${mobilePanel === 'graph' ? 'app__panel--visible' : 'app__panel--hidden-mobile'}`}>
          <GraphCanvas
            graph={graph}
            onNodeSelect={handleNodeSelect}
            loading={loading}
            loadingText={loadingText}
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
        onChange={setMobilePanel}
        hasGraph={!!graph}
        hasNode={!!selectedNode}
      />

      {/* Status bar — hidden on mobile */}
      <div className="app__statusbar">
        <div className={`app__dot ${status.active ? 'app__dot--active' : ''}`} />
        <span className="app__status-text">{status.text}</span>
      </div>
    </div>
  );
}