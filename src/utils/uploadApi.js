const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

//send multiple files, get merged extracted text back
export async function extractTextFromFiles(files){
    const formData = new FormData();

    //apend all files under the key 'files'
    Array.from(files).forEach(file => {
        formData.append('files', file);
    });

    const res = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST', 
        body: 'formData',
        //no content type header- browser sets it with multipart boundary
    });

    const data = await res.json();
    if(!res.ok) {
        throw new Error(data.error || 'Failed to process files');
    }

    return data; //{ text, files[], totalChars, filecount}
}