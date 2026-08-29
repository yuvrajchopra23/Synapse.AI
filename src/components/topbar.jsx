import React, { useState, useRef } from 'react';
import './topbar.css';

export default function Topbar({ onGenerate, loading, user, onLogout, onFilesAdded }) {
  const [topic, setTopic] = useState('');
  const fileInputRef = useRef(null);

  function handleSubmit() {
    if (!loading) onGenerate(topic.trim());
  }

  return (
    <header className="topbar">
      <div className="topbar__logo">Synapse<span>.ai</span></div>

      <div className="topbar__search">
        {/* Search icon SVG */}
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#444" strokeWidth="1.2" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter a topic or upload files below..."
          disabled={loading}
        />
      </div>
      <input 
        type ="file"
        ref = {fileInputRef}
        accept='.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt'
        multiple
        style={{display: 'none'}}
        onChange={e =>{
          if (e.target.files?.length > 0){
            onFilesAdded(e.target.files);
            e.target.value = '';
          }
        }}
        />
      <button
        className="topbar__upload"
        onClick={()=>fileInputRef.current?.click()}
        title="Upload PDF, PPT, DOCX, XLSX"
        disabled = {loading}
      >↑ Files
      </button>

      <button
        className="topbar__btn"
        onClick={handleSubmit}
        disabled={loading || !topic.trim()}
      >
        {loading ? '...' : 'Generate →'}
      </button>

      {user && (
        <div className='topbar__user'>
          <span className='topbar__user-name'>{user.name}</span>
          <button className='topbar__logout' onClick={onLogout} title="Log Out">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}