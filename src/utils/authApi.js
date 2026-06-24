const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export async function signup(name, email, password){
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, password}),
    });

    const data = await res.json();

    if (!res.ok){
        throw new Error(data.error || 'signup failed');
    }

    return data; //token, user:{id, name, email}
}

export async function login(email, password){
    const res = await fetch(`${BASE_URL}/api/auth/login`,{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
    });

    const data = await res.json();

    if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
 
  return data; // { token, user: { id, name, email } }
}
 