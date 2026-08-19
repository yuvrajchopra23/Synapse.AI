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
  const notes = node.notes || {};
  const overview = notes.overview || node.description || '';
  const keyConcepts = notes.keyConcepts || [];
  const example = notes.example || node.example || '';
  const keyPoints = notes.keyPoints || (node.keyPoints?[node.keyPoints] : []);
  return (
    <>
      <h2 className="sidebar__node-title">{node.label}</h2>

      {overview && (
        <Section label="Overview">
          <p>{overview}</p>
        </Section>
      )}

      {keyConcepts.length > 0 && (
        <Section label="Key Concepts">
          <ul className="sidebar__list">
            {keyConcepts.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Section>
      )}

      {example && (
        <Section label="Example">
          <p>{example}</p>
        </Section>
      )}

      {keyPoints.length > 0 && (
        <Section label="Key Takeaways">
          <ul className="sidebar__list sidebar__list--check">
            {keyPoints.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </Section>
      )}

      <button
        className="sidebar__expand-btn"
        onClick={() => onExpand(node.id, node.label)}
      >
        + Expand subtopics
      </button>
    </>
  );
}

// ── Quiz tab ─────────────────────────────────────────────────
function QuizPanel({ node }) {
  const questions = node.questions || [];
  if (questions.length === 0) {
  return (
    <>
      <h2 className="sidebar__node-title">{node.label}</h2>
      <p className="sidebar__muted">No quiz questions available for this topic.</p>
    </>
    );
  }
  return(
    <>
    <h2 className="sidebar__node-title">{node.label}</h2>
    <section label="Practice Questions">
      {questions.map((q,i)=>(
        <QuizCard key={i} index={i+1} question={q} />
      ))}
    </section>
    </>
  );
}
function QuizCard({index, question}){
  const [revealed, setRevealed] = useState(false);
  const questionText = typeof question === 'string' ? question : question.q;
  const answerText = typeof question === 'string' ? '': question.a;
  const explanation = typeof question === 'string' ? '':question.explanation;

  return(
    <div className="quiz-card">
      <div className = "quiz-card__number">Q{index}</div>
      <p className="quiz-card__question">{questionText}</p>
      {!revealed?(
        <button 
        className="quiz-card__reveal"
        onClick={()=>setRevealed(true)}>
          Show Answer
        </button>
      ) : (
        <div className="quiz-card__answer-block">
          {answerText && (
            <div className="quiz-card__answer">
              <span className="quiz-card__answer-label">Answer</span>
              <p>{answerText}</p>
            </div>
          )}
          {explanation && (
            <div className="quiz-card__explanation">
              <span className="quiz-card__answer-label">Explanation</span>
              <p>{explanation}</p>
            </div>
          )}
          <button
            className="quiz-card__reveal quiz-card__reveal--hide"
            onClick={() => setRevealed(false)}
          >
            Hide Answer
          </button>
        </div>
      )}
    </div>
  );
}


// ── Links tab ───────────────────────────────────────────────
function LinksPanel({ node }) {
  const links = node.links || {};
  const references = links.references || node.related || [];

  return (
    <>
      <h2 className="sidebar__node-title">{node.label}</h2>

      <Section label="Resources">
        {links.website && (
          <a
            href={links.website}
            target="_blank"
            rel="noreferrer"
            className="sidebar__link-card"
          >
            <div className="sidebar__link-icon">🌐</div>
            <div>
              <div className="sidebar__link-title">Wikipedia</div>
              <div className="sidebar__link-sub">Read the full article</div>
            </div>
            <div className="sidebar__link-arrow">↗</div>
          </a>
        )}

        {links.youtube && (
          <a
            href={links.youtube}
            target="_blank"
            rel="noreferrer"
            className="sidebar__link-card"
          >
            <div className="sidebar__link-icon">▶</div>
            <div>
              <div className="sidebar__link-title">YouTube</div>
              <div className="sidebar__link-sub">Watch video explanations</div>
            </div>
            <div className="sidebar__link-arrow">↗</div>
          </a>
        )}
      </Section>

      {references.length > 0 && (
        <Section label="Related Concepts">
          {references.map((r, i) => (
            <div key={i} className="sidebar__card">{r}</div>
          ))}
        </Section>
      )}
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