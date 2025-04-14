import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const auth = getAuth();

    async function signup(email, password, name) {
        try {
            setError(null);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            
            // Create user profile in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                createdAt: new Date().toISOString(),
                role: 'participant',
                skills: [],
                experience: 'beginner',
                bio: '',
                githubUrl: '',
                linkedinUrl: '',
                portfolioUrl: ''
            });

            return userCredential;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }

    async function login(email, password) {
        try {
            setError(null);
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }

    async function googleSignIn() {
        try {
            setError(null);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            // Check if user profile exists in Firestore
            const userDoc = await getDoc(doc(db, 'users', result.user.uid));
            
            if (!userDoc.exists()) {
                // Create user profile if it doesn't exist
                await setDoc(doc(db, 'users', result.user.uid), {
                    name: result.user.displayName || 'User',
                    email: result.user.email,
                    createdAt: new Date().toISOString(),
                    role: 'participant',
                    skills: [],
                    experience: 'beginner',
                    bio: '',
                    githubUrl: '',
                    linkedinUrl: '',
                    portfolioUrl: ''
                });
            }
            
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }

    function logout() {
        return signOut(auth);
    }

    async function updateUserProfile(profileData) {
        try {
            setError(null);
            if (!currentUser) throw new Error('No user logged in');
            
            await setDoc(doc(db, 'users', currentUser.uid), {
                ...profileData,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // Update local user state
            setCurrentUser(prev => ({
                ...prev,
                ...profileData
            }));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get additional user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();
                
                setCurrentUser({
                    ...user,
                    ...userData
                });
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [auth]);

    const value = {
        currentUser,
        loading,
        error,
        signup,
        login,
        logout,
        googleSignIn,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 