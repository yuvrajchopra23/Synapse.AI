import React, {createContext, useContext, useState, useEffect} from 'react';

//create context - like a global box from where components can read from..
const AuthContext = createContext(null);

//custom hook so components can easily acces auth state
//const{user,login,logout} = useAuth();
export function useAuth(){
    return useContext(AuthContext);
}

export function AuthProvider({ children }){
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    //on app start check if there's a saved login in localstorage
    useEffect(()=>{
        const savedToken = localStorage.getItem('synapse_token');
        const savedUser = localStorage.getItem('synapse_user');

        if (savedToken && savedUser){
            try{
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            }catch{
                localStorage.removeItem('synapse_token');
                localStorage.removeItem('synapse_user');
            }
        }
        setLoading(false);
    },[]);

    //next will be called after successful login/signup

    function loginUser(newToken, newUser){
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('synapse_token', newToken);
        localStorage.setItem('synapse_user', JSON.stringify(newUser));
    }

    //to logout
    function logoutUser(){
        setToken(null);
        setUser(null);
        localStorage.removeItem('synapse_token');
        localStorage.removeItem('synapse_user');
    }

    const value = {
        user,
        token,
        loading,
        isLoggedIn: !!user, //true if user object exists
        loginUser,
        logoutUser,
    };

    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}