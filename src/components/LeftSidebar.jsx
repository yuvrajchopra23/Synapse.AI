import React, { useState } from 'react';
import './LeftSidebar.css';

function formatDate(isoString) {
  const date = new Date(isoString);
  const now  = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function groupByDate(history) {
  if (!history || !Array.isArray(history)) return {}; // ← guard
  const groups = {};
  history.forEach(entry => {
    const label = formatDate(entry.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  });
  return groups;
}

export default function LeftSidebar({
  history,
  activeId,
  onOpen,
  onDelete,
  onNew,
  collapsed,
  onToggle,
}) {
  // ← normalize to array no matter what comes in
  const safeHistory = Array.isArray(history) ? history : [];

  const [hoveredId, setHoveredId] = useState(null);
  const grouped = groupByDate(safeHistory);

  return (
    <aside className={`lsidebar ${collapsed ? 'lsidebar--collapsed' : ''}`}>

      <div className="lsidebar__top">
        {!collapsed && (
          <span className="lsidebar__brand">SYNAPSE<span>.AI</span></span>
        )}
        <button className="lsidebar__toggle" onClick={onToggle} title="Toggle sidebar">
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <button className="lsidebar__new" onClick={onNew}>
        <span className="lsidebar__new-icon">+</span>
        {!collapsed && <span>New Graph</span>}
      </button>

      {!collapsed && (
        <div className="lsidebar__history">
          {safeHistory.length === 0 ? (
            <div className="lsidebar__empty">
              No graphs yet.<br />Generate one to start.
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, entries]) => (
              <div key={dateLabel} className="lsidebar__group">
                <div className="lsidebar__group-label">{dateLabel}</div>
                {entries.map(entry => (
                  <div
                    key={entry.id}
                    className={`lsidebar__item ${activeId === entry.id ? 'lsidebar__item--active' : ''}`}
                    onClick={() => onOpen(entry)}
                    onMouseEnter={() => setHoveredId(entry.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="lsidebar__item-inner">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="lsidebar__item-icon">
                        <circle cx="6" cy="2" r="1.5" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="2" cy="9" r="1.5" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="10" cy="9" r="1.5" stroke="currentColor" strokeWidth="1"/>
                        <line x1="6" y1="3.5" x2="2" y2="7.5" stroke="currentColor" strokeWidth="0.8"/>
                        <line x1="6" y1="3.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="0.8"/>
                      </svg>
                      <span className="lsidebar__item-label">{entry.topic}</span>
                    </div>

                    {hoveredId === entry.id && (
                      <button
                        className="lsidebar__item-delete"
                        onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {!collapsed && safeHistory.length > 0 && (
        <div className="lsidebar__footer">
          {safeHistory.length} graph{safeHistory.length !== 1 ? 's' : ''} saved
        </div>
      )}
    </aside>
  );
}