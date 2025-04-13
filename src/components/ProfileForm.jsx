import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase'; // Import db from firebase.js
import { doc, setDoc } from 'firebase/firestore'; // Correct imports from firebase/firestore

function ProfileForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [techStack, setTechStack] = useState('');
    const [preferences, setPreferences] = useState('');
    const [mode, setMode] = useState('');
    const [location, setLocation] = useState('');
    const [githubLink, setGithubLink] = useState('');
    const [linkedinLink, setLinkedinLink] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { userId } = useAuth(); // Get userId from AuthContext

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        if (!userId) {
            setError("User not logged in.");
            setLoading(false);
            return;
        }

        try {
            const userDocRef = doc(db, 'users', userId); // Document reference
            await setDoc(userDocRef, { // Use setDoc to create/update document
                name,
                email,
                techStack: techStack.split(',').map(item => item.trim()),
                preferences,
                mode,
                location,
                github: githubLink,
                linkedin: linkedinLink,
            });

            setSuccessMessage("Profile created successfully!");
            // Reset form fields (optional)
            setName('');setEmail('');setTechStack('');setPreferences('');setMode('');setLocation('');setGithubLink('');setLinkedinLink('');

        } catch (firebaseError) {
            setError("Failed to create profile: " + firebaseError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="max-w-lg mx-auto bg-white p-6 rounded-md shadow-md" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-semibold mb-4">Create Your Profile</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

            <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
                <label htmlFor="techStack" className="block text-gray-700 text-sm font-bold mb-2">Tech Stack (comma-separated):</label>
                <input type="text" id="techStack" value={techStack} onChange={(e) => setTechStack(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="e.g., JavaScript, React, Python" />
            </div>
            <div className="mb-4">
                <label htmlFor="preferences" className="block text-gray-700 text-sm font-bold mb-2">Preferences:</label>
                <textarea id="preferences" value={preferences} onChange={(e) => setPreferences(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
            </div>
            <div className="mb-4">
                <label htmlFor="mode" className="block text-gray-700 text-sm font-bold mb-2">Mode:</label>
                <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="">Select Mode</option>
                    <option value="In-person">In-person</option>
                    <option value="Remote">Remote</option>
                    <option value="Flexible">Flexible</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Location:</label>
                <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-4">
                <label htmlFor="githubLink" className="block text-gray-700 text-sm font-bold mb-2">GitHub Link (Optional):</label>
                <input type="url" id="githubLink" value={githubLink} onChange={(e) => setGithubLink(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-6">
                <label htmlFor="linkedinLink" className="block text-gray-700 text-sm font-bold mb-2">LinkedIn Link (Optional):</label>
                <input type="url" id="linkedinLink" value={linkedinLink} onChange={(e) => setLinkedinLink(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>

            <div className="flex items-center justify-center">
                <button disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                    {loading ? 'Creating Profile...' : 'Create Profile'}
                </button>
            </div>
        </form>
    );
}

export default ProfileForm;