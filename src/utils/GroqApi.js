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

  // questions: keep the full {q, a, explanations} objects- dont flatten to string
  if (Array.isArray(node.questions)) {
    node.questions = node.questions.map(q => {
      if (typeof q === 'string') {
        return {q, a: '', explanations: ''};
      }
      return{
        q: q.q || q.question || '',
        a: q.a || q.answer || '',
        explanations: q.explanations || q.explain || ''
      };
    });
  }

  // related: make sure it's an array of strings
  if (Array.isArray(node.related)) {
    node.related = node.related.map(r => {
      if (typeof r === 'string') return r;
      return String(r);
    });
  }
  if (!node.links){
    node.links = {
      website: '',
      youtube: '',
      references: []
    };
  }
  return node;
}

export async function generateGraphData(topic){
    const system = `
You are a Knowledge Graph Generator and Educational Content Expert.

Return ONLY valid JSON. No markdown. with explanations. No extra text outside the JSON.

Format:
{
  "root": {
    "id": "root",
    "label": "short topic name (2-4 words)",
    "notes": {
      "overview": "A clear 3-4 sentence explanation of what this topic is and why it matters.",
      "keyConcepts": ["concept 1 with brief explanation", "concept 2 with brief explanation", "concept 3 with brief explanation"],
      "example": "A detailed real-world example showing this topic in action.",
      "keyPoints": ["key takeaway 1", "key takeaway 2", "key takeaway 3"]
    },
    "questions": [
      {
        "q": "A clear conceptual question about this topic?",
        "a": "A complete, accurate answer to the question.",
        "explanation": "A deeper explanation of why this answer is correct and what it teaches."
      }
    ],
    "links": {
      "website": "https://en.wikipedia.org/wiki/TOPIC_NAME",
      "youtube": "https://www.youtube.com/results?search_query=TOPIC_NAME+explained",
      "references": ["Related concept 1", "Related concept 2", "Related concept 3"]
    }
  },
  "nodes": [
    {
      "id": "n1",
      "label": "subtopic (2-4 words)",
      "tier": 1,
      "notes": {
        "overview": "A clear 2-3 sentence explanation of this subtopic.",
        "keyConcepts": ["concept 1", "concept 2"],
        "example": "A concrete real-world example.",
        "keyPoints": ["key takeaway 1", "key takeaway 2"]
      },
      "questions": [
        {
          "q": "A question specific to this subtopic?",
          "a": "Complete accurate answer.",
          "explanation": "Deeper explanation of the concept being tested."
        }
      ],
      "links": {
        "website": "https://en.wikipedia.org/wiki/SUBTOPIC_NAME",
        "youtube": "https://www.youtube.com/results?search_query=SUBTOPIC_NAME+tutorial",
        "references": ["related concept 1", "related concept 2"]
      }
    }
  ],
  "edges": [
    { "source": "root", "target": "n1" }
  ]
}

RULES:
- Root node = main topic, tier 0
- Total child nodes: based on how many real subtopics the topic has, max 10
- tier 1 = direct subtopics of root
- tier 2 = deeper sub-subtopics of tier 1 nodes
- Keep labels SHORT: 2 to 4 words only
- edges must reflect real conceptual connections
- notes.overview must be clear and educational, NOT generic filler text
- questions must test real understanding, NOT trivial facts
- answers must be complete and accurate
- For links.website use the actual Wikipedia URL for that topic
- For links.youtube use YouTube search URL with the topic name
- Return ONLY the JSON object, nothing else`;

  const raw = await callGroq(`Topic: "${topic}"`, system);
  const parsed = parseJSON(raw);

  // Normalize root and all nodes to fix any shape mismatches
  parsed.root = normalizeNode(parsed.root);
  parsed.nodes = (parsed.nodes || []).map(normalizeNode);

  return parsed;
}
//expand a node to get more subtopics
export async function expandNodeData(nodeLabel, rootTopic){
    const system = `You are a Knowledge Graph Generator. Return Only VALID json no markdown. no explanations.
    Generate exactly 3 child subtopics for the given concept, in the context of the root topic.:
{
  "nodes": [
    {
      "id": "placeholder",
      "label": "Child label (2-4 words)",
      "notes": {
        "overview": "2-3 sentence explanation.",
        "keyConcepts": ["concept 1", "concept 2"],
        "example": "One concrete example.",
        "keyPoints": ["takeaway 1", "takeaway 2"]
      },
      "questions": [
        {
          "q": "A specific question about this subtopic?",
          "a": "Complete accurate answer.",
          "explanation": "Deeper explanation of the concept."
        }
      ],
      "links": {
        "website": "https://en.wikipedia.org/wiki/SUBTOPIC",
        "youtube": "https://www.youtube.com/results?search_query=SUBTOPIC+explained",
        "references": ["related concept 1", "related concept 2"]
      }
    }
  ]
}

Return ONLY the JSON object, nothing else.`;

  const raw = await callGroq(
    `Root topic: "${rootTopic}". Expand this subtopic: "${nodeLabel}"`,
    system
  );
  const parsed = parseJSON(raw);
  parsed.nodes = (parsed.nodes || []).map(normalizeNode);
  return parsed;
}

