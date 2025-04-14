import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

function TeamForm({ hackathonId, onSuccess }) {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxMembers: 4,
        skills: [],
        projectIdea: '',
        experienceLevel: 'any',
        timeCommitment: 'any',
        locationPreference: 'any',
        communicationPreference: 'any'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        async function fetchUserProfile() {
            if (!currentUser) return;

            try {
                const profilesQuery = query(
                    collection(db, 'users'),
                    where('userId', '==', currentUser.uid)
                );
                const profileSnapshot = await getDocs(profilesQuery);
                
                if (!profileSnapshot.empty) {
                    const profileData = profileSnapshot.docs[0].data();
                    setUserProfile({
                        id: profileSnapshot.docs[0].id,
                        ...profileData
                    });
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('Failed to load user profile: ' + err.message);
            }
        }

        fetchUserProfile();
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill.trim()]
            }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Validate form data
            if (!formData.name.trim()) {
                throw new Error('Team name is required');
            }
            if (!formData.description.trim()) {
                throw new Error('Team description is required');
            }
            if (formData.maxMembers < 2 || formData.maxMembers > 10) {
                throw new Error('Team size must be between 2 and 10 members');
            }
            if (formData.skills.length === 0) {
                throw new Error('At least one skill is required');
            }

            if (!userProfile) {
                throw new Error('You need to create a profile before creating a team');
            }

            // Check if user already has a team in this hackathon
            const existingTeamQuery = query(
                collection(db, 'teams'),
                where('hackathonId', '==', hackathonId),
                where('members', 'array-contains', { userId: currentUser.uid })
            );
            const existingTeamSnapshot = await getDocs(existingTeamQuery);
            
            if (!existingTeamSnapshot.empty) {
                throw new Error('You are already a member of a team in this hackathon');
            }

            // Create team document
            const teamData = {
                ...formData,
                hackathonId,
                createdAt: new Date().toISOString(),
                members: [{
                    userId: currentUser.uid,
                    role: 'leader',
                    joinedAt: new Date().toISOString()
                }],
                status: 'active'
            };

            const teamRef = await addDoc(collection(db, 'teams'), teamData);

            // Update user profile with team information
            const userRef = doc(db, 'users', userProfile.id);
            await updateDoc(userRef, {
                teams: arrayUnion({
                    teamId: teamRef.id,
                    hackathonId,
                    role: 'leader'
                })
            });

            setSuccess(true);
            if (onSuccess) {
                onSuccess(teamRef.id);
            }
        } catch (err) {
            console.error('Error creating team:', err);
            setError(err.message || 'Failed to create team');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <p className="text-[#0C0950] text-center">Please log in to create a team.</p>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <p className="text-[#0C0950] text-center">Please create a profile before creating a team.</p>
                <div className="mt-4 text-center">
                    <Link 
                        to="/profile/create"
                        className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors inline-block"
                    >
                        Create Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleCreateTeam} className="space-y-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    Team created successfully!
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        placeholder="Enter team name"
                        required
                    />
                </div>

                {/* Team Size */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Size *
                    </label>
                    <input
                        type="number"
                        name="maxMembers"
                        value={formData.maxMembers}
                        onChange={handleChange}
                        min="2"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        required
                    />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        placeholder="Describe your team's goals and project idea"
                        required
                    />
                </div>

                {/* Skills */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Skills *
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                            placeholder="Add a skill"
                        />
                        <button
                            type="button"
                            onClick={handleAddSkill}
                            className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                            <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                            >
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Experience Level */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experience Level
                    </label>
                    <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    >
                        <option value="any">Any Level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>

                {/* Time Commitment */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Commitment
                    </label>
                    <select
                        name="timeCommitment"
                        value={formData.timeCommitment}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    >
                        <option value="any">Any</option>
                        <option value="part-time">Part Time</option>
                        <option value="full-time">Full Time</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#261FB3] text-white px-6 py-2 rounded hover:bg-[#161179] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating...' : 'Create Team'}
                </button>
            </div>
        </form>
    );
}

export default TeamForm; 