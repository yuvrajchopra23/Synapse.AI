# Synapse.ai — AI-Powered Knowledge Graph System

> Transform any topic or document into an interactive, structured knowledge graph powered by AI.

**Live App:** https://synapse-frontend-vsjg.onrender.com

---

## What is Synapse.ai?

Synapse.ai is an intelligent learning tool that takes any topic or uploaded document and converts it into a visual, interactive knowledge graph. Instead of reading flat notes, you explore a web of interconnected concepts — each node containing structured notes, quiz questions with answers, and reference links.

Built by a BCA student at Chitkara University as a research-grade educational tool, targeting AI/ML integration for adaptive learning.

---

## Features

### Core
- **AI Knowledge Graph Generation** — type any topic and generate a structured graph of concepts, subtopics, and connections
- **Document Upload** — upload PDF, PPTX, DOCX, XLSX, or TXT files and generate a graph from your own content
- **Three Generation Modes**
  - Topic only (internet knowledge)
  - File only (strictly from your documents, no external data)
  - File + Internet (document content enhanced with broader knowledge)
- **Node Expansion** — click any node and expand it into 3 deeper subtopics
- **Context-aware Expansion** — expanded nodes stay relevant to the root topic (e.g. "Lifecycle" inside a React graph expands to React lifecycle, not biological)
- **Contextual Node** — clicking any node auto-generates a subject-aware practical content block in the graph canvas:
  - DSA topics → pseudocode + time/space complexity
  - Math topics → medium difficulty solved problem with steps
  - Physics → formula derivation + numerical
  - Chemistry → reaction + explanation
  - Theory → real-world case study
  - Biology → process description

### Notes & Learning
- **Structured Notes** — Overview, Key Concepts, Examples, Key Takeaways per node
- **Quiz with Answers** — each node has practice questions with full answers and explanations, revealed on demand
- **Reference Links** — Wikipedia and YouTube search links per node
- **Related Concepts** — linked concepts per node

### User System
- **Authentication** — signup/login with email and password (JWT + bcrypt)
- **Per-user History** — all graphs saved to MongoDB, synced across devices
- **File Source Persistence** — extracted document text saved to database so file-based node expansion works after page reload

### Interface
- **Internet Toggle** — always visible in topbar, controls whether generation and expansion use internet or file content only
- **History Sidebar** — collapsible left panel with all saved graphs grouped by date
- **Mobile Responsive** — bottom navigation (History / Graph / Notes) for phone use
- **Dark Futuristic UI** — monochrome design with Space Mono + DM Sans typography

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Cytoscape.js | Graph visualization and layout engine |
| DM Sans + Space Mono | Typography |
| Plain CSS with CSS variables | Styling and theming |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| JWT + bcryptjs | Authentication |
| multer | File upload handling |
| pdf-parse | PDF text extraction |
| mammoth | DOCX text extraction |
| xlsx (SheetJS) | Excel text extraction |
| jszip | PPTX text extraction |

### AI
| Technology | Purpose |
|---|---|
| Groq API | LLM inference (llama-3.1-8b-instant) |
| Prompt Engineering | Structured JSON generation, subject detection |

### Deployment
| Service | Purpose |
|---|---|
| Render (Web Service) | Backend hosting |
| Render (Static Site) | Frontend hosting |
| MongoDB Atlas | Cloud database |

---

## Project Structure

