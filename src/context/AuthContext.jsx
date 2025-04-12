import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase'; // Import auth from firebase.js
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state while checking auth

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    function googleSignIn() {
        const googleAuthProvider = new GoogleAuthProvider();
        return signInWithPopup(auth, googleAuthProvider);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false); // Auth state is loaded
        });
        return unsubscribe; // Unsubscribe on unmount
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        googleSignIn,
        loading, // Expose loading state
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children} {/* Render children only after auth state is loaded */}
        </AuthContext.Provider>
    );
}