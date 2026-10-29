const BASE_URL = process.env.REACT_APP_BACKEND_URL;

function getToken() {
    return localStorage.getItem('synapse_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

// Fetch all graphs for logged-in user 
export async function fetchGraphs() {
  const res = await fetch(`${BASE_URL}/api/graphs`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch graphs');
  return data; // array of { _id, topic, graph, createdAt }
}

// ── Save a new graph
export async function saveGraph(topic, graph, sourceFiles = [], extractedText = '') {
  const res = await fetch(`${BASE_URL}/api/graphs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ topic, graph, sourceFiles, extractedText }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save graph');
  return data; // saved graph with _id
}

// ── Update a graph (after expansion) 
export async function updateGraph(id, graph) {
  const res = await fetch(`${BASE_URL}/api/graphs/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ graph }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update graph');
  return data;
}

// ── Delete a graph 
export async function deleteGraph(id) {
  const res = await fetch(`${BASE_URL}/api/graphs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete graph');
  return data;
}
//generate a shareable link for a graph
export async function shareGraph(id){
  const res = await fetch(`${BASE_URL}/api/graphs/${id}/share`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data.error || 'Failed to generate Shared Link');
  return data; // {shareToken: '...'}
}

//fetch a publicly shared graph, no auth
export async function fetchSharedGraph(token){
  const res = await fetch(`${BASE_URL}/api/shared/${token}`);
  const data = await res.json();
  if(!res.ok) throw new Error(data.error || 'Failed to fetch shared graph');
  return data; // {topic, graph, createdAt}
}