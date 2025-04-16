import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { cleanupDeletedUserData } from "../utils/userCleanup";

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: name });

      // Create user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date().toISOString(),
        role: "participant",
        skills: [],
        experience: "beginner",
        bio: "",
        githubUrl: "",
        linkedinUrl: "",
        portfolioUrl: "",
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
      // Make sign-in process more robust by setting custom parameters
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, "users", result.user.uid));

      if (!userDoc.exists()) {
        // Create user profile if it doesn't exist
        await setDoc(doc(db, "users", result.user.uid), {
          name: result.user.displayName || "User",
          email: result.user.email,
          createdAt: new Date().toISOString(),
          role: "participant",
          skills: [],
          experience: "beginner",
          bio: "",
          githubUrl: "",
          linkedinUrl: "",
          portfolioUrl: "",
        });
      }

      return result;
    } catch (err) {
      // Properly format the error to include the code
      setError({
        message: err.message,
        code: err.code,
      });
      throw err;
    }
  }

  function logout() {
    return signOut(auth);
  }

  async function updateUserProfile(profileData) {
    try {
      setError(null);
      if (!currentUser) throw new Error("No user logged in");

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          ...profileData,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update local user state
      setCurrentUser((prev) => ({
        ...prev,
        ...profileData,
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  /**
   * Delete user account and clean up all associated data
   * @param {string} password - Current password for reauthentication (required for security)
   */
  async function deleteAccount(password) {
    try {
      setError(null);
      if (!currentUser) throw new Error("No user logged in");

      // Store the userId for cleanup after account deletion
      const userId = currentUser.uid;

      // Re-authenticate the user before deleting (required by Firebase)
      if (password) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          password
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Delete the user's profile from Firestore
      const userDocRef = doc(db, "users", userId);
      await deleteDoc(userDocRef);

      // Clean up user data in teams
      await cleanupDeletedUserData(userId);

      // Delete the user's authentication account
      await deleteUser(currentUser);

      // The onAuthStateChanged listener will handle setting currentUser to null
      return true;
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(err.message);
      throw err;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        setCurrentUser({
          ...user,
          ...userData,
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
    updateUserProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
