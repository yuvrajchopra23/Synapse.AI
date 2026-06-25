# Synapse.AI 

**Synapse.AI** is an AI-powered knowledge graph generator that turns any topic into an interactive, explorable concept map, built with React, Cytoscape.js, and the Groq API.

Type in a topic, and Synapse.AI generates a structured graph of subtopics, examples, key points, and practice questions — then lets you click into any node to expand it further, drilling deeper into the concept tree on demand.

---

## What It Does

- **Type any topic** — e.g. "Neural Networks", "React", "Quantum Computing" and Synapse.AI generates a full knowledge graph around it
- **Explore visually** — nodes and edges render as an interactive graph using Cytoscape.js, with tiered relationships (root → subtopics → sub-subtopics)
- **Expand any node** — click a node to generate 3 new child subtopics on the fly, letting you go as deep into a concept as you want
- **Learn from each node** — selecting a node opens a side panel with **Notes**, **Quiz**, and **Links** tabs: descriptions, examples, key points, and practice questions.
- **Full authentication** — dedicated login/signup flow with JWT; each user only ever sees their own graphs
- **Graph history sidebar** — every generated graph is saved with its creation date (e.g. "Jun 23") and listed in a sidebar for quick access; graphs can be deleted individually from history
- **Persistent, per-user storage** — graphs are stored in MongoDB (managed via MongoDB Compass during development); logging in as a different user shows only that user's saved graphs
- **Minimal, terminal-inspired UI** — dark theme with a monospace, command-line aesthetic

---

## How It Works

1. User submits a topic through the React frontend
2. The request hits the Express.js backend, which calls the **Groq API** (running `openai/gpt-oss-120b`) with a carefully engineered system prompt
3. The model is instructed to return **strictly structured JSON**, a root node, an array of subtopic nodes (tiered), and an array of edges connecting them
4. A custom parsing layer cleans and validates the AI's response:
   - Strips markdown code fences the model sometimes adds
   - Extracts the JSON object even if the model adds extra text around it
   - **Normalizes inconsistent shapes** — e.g. if the AI returns `keyPoints` as an array sometimes and a string other times, or returns questions as objects vs. plain strings, the normalizer fixes it before the data ever reaches the UI
5. The cleaned graph data renders in Cytoscape.js as an interactive, clickable graph
6. Clicking any node triggers a second, smaller Groq call (`expandNodeData`) that generates exactly 3 new child subtopics, which get merged into the existing graph
7. Graphs are tied to authenticated users via JWT and persisted in MongoDB (managed locally via MongoDB Compass) each graph is timestamped and listed in the sidebar, so users can log back in, see their graph history by date, revisit, or delete any saved graph

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Cytoscape.js |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Auth | JWT (JSON Web Tokens) |
| AI | Groq API — `openai/gpt-oss-120b` |

---

## Key Engineering Challenges Solved

- **Unreliable LLM output formatting** — the model would sometimes wrap JSON in markdown fences, add explanatory text, or return inconsistent data shapes (e.g. arrays vs. strings for the same field). Built a dedicated parsing + normalization layer (`parseJSON`, `normalizeNode`) to make the output reliably consumable by the frontend regardless of how the model formats its response.
- **Incremental graph expansion** — rather than regenerating the entire graph, node expansion calls a separate, smaller prompt scoped to just the clicked concept, keeping responses fast and the graph coherent as it grows.
- **Tiered topic structure** — the system prompt enforces a tier system (root → tier 1 → tier 2) so the graph has a sensible depth and breadth instead of an unstructured node dump, capping subtopics at 10 to keep graphs readable.

---

## Running Locally

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
