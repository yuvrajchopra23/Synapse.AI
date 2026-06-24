import React, { useCallback, useState } from 'react';
import './App.css';
import Topbar      from './components/topbar';
import GraphCanvas from './components/Graphcanvas';
import Sidebar     from './components/sidebar';
import LeftSidebar from './components/LeftSidebar';
import { useKnowledgeGraph } from './hooks/useKnowledgeGraph';
import Login from './components/Login';
import Signup from './components/Signup';
import { useAuth } from './components/AuthContext';

export default function App() {
  const {isLoggedIn, loading: authloading, user, logoutUser} = useAuth();
  const [authPage, setAuthPage] = useState('login'); //can be login or signup
  // Pull all state and actions from our custom hook
  const {
    graph, selectedNode, setSelected,
    status, loading, loadingText,
    history, activeId,
    generate, openFromHistory, deleteFromHistory, newGraph, expandNode,
  } = useKnowledgeGraph(user?.id);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const handleNodeSelect = useCallback(node => setSelected(node), [setSelected]);
  const handleExpand     = useCallback((id, label) => expandNode(id, label), [expandNode]);

  //while checking localstorage for a saved login, show nothing
  if(authloading){
    return <div className='app' />
  }

  //Not logged in - show login or signup page
  if(!isLoggedIn){
    return authPage === 'login'?(
      <Login onSwitchToSignup={() => setAuthPage('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthPage('login')} />
    );
  }

  return (
    <div className="app">
      {/* Top search bar */}
      <Topbar onGenerate={generate} loading={loading} user={user} onLogout={logoutUser} />

      {/* Middle: graph + sidebar side by side */}
      <div className="app__main">
        <LeftSidebar
          history={history}
          activeId={activeId}
          onOpen={openFromHistory}
          onDelete={deleteFromHistory}
          onNew={newGraph}
          collapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed(p => !p)}
        />
        <GraphCanvas
          graph={graph}
          onNodeSelect={handleNodeSelect}
          loading={loading}
          loadingText={loadingText}
        />
        <Sidebar selectedNode={selectedNode} onExpand={handleExpand} />
      </div>

      {/* Bottom status bar */}
      <div className="app__statusbar">
        <div className={`app__dot ${status.active ? 'app__dot--active' : ''}`} />
        <span className="app__status-text">{status.text}</span>
      </div>
    </div>
  );
}