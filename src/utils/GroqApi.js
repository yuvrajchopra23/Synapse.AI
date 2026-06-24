const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL   = 'openai/gpt-oss-120b';

async function callGroq(userPrompt, systemPrompt){
    const apiKey = process.env.REACT_APP_GROQ_API_KEY;
    
    const res = await fetch(API_URL,{
        method: 'POST',
        headers:  {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
        model: MODEL,
        messages: [
        {
        role: "system",
        content: systemPrompt
        },
        {
        role: "user",
        content: userPrompt
        }
        ],
        temperature: 0.7,
        max_tokens: 6000
        }),
    });

    if (!res.ok) {
  const text = await res.text();
  console.error("FULL ERROR:", text);
  throw new Error(`API error ${res.status}`);
}

   const data = await res.json();

if (!data.choices || !data.choices.length) {
  console.error("Invalid response:", data);
  throw new Error("No choices returned from API");
}

const content = data.choices[0]?.message?.content;

if (!content) {
  console.error("Missing content:", data);
  throw new Error("No content in response");
}

return content;
}

function parseJSON(raw) {
  // Step 1: strip markdown fences
  let clean = raw.replace(/```json|```/g, '').trim();

  // Step 2: extract just the JSON object if there's extra text around it
  const firstBrace = clean.indexOf('{');
  const lastBrace  = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  // Step 3: try parsing
  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch(e) {
    // Step 4: if still failing, log exactly what we're trying to parse
    console.error('Parse error:', e.message);
    console.error('Attempted to parse:', clean.substring(0, 500));
    throw new Error('Failed to parse JSON: ' + e.message);
  }

  return parsed;
}

// ── Normalize a single node — fixes whatever shape the AI returns ──
function normalizeNode(node) {
  // keyPoints: convert array to string if needed
  if (Array.isArray(node.keyPoints)) {
    node.keyPoints = node.keyPoints.join('. ');
  }

  // questions: convert [{q, a}] objects to plain strings if needed
  if (Array.isArray(node.questions)) {
    node.questions = node.questions.map(q => {
      if (typeof q === 'string') return q;
      if (q && q.q) return q.q; // extract just the question text
      return String(q);
    });
  }

  // related: make sure it's an array of strings
  if (Array.isArray(node.related)) {
    node.related = node.related.map(r => {
      if (typeof r === 'string') return r;
      return String(r);
    });
  }

  return node;
}
export async function generateGraphData(topic){
    const system = `
You are a Knowledge Graph Generator.

Return ONLY valid JSON. No markdown. with explanations.

Format:
{
  "root": {
    "id": "root",
    "label": "short topic name",
    "description": "brief explanation",
    "example": "real example",
    "keypoints": ["point1", "point2"],
    "questions": [
      { "q": "question?", "a": "answer" }
    ],
    "related": ["concept1", "concept2"]
  },
  "nodes": [
    {
      "id": "n1",
      "label": "subtopic",
      "tier": 1,
      "description": "content",
      "example": "example",
      "keyPoints": ["point1", "point2"],
      "questions": [
        { "q": "question?", "a": "answer" }
      ],
      "related": ["concept"]
    }
  ],
  "edges": [
    { "source": "root", "target": "n1" }
  ]
}
  RULES: 
  - The root node should be the main topic and should have tier 0.
  - total nodes should be related to how many subtopics(tier1) does that topic have but if the subtopics (tier1) are more than 10 then 10 is the limit for the subtopics , mix of tier 1 and tier 2
  - Keep labels short: 2 to 4 words
  - tier 1 = direct subtopics of root, tier 2 = deeper sub-subtopics connected to tier one and related to the tier one subtopic but not directly to the root
  - edges must reflect actual connections between concepts`;
     const raw = await callGroq(`Topic: "${topic}"`, system);
  const parsed = parseJSON(raw);

  // Normalize root and all nodes to fix any shape mismatches
  parsed.root = normalizeNode(parsed.root);
  parsed.nodes = (parsed.nodes || []).map(normalizeNode);

  return parsed;
}
//expand a node to get more subtopics
export async function expandNodeData(nodeLabel){
    const system = `You are a Knowledge Graph Generator. Return Only VALID json no markdown. no explanations.
    Generate exactly 3 child subtopics for the given concept:
{
  "nodes": [
    {
      "id": "placeholder",
      "label": "Child label (2-4 words)",
      "description": "2-sentence description.",
      "example": "One concrete example.",
      "keyPoints": "Key points as a sentence.",
      "questions": ["Practice question?"],
      "related": ["concept A"]
    }
  ]
}`;

const raw = await callGroq(`Parent concept: "${nodeLabel}"`, system);
  const parsed = parseJSON(raw);
  parsed.nodes = (parsed.nodes || []).map(normalizeNode);
  return parsed;
}