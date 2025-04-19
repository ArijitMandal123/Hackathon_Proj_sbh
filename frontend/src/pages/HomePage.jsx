import React, { useState, useEffect } from "react";
import ProfileCard from "../components/ProfileCard";
import { db } from "../firebase.js"; // Import db from firebase.js
import { collection, getDocs } from "firebase/firestore"; // Correct imports from firebase/firestore
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function HomePage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      setError(null);
      try {
        const profilesCollection = collection(db, "users"); // Get reference to 'users' collection
        const profilesSnapshot = await getDocs(profilesCollection); // Fetch all documents in the collection
        const profilesList = profilesSnapshot.docs.map((doc) => ({
          userId: doc.id,
          ...doc.data(),
        }));
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
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#261FB3]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0C0950]">
          Find Your Hackathon Teammates
        </h1>
        <Link
          to="/create-profile"
          className="bg-[#FBE4D6] text-[#0C0950] hover:bg-[#f5d5c3] font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
        >
          Create Profile
        </Link>
      </div>
      {profiles.length === 0 && !loading && !error ? (
        <div className="bg-[#FBE4D6] text-[#0C0950] p-6 rounded-lg shadow-md">
          <p className="text-lg">
            No profiles yet. Be the first to create one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard key={profile.userId} {...profile} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
