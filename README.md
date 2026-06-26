# Synapse.AI 

**Synapse.AI** is an AI-powered knowledge graph generator that turns any topic into an interactive, explorable concept map, built with React, Cytoscape.js, and the Groq API.

Type in a topic, and Synapse.AI generates a structured graph of subtopics, examples, key points, and practice questions — then lets you click into any node to expand it further, drilling deeper into the concept tree on demand.

---

## What It Does

- **Type any topic** — e.g. "Neural Networks", "React", "Quantum Computing" and Synapse.AI generates a full knowledge graph around it.
- **Explore visually** — nodes and edges render as an interactive graph using Cytoscape.js, with tiered relationships (root → subtopics → sub-subtopics).
- **Expand any node** — click a node to generate 3 new child subtopics on the fly, letting you go as deep into a concept as you want.
- **Learn from each node** — selecting a node opens a side panel with **Notes**, **Quiz**, and **Links** tabs showing descriptions, examples, key points, and practice questions.
- **Full authentication** — dedicated login/signup flow with JWT; users only see their own custom-generated maps.
- **Graph history sidebar** — every generated graph is saved with its creation date (e.g. "Jun 23") and listed in a sidebar for quick access; graphs can be deleted individually from history.
- **Persistent, per-user local storage** — graph maps are stored in browser's local storage (scoped per user ID). Logging in as a different user loads only that specific user's saved graphs.
- **Minimal, terminal-inspired UI** — dark theme with a monospace, command-line aesthetic.

---

## How It Works

1. User submits a topic through the React frontend.
2. The React frontend queries the **Groq API** directly (running `openai/gpt-oss-120b`) using the environment variables securely loaded in React.
3. The model is instructed to return **strictly structured JSON** containing a root node, an array of subtopic nodes, and an array of edges.
4. A custom parsing layer on the frontend cleans and validates the AI's response:
   - Strips markdown code fences the model sometimes adds.
   - Extracts the JSON object even if the model adds extra conversational text.
   - **Normalizes inconsistent shapes** — e.g. if the AI returns `keyPoints` as an array sometimes and a string other times, or returns questions as objects vs. plain strings, the normalizer fixes it before it reaches the UI.
5. The cleaned graph data renders in Cytoscape.js as an interactive, clickable graph.
6. Clicking any node triggers a second, smaller Groq call (`expandNodeData`) that generates exactly 3 new child subtopics, which get merged dynamically into the existing canvas.
7. Graphs are tied to authenticated users via JWT. The user's active session history is persisted in `localStorage` under `synapse_history_${userId}`, loading their specific list of maps automatically when they log back in.
8. The backend (Express/MongoDB) handles user accounts securely (password hashing via bcrypt, user indexing in MongoDB, and session authorization via JSON Web Tokens).

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React, Cytoscape.js | User interface, interactive graph canvas, rendering nodes/edges |
| **Backend** | Node.js, Express.js | Secure user authentication endpoints (`/api/auth`) |
| **Database** | MongoDB | Stores registered user credentials securely |
| **Auth** | JWT (JSON Web Tokens) | Authorizes client requests and scopes user data |
| **Storage** | LocalStorage | Stores graph maps and user history locally, scoped per user ID |
| **AI** | Groq API — `openai/gpt-oss-120b` | Powers core knowledge graph and subtopic node expansions |

---

## Key Engineering Challenges Solved

- **Unreliable LLM output formatting** — the model would sometimes wrap JSON in markdown fences, add explanatory text, or return inconsistent data shapes (e.g. arrays vs. strings for the same field). Built a dedicated parsing + normalization layer (`parseJSON`, `normalizeNode`) on the frontend to make the output reliably consumable by Cytoscape.js.
- **Incremental graph expansion** — rather than regenerating the entire graph, node expansion calls a separate, smaller prompt scoped to just the clicked concept, keeping responses fast and the graph coherent as it grows.
- **Tiered topic structure** — the system prompt enforces a tier system (root → tier 1 → tier 2) so the graph has a sensible depth and breadth instead of an unstructured node dump, capping subtopics at 10 to keep graphs readable.

---

## Running Locally

### Setup Backend (.env)
Create a `.env` file in the `synapse-backend` directory:
```env
JWT_SECRET=your_jwt_secret_here
PORT=5000
MONGODB_URI=mongodb://localhost:27017/synapse

```bash
# clone the repo
git clone https://github.com/yuvrajchopra23/Synapse.AI.git
cd Synapse.AI

# install frontend dependencies
npm install

# install backend dependencies
cd synapse-backend
npm install

# add your Groq API key
# create a .env file in the root with:
# REACT_APP_GROQ_API_KEY=your_key_here

# run the backend
npm start

# in a separate terminal, run the frontend
cd ..
npm start
```

---