```
Synapse.AI/                          ← monorepo root
├── src/                             ← React frontend
│   ├── components/
│   │   ├── topbar.jsx               ← search, file upload, internet toggle
│   │   ├── Graphcanvas.jsx          ← Cytoscape graph + contextual nodes
│   │   ├── sidebar.jsx              ← Notes / Quiz / Links tabs
│   │   ├── LeftSidebar.jsx          ← history panel
│   │   ├── FileBar.jsx              ← uploaded files display
│   │   ├── BottomNav.jsx            ← mobile navigation
│   │   ├── ExpandDialog.jsx         ← prompt when file content insufficient
│   │   └── AuthContext.jsx          ← global auth state
│   ├── hooks/
│   │   └── useKnowledgeGraph.js     ← all graph state and logic
│   ├── utils/
│   │   ├── GroqApi.js               ← all AI generation functions
│   │   ├── graphApi.js              ← graph CRUD API calls
│   │   ├── authApi.js               ← login/signup API calls
│   │   └── uploadApi.js             ← file upload API calls
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── App.jsx                      ← root component
│   └── index.js
│
├── synapse-backend/                 ← Express backend
│   ├── models/
│   │   ├── User.js                  ← user schema
│   │   └── Graph.js                 ← graph schema (with sourceFiles + extractedText)
│   ├── routes/
│   │   ├── auth.js                  ← POST /api/auth/signup, /login
│   │   ├── graphs.js                ← GET/POST/PUT/DELETE /api/graphs
│   │   └── upload.js                ← POST /api/upload
│   ├── middleware/
│   │   └── auth.js                  ← JWT verification middleware
│   └── server.js
```

---

## How It Works

### Graph Generation Flow

```
User inputs topic or uploads files
              ↓
Mode detection: topic-only / file-only / file+internet
              ↓
[File mode] Extract text from PDF/PPTX/DOCX/XLSX
              ↓
Groq LLM receives prompt with content + instructions
              ↓
Returns structured JSON: { root, nodes[], edges[] }
              ↓
Cytoscape.js renders interactive graph
              ↓
Graph + extracted text saved to MongoDB
```

### Contextual Node Flow

```
User clicks a graph node
              ↓
Groq detects subject type (DSA / Math / Physics / Theory etc.)
              ↓
Generates subject-appropriate content
              ↓
Dashed-border node appears in graph canvas connected to clicked node
              ↓
Result cached — clicking same node again shows instantly
```

### Node Expansion Flow

```
User clicks "Expand subtopics" on a node
              ↓
Check: internet ON or file content available?
              ↓
[File-only] Search extracted document text for subtopics
    → If insufficient → prompt user: "Expand with internet?"
              ↓
[Internet] Groq generates 3 child nodes in context of root topic
              ↓
New nodes + edges added to graph and saved to MongoDB
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB running locally or MongoDB Atlas connection string
- Groq API key (free at console.groq.com)

### Backend

```bash
cd synapse-backend
npm install
```

Create `synapse-backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/synapse
JWT_SECRET=your_long_random_secret_here
PORT=5000
```

```bash
node server.js
```

### Frontend

```bash
npm install
```

Create `.env` in root:
```
REACT_APP_GROQ_API_KEY=your_groq_key_here
REACT_APP_BACKEND_URL=http://localhost:5000
```

```bash
npm start
```

Open `http://localhost:3000`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Graphs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/graphs` | Fetch all graphs for logged-in user |
| POST | `/api/graphs` | Save a new graph |
| PUT | `/api/graphs/:id` | Update graph (after node expansion) |
| DELETE | `/api/graphs/:id` | Delete a graph |

### Upload
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload files, returns extracted text |

---

## Roadmap

### In Progress
- [x] Contextual node (subject-aware practical content)
- [ ] Concept relationship explanation on edge click
- [ ] Difficulty badge per node (Beginner / Intermediate / Advanced)
- [ ] Progress tracking — mark nodes as understood

### Planned
- [ ] Share graph via public link
- [ ] Export notes as PDF
- [ ] Export graph as PNG
- [ ] Search across all saved graphs
- [ ] "Test me" mode — hide node labels, click to reveal
- [ ] Revision reminders for graphs not visited in 7+ days
- [ ] Prerequisites detector at root node
- [ ] Pomodoro timer in status bar
- [ ] Offline mode — cache last 5 graphs
- [ ] RAG pipeline — Wikipedia retrieval for grounded generation

---

## Built By

**Yuvraj Chopra** — BCA Student, Chitkara University, Punjab
CGPA: 9.71 |

---

