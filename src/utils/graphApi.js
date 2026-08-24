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
export async function saveGraph(topic, graph) {
  const res = await fetch(`${BASE_URL}/api/graphs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ topic, graph }),
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