import React, { useEffect, useState } from 'react'; 
import GraphCanvas from './Graphcanvas';
import Sidebar from '.sidebar';
import {fetchSharedGraph} from '../utils/graphApi';

export default function SharedGraph({token}) {
    const [graph, setGraph] = useState(null);
    const [topic, setTopic] = useState('');
    const [selectedNode, setSelected] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load(){
            try{
                const data = await fetchSharedGraph(token);
                setGraph(data.graph);
                setTopic(data.topic);
            }catch(err){
                setError(err.message);
            }finally{
                setLoading(false);
            }
        }
        load();
    }, [token]);

    if(loading) return (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',background: '#090909', color: '#444', fontFamily: 'Space Mono', fontSize: '12px' }}>
            Loading shared graph...
        </div>
    );

    if(error) return(
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',background: '#090909', color: '#666', fontFamily: 'Space Mono', fontSize: '12px' }}>
            {error}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', background: '#090909' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: '#0f0f0f', borderBottom: '0.5px solid #1e1e1e', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Space Mono', fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.1em' }}>
          SYNAPSE<span style={{ color: '#444' }}>.AI</span>
        </div>
        <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Space Mono' }}>
          {topic} — shared graph
        </div>
        
        <a href="/"
          style={{ padding: '7px 14px', background: '#e8e8e8', color: '#090909', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}
        >
          Create your own →
        </a>
      </div>

       {/* Main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <GraphCanvas
          graph={graph}
          onNodeSelect={node => setSelected(node)}
          loading={false}
          loadingText=""
          contextualNode={null}
          contextualLoading={false}
          selectedNodeId={selectedNode?.id || null}
        />
        <Sidebar
          selectedNode={selectedNode}
          onExpand={() => {}} // no expansion on shared graphs
          onDeepDive={() => {}}
        />
      </div>

        {/* Footer */}
      <div style={{ padding: '7px 20px', background: '#090909', borderTop: '0.5px solid #1e1e1e', fontSize: '10px', color: '#333', fontFamily: 'Space Mono' }}>
        VIEW ONLY — sign up to create and save your own graphs
      </div>
    </div>
    );
}