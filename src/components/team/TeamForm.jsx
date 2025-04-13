import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

function TeamForm({ hackathonId, onSuccess }) {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxMembers: 4,
        skills: [],
        projectIdea: '',
        experienceLevel: 'any',
        preferredTechnologies: [],
        timeCommitment: 'any',
        preferredRoles: [],
        locationPreference: 'any',
        communicationPreference: 'any',
        githubRequired: false,
        portfolioRequired: false,
        interviewRequired: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [existingTeams, setExistingTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [newSkill, setNewSkill] = useState('');
    const [newTechnology, setNewTechnology] = useState('');
    const [newRole, setNewRole] = useState('');

    // Fetch user profile and existing teams
    useEffect(() => {
        async function fetchData() {
            if (!currentUser) return;

            try {
                // Fetch user profile
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

                // Fetch existing teams for this hackathon
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('hackathonId', '==', hackathonId)
                );
                const teamsSnapshot = await getDocs(teamsQuery);
                
                const teams = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setExistingTeams(teams);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data: ' + err.message);
            }
        }

        fetchData();
    }, [currentUser, hackathonId]);

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

    const handleAddTechnology = () => {
        if (newTechnology.trim() && !formData.preferredTechnologies.includes(newTechnology.trim())) {
            setFormData(prev => ({
                ...prev,
                preferredTechnologies: [...prev.preferredTechnologies, newTechnology.trim()]
            }));
            setNewTechnology('');
        }
    };

    const handleRemoveTechnology = (techToRemove) => {
        setFormData(prev => ({
            ...prev,
            preferredTechnologies: prev.preferredTechnologies.filter(tech => tech !== techToRemove)
        }));
    };

    const handleAddRole = () => {
        if (newRole.trim() && !formData.preferredRoles.includes(newRole.trim())) {
            setFormData(prev => ({
                ...prev,
                preferredRoles: [...prev.preferredRoles, newRole.trim()]
            }));
            setNewRole('');
        }
    };

    const handleRemoveRole = (roleToRemove) => {
        setFormData(prev => ({
            ...prev,
            preferredRoles: prev.preferredRoles.filter(role => role !== roleToRemove)
        }));
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!currentUser || !userProfile) {
            setError('You must be logged in and have a profile to create a team');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const teamData = {
                ...formData,
                hackathonId,
                leaderId: currentUser.uid,
                leaderName: userProfile.name,
                leaderProfileId: userProfile.id,
                members: [{
                    userId: currentUser.uid,
                    name: userProfile.name,
                    profileId: userProfile.id,
                    role: 'leader'
                }],
                createdAt: new Date(),
                status: 'active'
            };

            const teamRef = await addDoc(collection(db, 'teams'), teamData);

            // Update user's profile with team membership
            const userProfileRef = doc(db, 'users', userProfile.id);
            await updateDoc(userProfileRef, {
                teams: [...(userProfile.teams || []), {
                    teamId: teamRef.id,
                    hackathonId,
                    role: 'leader'
                }]
            });

            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error creating team:', err);
            setError('Failed to create team: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            if (!userProfile) {
                throw new Error('You need to create a profile first');
            }

            if (!selectedTeam) {
                throw new Error('Please select a team to join');
            }

            const team = existingTeams.find(t => t.id === selectedTeam);
            
            if (team.members.length >= team.maxMembers) {
                throw new Error('This team is already full');
            }

            if (team.members.some(member => member.userId === currentUser.uid)) {
                throw new Error('You are already a member of this team');
            }

            // Add user to team members
            await updateDoc(doc(db, 'teams', selectedTeam), {
                members: arrayUnion({
                    userId: currentUser.uid,
                    name: userProfile.name || 'Unknown',
                    profileId: userProfile.id,
                    role: 'member'
                })
            });

            // Update user profile with team reference
            await updateDoc(doc(db, 'users', userProfile.id), {
                teams: arrayUnion({
                    teamId: selectedTeam,
                    hackathonId: hackathonId,
                    role: 'member'
                })
            });

            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error joining team:', err);
            setError(err.message || 'Failed to join team');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <p className="text-[#0C0950]">Please log in to create or join a team.</p>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <p className="text-[#0C0950]">Please create a profile before creating or joining a team.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-[#0C0950]">Create New Team</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Team created successfully!
                </div>
            )}
            
            <form onSubmit={handleCreateTeam} className="space-y-6">
                <div>
                    <label className="block text-[#161179] font-medium mb-2">Team Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Maximum Team Size</label>
                    <input
                        type="number"
                        name="maxMembers"
                        value={formData.maxMembers}
                        onChange={handleChange}
                        min="2"
                        max="10"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Experience Level Required</label>
                    <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    >
                        <option value="any">Any Level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Time Commitment</label>
                    <select
                        name="timeCommitment"
                        value={formData.timeCommitment}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    >
                        <option value="any">Any</option>
                        <option value="part-time">Part-time</option>
                        <option value="full-time">Full-time</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Location Preference</label>
                    <select
                        name="locationPreference"
                        value={formData.locationPreference}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    >
                        <option value="any">Any</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">Onsite</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Communication Platform</label>
                    <select
                        name="communicationPreference"
                        value={formData.communicationPreference}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    >
                        <option value="any">Any</option>
                        <option value="discord">Discord</option>
                        <option value="slack">Slack</option>
                        <option value="teams">Microsoft Teams</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Required Skills</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Add a skill"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
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
                                className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            >
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="text-[#0C0950] hover:text-red-600"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Preferred Technologies</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newTechnology}
                            onChange={(e) => setNewTechnology(e.target.value)}
                            placeholder="Add a technology"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={handleAddTechnology}
                            className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.preferredTechnologies.map((tech, index) => (
                            <span
                                key={index}
                                className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            >
                                {tech}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTechnology(tech)}
                                    className="text-[#0C0950] hover:text-red-600"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Preferred Roles</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            placeholder="Add a role"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={handleAddRole}
                            className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.preferredRoles.map((role, index) => (
                            <span
                                key={index}
                                className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            >
                                {role}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRole(role)}
                                    className="text-[#0C0950] hover:text-red-600"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[#161179] font-medium mb-2">Project Idea</label>
                    <textarea
                        name="projectIdea"
                        value={formData.projectIdea}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="githubRequired"
                            checked={formData.githubRequired}
                            onChange={handleChange}
                            className="h-4 w-4 text-[#261FB3] focus:ring-[#261FB3] border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-[#161179]">
                            GitHub Profile Required
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="portfolioRequired"
                            checked={formData.portfolioRequired}
                            onChange={handleChange}
                            className="h-4 w-4 text-[#261FB3] focus:ring-[#261FB3] border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-[#161179]">
                            Portfolio Required
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="interviewRequired"
                            checked={formData.interviewRequired}
                            onChange={handleChange}
                            className="h-4 w-4 text-[#261FB3] focus:ring-[#261FB3] border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-[#161179]">
                            Interview Required
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#261FB3] text-white py-2 px-4 rounded hover:bg-[#161179] transition-colors disabled:opacity-50"
                >
                    {loading ? 'Creating Team...' : 'Create Team'}
                </button>
            </form>
        </div>
    );
}

export default TeamForm; 