//GENERATE THE GRAPH FROM FILES ONLY:.....
export async function generateGraphFromFiles(mergedText, filenames){
  const system = `
  You are a Knowledge Graph Generator and Educational Content Expert.

  You will recieve raw extracted text from one or more documents (PDF, PPT, DOCX, XLSX).
  Your job is to: 
  1. UNDERSTAND the content deeply
  2. STRUCTURE it into a proper, organized knowledge graph
  3. Generate clear descriptions, examples, and quiz questions
  4. ONLY use information present in or directly implied by the provided content
  5. NEVER add external facts not found in the documents
  6. Present the content in a clean, educational way - not as raw bullet points

  Return ONLY valid JSON. No markdown. No extra text.

  Format:
{
  "root": {
    "id": "root",
    "label": "Main topic (2-4 words)",
    "notes": {
      "overview": "3-4 sentence explanation based on the document content.",
      "keyConcepts": ["concept from document", "concept from document"],
      "example": "Example found in or derived from the document.",
      "keyPoints": ["key point from doc", "key point from doc"]
    },
    "questions": [
      {
        "q": "Question based strictly on document content?",
        "a": "Answer found in the document.",
        "explanation": "Deeper explanation based on document content."
      }
    ],
    "links": {
      "website": "",
      "youtube": "",
      "references": []
    }
  },
  "nodes": [
    {
      "id": "n1",
      "label": "Subtopic (2-4 words)",
      "tier": 1,
      "notes": {
        "overview": "Explanation based on document content.",
        "keyConcepts": ["concept 1", "concept 2"],
        "example": "Example from document.",
        "keyPoints": ["takeaway 1", "takeaway 2"]
      },
      "questions": [
        {
          "q": "Question about this subtopic from the document?",
          "a": "Answer from document.",
          "explanation": "Explanation based on document content."
        }
      ],
      "links": {
        "website": "",
        "youtube": "",
        "references": []
      }
    }
  ],
  "edges": [
    { "source": "root", "target": "n1" }
  ]
}

RULES:
- Extract the MAIN TOPIC from the document content as root
- Create nodes for every major topic/section in the documents
- Maximum 10 tier-1 nodes
- tier 2 nodes for subtopics within sections
- Keep labels SHORT: 2-4 words
- Base ALL content strictly on provided document text
- Structure and clarify the content — but never add outside information
- Return ONLY the JSON object`;

  const fileList = filenames.join(', ');
  const raw = await callGroq(
    `Files: ${fileList}\n\nDocument content:\n${mergedText}`,
    system
  );

  const parsed = parseJSON(raw);
  parsed.root = normalizeNode(parsed.root);
  parsed.nodes = (parsed.nodes || []).map(normalizeNode);
  return parsed;
}

//Mode 3: Generate graph from files + internet....

