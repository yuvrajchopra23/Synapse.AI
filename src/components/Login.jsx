import React, {useState} from 'react';
import { login } from '../utils/authApi';
import { useAuth } from './AuthContext';
import './Auth.css';

export default function Login({onSwitchToSignup}){
    const {loginUser} = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');

    async function handleSubmit(e){
        e.preventDefault();//stop the form from reloading the page
        setError('');

        if(!email || !password){
            setError('please fill in all fields');
            return;
        }

        setLoading(true);
        try{
            const data = await login(email, password);
            loginUser(data.token, data.user); //save to context + localstorage
        }catch(err){
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }
    return(
        <div className='auth-page'>
            <div className='auth-card'>
                <div className='auth-logo'>SYNAPSE<span>.AI</span></div>
                <h1 className='auth-title'>Welcome Back</h1>
                <p className='auth-subtitle'>log in to continue building your knowledge Graphs</p>
                
                <form onSubmit={handleSubmit} className='auth-form'>
                    <div className='auth-field'>
                        <label>Email</label>
                        <input 
                            type = "email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder='you@example.com'
                            autoComplete='"email'
                        />
                    </div>

                    <div className='auth-field'>
                        <label>Password</label>
                        <input
                            type='password'
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder='Enter Password'
                            autoComplete='current-password'
                        />
                    </div>

                    {error && <div className='auth-error'>{error}</div>}

                    <button type='submit' className='auth-submit' disabled={loading}>
                        {loading ? 'logging in...':'Log In'}
                    </button>
                </form>

                <p className='auth-switch'>
                    Don't have an Account?{" "}
                    <button onClick={onSwitchToSignup} className='auth-link'>Sign Up</button>
                </p>
            </div>
        </div>
    );
}