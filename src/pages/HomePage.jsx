import React, { useState, useEffect } from 'react';
import ProfileCard from '../components/ProfileCard';
import { db } from '../firebase.js'; // Import db from firebase.js
import { collection, getDocs } from 'firebase/firestore'; // Correct imports from firebase/firestore

function HomePage() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProfiles() {
            setLoading(true);
            setError(null);
            try {
                const profilesCollection = collection(db, 'users'); // Get reference to 'users' collection
                const profilesSnapshot = await getDocs(profilesCollection); // Fetch all documents in the collection
                const profilesList = profilesSnapshot.docs.map(doc => doc.data()); // Extract data from documents
                setProfiles(profilesList);
            } catch (firebaseError) {
                setError("Failed to fetch profiles: " + firebaseError.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProfiles();
    }, []); // Run this effect only once on component mount

    if (loading) {
        return <div className="container mx-auto px-4 py-8">Loading profiles...</div>;
    }

    if (error) {
        return <div className="container mx-auto px-4 py-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Find Your Hackathon Teammates</h1>
            {profiles.length === 0 && !loading && !error ? (
                <p>No profiles yet. Be the first to create one!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((profile, index) => (
                        <ProfileCard key={index} {...profile} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default HomePage;