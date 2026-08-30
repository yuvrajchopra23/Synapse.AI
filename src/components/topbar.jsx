import React, { useState, useRef } from 'react';
import './topbar.css';

export default function Topbar({ onGenerate, loading, user, onLogout, onFilesAdded }) {
  const [topic, setTopic] = useState('');
  const fileInputRef = useRef(null);

  function handleSubmit() {
    if (!loading) onGenerate(topic.trim());
  }

  function handleFileClick(e) {
    // Stop event from bubbling to search bar
    e.stopPropagation();
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleFileChange(e) {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onFilesAdded(selectedFiles);
    }
    // Must reset AFTER calling onFilesAdded
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 100);
  }

  return (
    <header className="topbar">
      <div className="topbar__logo">Synapse<span>.ai</span></div>

      <div className="topbar__search">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#444" strokeWidth="1.2" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter a topic or upload files..."
          disabled={loading}
        />
      </div>

      {/* File input — completely separate from topic input, no conditional rendering */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button
        className="topbar__upload"
        onMouseDown={handleFileClick}  // use onMouseDown instead of onClick
        title="Upload PDF, PPT, DOCX, XLSX"
        disabled={loading}
        type="button"
      >
        ↑ Files
      </button>

      <button
        className="topbar__btn"
        onClick={handleSubmit}
        disabled={loading}
        type="button"
      >
        {loading ? '...' : 'Generate →'}
      </button>

      {user && (
        <div className="topbar__user">
          <span className="topbar__user-name">{user.name}</span>
          <button
            className="topbar__logout"
            onClick={onLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}