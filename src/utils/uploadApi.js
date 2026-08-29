const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export async function extractTextFromFiles(files) {
  const formData = new FormData();

  Array.from(files).forEach(file => {
    console.log('Appending file:', file.name, file.type, file.size);
    formData.append('files', file);
  });

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,  // ← NO quotes — pass the object, not the string
  });

  const data = await res.json();
  console.log('Upload response:', data);

  if (!res.ok) {
    throw new Error(data.error || 'Failed to process files');
  }

  return data;
}