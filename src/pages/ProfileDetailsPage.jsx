import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getProfilePicture, calculateGithubExperienceLevel } from '../utils/githubUtils';

function ProfileDetailsPage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [githubExperience, setGithubExperience] = useState(null);
    const { userId } = useParams();

    useEffect(() => {
        async function fetchProfile() {
            try {
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const profileData = docSnap.data();
                    setProfile(profileData);
                    
                    // Fetch profile picture
                    const picture = await getProfilePicture(profileData.github, profileData.linkedin);
                    setProfilePicture(picture);
                    
                    // Calculate GitHub experience level if GitHub URL is provided
                    if (profileData.github) {
                        const experience = await calculateGithubExperienceLevel(profileData.github);
                        setGithubExperience(experience);
                    }
                } else {
                    setError('Profile not found');
                }
            } catch (err) {
                setError('Error fetching profile: ' + err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    No profile data available
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header Section */}
                <div className="bg-blue-600 text-white p-6">
                    <div className="flex items-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden mr-6 border-4 border-white">
                            {profilePicture ? (
                                <img 
                                    src={profilePicture} 
                                    alt={`${profile.name}'s profile`} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-500 text-2xl">?</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{profile.name}</h1>
                            <p className="text-blue-100">{profile.role}</p>
                            {githubExperience && (
                                <span className={`inline-block px-3 py-1 text-sm rounded-full mt-2 ${
                                    githubExperience === 'Pro' ? 'bg-green-100 text-green-800' :
                                    githubExperience === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    GitHub Experience: {githubExperience}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Basic Information */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Email</p>
                                <p className="font-medium">{profile.email}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Experience Level</p>
                                <p className="font-medium">{profile.experience}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Location</p>
                                <p className="font-medium">{profile.location}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Timezone</p>
                                <p className="font-medium">{profile.timezone}</p>
                            </div>
                        </div>
                    </section>

                    {/* Technical Skills */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Technical Skills</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Tech Stack</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profile.techStack?.map((tech, index) => (
                                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Programming Languages</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profile.languages?.map((lang, index) => (
                                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Work Preferences */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Work Preferences</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Work Mode</p>
                                <p className="font-medium">{profile.mode}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Availability</p>
                                <p className="font-medium">{profile.availability}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Communication Style</p>
                                <p className="font-medium">{profile.communicationStyle}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-600">Preferred Team Size</p>
                                <p className="font-medium">{profile.teamSize}</p>
                            </div>
                        </div>
                    </section>

                    {/* Project Interests */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Project Interests</h2>
                        <div className="bg-gray-50 p-4 rounded">
                            <div className="flex flex-wrap gap-2">
                                {profile.projectInterests?.map((interest, index) => (
                                    <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Additional Information */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Additional Information</h2>
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="text-gray-600">Additional Preferences</p>
                            <p className="mt-2">{profile.preferences || 'No additional preferences specified'}</p>
                        </div>
                    </section>

                    {/* Links */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Links</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {profile.portfolio && (
                                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" 
                                   className="bg-gray-50 p-4 rounded hover:bg-gray-100 transition-colors">
                                    <p className="text-gray-600">Portfolio</p>
                                    <p className="font-medium text-blue-600">View Portfolio</p>
                                </a>
                            )}
                            {profile.github && (
                                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                                   className="bg-gray-50 p-4 rounded hover:bg-gray-100 transition-colors">
                                    <p className="text-gray-600">GitHub</p>
                                    <p className="font-medium text-blue-600">View GitHub</p>
                                </a>
                            )}
                            {profile.linkedin && (
                                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                                   className="bg-gray-50 p-4 rounded hover:bg-gray-100 transition-colors">
                                    <p className="text-gray-600">LinkedIn</p>
                                    <p className="font-medium text-blue-600">View LinkedIn</p>
                                </a>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ProfileDetailsPage; 