import React from 'react';
import './BottomNav.css';

export default function BottomNav({activePanel, onChange, hasGraph, hasNode}){
    return(
        <div className="bottom-nav">
            <button
                className={`bottom-nav__btn ${activePanel === 'history' ? 'bottom-nav__btn--active' : ''}`}
                onClick={() => onChange('history')}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="4" cy="13" r="2" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="14" cy="13" r="2" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="9" y1="6" x2="4" y2="11" stroke="currentColor" strokeWidth="1"/>
                <line x1="9" y1="6" x2="14" y2="11" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <span>History</span> 
                </button>

        <button
        className={`bottom-nav__btn ${activePanel === 'graph' ? 'bottom-nav__btn--active' : ''}`}
        onClick={() => onChange('graph')}
        >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="12" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="7" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="7" y="12" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <line x1="9" y1="6" x2="9" y2="7" stroke="currentColor" strokeWidth="1"/>
          <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1"/>
          <line x1="9" y1="11" x2="9" y2="12" stroke="currentColor" strokeWidth="1"/>
        </svg>
        <span>Graph</span>
        {hasGraph && <div className="bottom-nav__dot" />}
        </button>
         <button
        className={`bottom-nav__btn ${activePanel === 'notes' ? 'bottom-nav__btn--active' : ''}`}
        onClick={() => onChange('notes')}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
          <line x1="6" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1"/>
          <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1"/>
          <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1"/>
        </svg>
        <span>Notes</span>
        {hasNode && <div className="bottom-nav__dot" />}
      </button>
    </div>
  );
}