export async function generateGraphFromFilesAndInternet(mergedText, filenames, topic){
    const system = `
You are a Knowledge Graph Generator and Educational Content Expert.

You will receive:
1. Raw extracted text from uploaded documents
2. A topic name to search your knowledge for additional context

Your job is to:
1. Use the document content as the PRIMARY source
2. ENHANCE it with your broader knowledge of the topic
3. Fill in gaps, add context, and deepen explanations
4. Clearly structure everything into a knowledge graph
5. Generate rich descriptions, examples, and quiz questions

Return ONLY valid JSON. No markdown. No extra text.

Format: (same as generateGraphFromFiles above)
{
  "root": {
    "id": "root",
    "label": "Main topic (2-4 words)",
    "notes": {
      "overview": "Rich explanation combining document + broader knowledge.",
      "keyConcepts": ["concept 1", "concept 2", "concept 3"],
      "example": "Detailed real-world example.",
      "keyPoints": ["key takeaway 1", "key takeaway 2", "key takeaway 3"]
    },
    "questions": [
      {
        "q": "Deep question about this topic?",
        "a": "Complete accurate answer.",
        "explanation": "Deeper explanation."
      }
    ],
    "links": {
      "website": "",
      "youtube": "",
      "references": []
    }
  },
  "nodes": [
    {
      "id": "n1",
      "label": "Subtopic (2-4 words)",
      "tier": 1,
      "notes": {
        "overview": "Enhanced explanation.",
        "keyConcepts": ["concept 1", "concept 2"],
        "example": "Concrete example.",
        "keyPoints": ["takeaway 1", "takeaway 2"]
      },
      "questions": [
        {
          "q": "Question about this subtopic?",
          "a": "Complete answer.",
          "explanation": "Deeper explanation."
        }
      ],
      "links": {
        "website": "",
        "youtube": "",
        "references": []
      }
    }
  ],
  "edges": [{ "source": "root", "target": "n1" }]
}

RULES:
- Document content is PRIMARY — always include everything from it
- Your broader knowledge is SECONDARY — use it to enhance, not replace
- Maximum 10 tier-1 nodes
- Keep labels SHORT: 2-4 words
- Return ONLY the JSON object`;

const fileList = filenames.join(', ');
const raw = await callGroq(
  `Topic: "${topic}"\n Files: ${fileList}\n\nDocument content: \n${mergedText}`,
  system
);

const parsed = parseJSON(raw);
parsed.root = normalizeNode(parsed.root);
parsed.nodes = (parsed.nodes || []).map(normalizeNode);
return parsed;
}

//expand node from file content only
export async function expandNodeFromFiles(nodeLabel, rootTopic, fileText) {
  const system = `
You are a Knowledge Graph Generator.
Return ONLY valid JSON, no markdown, no extra text.

You will receive content from uploaded documents.
Generate exactly 3 child subtopics for the given concept.
Use ONLY information found in the provided document content.
If you cannot find enough content to generate 3 meaningful subtopics,
return what you can find and set "insufficient": true.

{
  "insufficient": false,
  "nodes": [
    {
      "id": "placeholder",
      "label": "Child label (2-4 words)",
      "notes": {
        "overview": "Explanation from document content.",
        "keyConcepts": ["concept 1", "concept 2"],
        "example": "Example from document.",
        "keyPoints": ["takeaway 1", "takeaway 2"]
      },
      "questions": [
        {
          "q": "Question from document content?",
          "a": "Answer from document.",
          "explanation": "Explanation from document."
        }
      ],
      "links": { "website": "", "youtube": "", "references": [] }
    }
  ]
}`;

  const raw = await callGroq(
    `Root topic: "${rootTopic}"\nExpand subtopic: "${nodeLabel}"\n\nDocument content:\n${fileText}`,
    system
  );

  const parsed = parseJSON(raw);
  if (parsed.nodes) {
    parsed.nodes = parsed.nodes.map(normalizeNode);
  }
  return parsed; // { insufficient: bool, nodes: [] }
}