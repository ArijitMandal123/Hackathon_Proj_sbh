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

    // New state variables for additional fields
    const [role, setRole] = useState('');
    const [experience, setExperience] = useState('');
    const [availability, setAvailability] = useState('');
    const [projectInterests, setProjectInterests] = useState('');
    const [communicationStyle, setCommunicationStyle] = useState('');
    const [timezone, setTimezone] = useState('');
    const [languages, setLanguages] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const [projectDuration, setProjectDuration] = useState('');

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
            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, {
                name,
                email,
                techStack: techStack.split(',').map(item => item.trim()),
                preferences,
                mode,
                location,
                github: githubLink,
                linkedin: linkedinLink,
                role,
                experience,
                availability,
                projectInterests: projectInterests.split(',').map(item => item.trim()),
                communicationStyle,
                timezone,
                languages: languages.split(',').map(item => item.trim()),
                portfolio,
                teamSize,
                projectDuration,
                createdAt: new Date().toISOString()
            });

            setSuccessMessage("Profile created successfully!");
            // Reset form fields
            setName('');
            setEmail('');
            setTechStack('');
            setPreferences('');
            setMode('');
            setLocation('');
            setGithubLink('');
            setLinkedinLink('');
            setRole('');
            setExperience('');
            setAvailability('');
            setProjectInterests('');
            setCommunicationStyle('');
            setTimezone('');
            setLanguages('');
            setPortfolio('');
            setTeamSize('');
            setProjectDuration('');

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
                <label htmlFor="role" className="block text-gray-700 text-sm font-bold mb-2">Preferred Role:</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="">Select Role</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Mobile Developer">Mobile Developer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Project Manager">Project Manager</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="experience" className="block text-gray-700 text-sm font-bold mb-2">Experience Level:</label>
                <select id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="">Select Experience</option>
                    <option value="Beginner">Beginner (0-1 years)</option>
                    <option value="Intermediate">Intermediate (1-3 years)</option>
                    <option value="Advanced">Advanced (3-5 years)</option>
                    <option value="Expert">Expert (5+ years)</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="techStack" className="block text-gray-700 text-sm font-bold mb-2">Tech Stack (comma-separated):</label>
                <input type="text" id="techStack" value={techStack} onChange={(e) => setTechStack(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="e.g., JavaScript, React, Python" />
            </div>
            <div className="mb-4">
                <label htmlFor="languages" className="block text-gray-700 text-sm font-bold mb-2">Programming Languages (comma-separated):</label>
                <input type="text" id="languages" value={languages} onChange={(e) => setLanguages(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="e.g., JavaScript, Python, Java" />
            </div>
            <div className="mb-4">
                <label htmlFor="projectInterests" className="block text-gray-700 text-sm font-bold mb-2">Project Interests (comma-separated):</label>
                <input type="text" id="projectInterests" value={projectInterests} onChange={(e) => setProjectInterests(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="e.g., Web Development, AI, Mobile Apps" />
            </div>
            <div className="mb-4">
                <label htmlFor="availability" className="block text-gray-700 text-sm font-bold mb-2">Availability:</label>
                <select id="availability" value={availability} onChange={(e) => setAvailability(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="">Select Availability</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Weekends">Weekends</option>
                    <option value="Evenings">Evenings</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="timezone" className="block text-gray-700 text-sm font-bold mb-2">Timezone:</label>
                <input type="text" id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="e.g., UTC-5, IST" />
            </div>
            <div className="mb-4">
                <label htmlFor="mode" className="block text-gray-700 text-sm font-bold mb-2">Work Mode:</label>
                <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="">Select Mode</option>
                    <option value="In-person">In-person</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Location:</label>
                <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-4">
                <label htmlFor="communicationStyle" className="block text-gray-700 text-sm font-bold mb-2">Communication Style:</label>
                <select id="communicationStyle" value={communicationStyle} onChange={(e) => setCommunicationStyle(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="">Select Style</option>
                    <option value="Direct">Direct</option>
                    <option value="Collaborative">Collaborative</option>
                    <option value="Detailed">Detailed</option>
                    <option value="Flexible">Flexible</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="teamSize" className="block text-gray-700 text-sm font-bold mb-2">Preferred Team Size:</label>
                <select id="teamSize" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="">Select Size</option>
                    <option value="2-3">2-3 members</option>
                    <option value="4-6">4-6 members</option>
                    <option value="7-10">7-10 members</option>
                    <option value="10+">10+ members</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="projectDuration" className="block text-gray-700 text-sm font-bold mb-2">Preferred Project Duration:</label>
                <select id="projectDuration" value={projectDuration} onChange={(e) => setProjectDuration(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <option value="">Select Duration</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="2-4 weeks">2-4 weeks</option>
                    <option value="1-2 months">1-2 months</option>
                    <option value="2+ months">2+ months</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="preferences" className="block text-gray-700 text-sm font-bold mb-2">Additional Preferences:</label>
                <textarea id="preferences" value={preferences} onChange={(e) => setPreferences(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Any additional preferences or requirements..."></textarea>
            </div>
            <div className="mb-4">
                <label htmlFor="portfolio" className="block text-gray-700 text-sm font-bold mb-2">Portfolio URL (Optional):</label>
                <input type="url" id="portfolio" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
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