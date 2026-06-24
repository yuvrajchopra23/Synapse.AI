import React, {useState} from "react";
import './sidebar.css';

const TABS = ["Notes", "Quiz", "Links"];

export default function Sidebar({selectedNode, onExpand}) {
    const [activeTab, setActiveTab] = useState('Notes');
    if (!selectedNode) {
    return (
      <aside className="sidebar">
        <div className="sidebar__header">
          <TabRow active={activeTab} onChange={setActiveTab} />
        </div>
        <div className="sidebar__empty">
          select a node<br />to see details
        </div>
      </aside>
    );
  }
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <TabRow active={activeTab} onChange={setActiveTab} />
      </div>
      <div className="sidebar__content">
        {activeTab === 'Notes' && <NotesPanel node={selectedNode} onExpand={onExpand} />}
        {activeTab === 'Quiz'  && <QuizPanel  node={selectedNode} />}
        {activeTab === 'Links' && <LinksPanel node={selectedNode} />}
      </div>
    </aside>
  );
}

function TabRow({ active, onChange }) {
  return (
    <div className="tab-row">
      {TABS.map(t => (
        <button
          key={t}
          className={`tab ${active === t ? 'tab--active' : ''}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Notes tab ────────────────────────────────────────────────
function NotesPanel({ node, onExpand }) {
  return (
    <>
      <h2 className="sidebar__node-title">{node.label}</h2>
      <Section label="Overview"><p>{node.description}</p></Section>
      {node.example   && <Section label="Example"><p>{node.example}</p></Section>}
      {node.keyPoints && <Section label="Key Points"><p>{node.keyPoints}</p></Section>}
      <button className="sidebar__expand-btn" onClick={() => onExpand(node.id, node.label)}>
        + Expand subtopics
      </button>
    </>
  );
}

// ── Quiz tab ─────────────────────────────────────────────────
function QuizPanel({ node }) {
  const questions = node.questions || [];
  return (
    <>
      <h2 className="sidebar__node-title">{node.label}</h2>
      <Section label="Practice Questions">
        {questions.length > 0
          ? questions.map((q, i) => <div key={i} className="sidebar__card">{q}</div>)
          : <p className="sidebar__muted">No questions available.</p>}
      </Section>
    </>
  );
}

// ── Links tab ───────────────────────────────────────────────
function LinksPanel({ node }) {
  const related = node.related || [];
  return (
    <>
      <h2 className="sidebar__node-title">{node.label}</h2>
      <Section label="Related Concepts">
        {related.length > 0
          ? related.map((r, i) => <div key={i} className="sidebar__card">{r}</div>)
          : <p className="sidebar__muted">No related concepts.</p>}
      </Section>
    </>
  );
}

// ── Reusable section wrapper ──────────────────────────────────
function Section({ label, children }) {
  return (
    <div className="sidebar__section">
      <div className="sidebar__section-label">{label}</div>
      {children}
    </div>
  );
}