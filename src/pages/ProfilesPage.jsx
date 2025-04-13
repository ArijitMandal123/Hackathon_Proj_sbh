import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePicture } from '../utils/githubUtils';

function ProfilesPage() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSkills, setFilterSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterExperience, setFilterExperience] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterMode, setFilterMode] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const { currentUser } = useAuth();

    useEffect(() => {
        async function fetchProfiles() {
            try {
                setLoading(true);
                const profilesQuery = query(
                    collection(db, 'users'),
                    orderBy('name')
                );
                const profilesSnapshot = await getDocs(profilesQuery);
                
                const profilesData = await Promise.all(profilesSnapshot.docs.map(async doc => {
                    const data = doc.data();
                    // Fetch profile picture for each user
                    let profilePicture = null;
                    if (data.github || data.linkedin) {
                        try {
                            profilePicture = await getProfilePicture(data.github, data.linkedin);
                        } catch (err) {
                            console.error('Error fetching profile picture:', err);
                        }
                    }
                    
                    return {
                        id: doc.id,
                        userId: doc.id,
                        profilePicture,
                        ...data
                    };
                }));
                
                setProfiles(profilesData);
            } catch (err) {
                console.error('Error fetching profiles:', err);
                setError('Failed to load profiles: ' + err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProfiles();
    }, []);

    const handleAddSkill = () => {
        if (newSkill.trim() && !filterSkills.includes(newSkill.trim())) {
            setFilterSkills([...filterSkills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFilterSkills(filterSkills.filter(skill => skill !== skillToRemove));
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const filteredAndSortedProfiles = profiles
        .filter(profile => {
            // Filter by search term
            const matchesSearch = 
                profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                profile.role?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filter by skills if any skills are selected
            const matchesSkills = filterSkills.length === 0 || 
                                filterSkills.every(skill => 
                                    profile.techStack?.some(tech => 
                                        tech.toLowerCase().includes(skill.toLowerCase())
                                    ) || 
                                    profile.languages?.some(lang => 
                                        lang.toLowerCase().includes(skill.toLowerCase())
                                    )
                                );
            
            // Filter by role
            const matchesRole = !filterRole || profile.role === filterRole;
            
            // Filter by experience
            const matchesExperience = !filterExperience || profile.experience === filterExperience;
            
            // Filter by location
            const matchesLocation = !filterLocation || 
                                  profile.location?.toLowerCase().includes(filterLocation.toLowerCase());
            
            // Filter by work mode
            const matchesMode = !filterMode || profile.mode === filterMode;
            
            return matchesSearch && matchesSkills && matchesRole && 
                   matchesExperience && matchesLocation && matchesMode;
        })
        .sort((a, b) => {
            let valueA = a[sortBy] || '';
            let valueB = b[sortBy] || '';
            
            // Handle array fields
            if (Array.isArray(valueA) && Array.isArray(valueB)) {
                valueA = valueA.length;
                valueB = valueB.length;
            }
            
            // Handle string comparison
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortOrder === 'asc' 
                    ? valueA.localeCompare(valueB) 
                    : valueB.localeCompare(valueA);
            }
            
            // Handle numeric comparison
            return sortOrder === 'asc' 
                ? valueA - valueB 
                : valueB - valueA;
        });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#261FB3]"></div>
                    </div>
                    <p className="text-center text-[#0C0950] mt-4">Loading profiles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    // Get unique roles, experiences, and modes for filter dropdowns
    const uniqueRoles = [...new Set(profiles.map(profile => profile.role).filter(Boolean))];
    const uniqueExperiences = [...new Set(profiles.map(profile => profile.experience).filter(Boolean))];
    const uniqueModes = [...new Set(profiles.map(profile => profile.mode).filter(Boolean))];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-[#0C0950] mb-8">Developer Profiles</h1>
                
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 mb-8">
                    <div className="mb-6">
                        <label className="block text-[#161179] font-medium mb-2">Search Profiles</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, bio, or role"
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-[#161179] font-medium mb-2">Filter by Role</label>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                            >
                                <option value="">All Roles</option>
                                {uniqueRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-[#161179] font-medium mb-2">Filter by Experience</label>
                            <select
                                value={filterExperience}
                                onChange={(e) => setFilterExperience(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                            >
                                <option value="">All Experience Levels</option>
                                {uniqueExperiences.map(exp => (
                                    <option key={exp} value={exp}>{exp}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-[#161179] font-medium mb-2">Filter by Location</label>
                            <input
                                type="text"
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                placeholder="Enter location"
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[#161179] font-medium mb-2">Filter by Work Mode</label>
                            <select
                                value={filterMode}
                                onChange={(e) => setFilterMode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                            >
                                <option value="">All Work Modes</option>
                                {uniqueModes.map(mode => (
                                    <option key={mode} value={mode}>{mode}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-[#161179] font-medium mb-2">Filter by Skills</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Add a skill to filter"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                            />
                            <button
                                onClick={handleAddSkill}
                                className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filterSkills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                >
                                    {skill}
                                    <button
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="text-[#0C0950] hover:text-red-600"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center">
                            <label className="text-[#161179] font-medium mr-2">Sort by:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => handleSort(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                            >
                                <option value="name">Name</option>
                                <option value="role">Role</option>
                                <option value="experience">Experience</option>
                                <option value="location">Location</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="ml-2 text-[#261FB3] hover:text-[#161179]"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                        <div className="text-[#161179]">
                            {filteredAndSortedProfiles.length} profiles found
                        </div>
                    </div>
                </div>
                
                {filteredAndSortedProfiles.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                        <p className="text-[#0C0950]">No profiles found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedProfiles.map(profile => (
                            <div 
                                key={profile.id} 
                                className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center mb-4">
                                    {profile.profilePicture ? (
                                        <img 
                                            src={profile.profilePicture} 
                                            alt={profile.name} 
                                            className="w-16 h-16 rounded-full object-cover mr-4"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-[#FBE4D6] flex items-center justify-center text-[#0C0950] font-bold text-xl mr-4">
                                            {profile.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-xl font-semibold text-[#0C0950]">{profile.name}</h2>
                                        <p className="text-gray-600">{profile.role || 'Developer'}</p>
                                        {profile.experience && (
                                            <span className="inline-block bg-[#FBE4D6] text-[#0C0950] px-2 py-1 rounded-full text-xs mt-1">
                                                {profile.experience}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <div className="flex items-center text-gray-600 mb-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{profile.location || 'Location not specified'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        <span>{profile.timezone || 'Timezone not specified'}</span>
                                    </div>
                                </div>
                                
                                <p className="text-gray-600 mb-4 line-clamp-3">{profile.preferences || 'No bio provided'}</p>
                                
                                {profile.techStack && profile.techStack.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-[#161179] mb-2">Tech Stack</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.techStack.slice(0, 5).map((tech, index) => (
                                                <span 
                                                    key={index}
                                                    className="bg-[#FBE4D6] text-[#0C0950] px-2 py-1 rounded text-sm"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                            {profile.techStack.length > 5 && (
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                                                    +{profile.techStack.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {profile.languages && profile.languages.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-[#161179] mb-2">Languages</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.languages.slice(0, 5).map((lang, index) => (
                                                <span 
                                                    key={index}
                                                    className="bg-[#261FB3] text-white px-2 py-1 rounded text-sm"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                            {profile.languages.length > 5 && (
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                                                    +{profile.languages.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{profile.availability || 'Availability not specified'}</span>
                                    </div>
                                    <Link 
                                        to={`/profile/${profile.userId}`}
                                        className="inline-block bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                                    >
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfilesPage; 