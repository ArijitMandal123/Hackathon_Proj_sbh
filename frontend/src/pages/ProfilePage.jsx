import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getProfilePicture, calculateGithubExperienceLevel } from '../utils/githubUtils';
import { useAuth } from '../contexts/AuthContext';
import ReviewProfile from './ReviewProfile';

function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [githubExperience, setGithubExperience] = useState(null);
    const [showReview, setShowReview] = useState(false);
    const { userId } = useParams();
    const { currentUser } = useAuth();

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#261FB3]"></div>
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

    // Extract GitHub username from GitHub URL
    const githubUsername = profile.github ? profile.github.split('/').pop() : null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    {/* Header Section */}
                    <div className="bg-[#261FB3] text-white p-6">
                        <div className="flex items-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden mr-6 border-4 border-[#FBE4D6]">
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
                                <p className="text-[#FBE4D6]">{profile.role}</p>
                                {githubExperience && (
                                    <span className={`inline-block px-3 py-1 text-sm rounded-full mt-2 ${
                                        githubExperience === 'Pro' ? 'bg-[#FBE4D6] text-[#0C0950]' :
                                        githubExperience === 'Intermediate' ? 'bg-[#161179] text-white' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        GitHub Experience: {githubExperience}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#261FB3]">{profile.points || 0}</p>
                            <p className="text-sm text-gray-600">Points</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#261FB3]">{profile.totalProjects || 0}</p>
                            <p className="text-sm text-gray-600">Projects</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#261FB3]">{profile.contributions || 0}</p>
                            <p className="text-sm text-gray-600">Contributions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#261FB3]">
                                {new Date(profile.createdAt || new Date()).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">Member Since</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 border-t border-gray-200">
                        <button
                            onClick={() => setShowReview(!showReview)}
                            className="bg-[#261FB3] text-white px-6 py-2 rounded-lg hover:bg-[#161179] transition-colors"
                        >
                            {showReview ? 'Hide Review' : 'Review Profile'}
                        </button>
                    </div>
                </div>

                {/* GitHub Profile Review Section */}
                {showReview && githubUsername && (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-[#0C0950]">GitHub Profile Analysis</h2>
                            <ReviewProfile 
                                username={githubUsername}
                                userId={userId}
                                onPointsUpdate={(points) => {
                                    setProfile(prev => ({ ...prev, points }));
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-[#0C0950]">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Email</p>
                                <p className="font-medium text-[#161179]">{profile.email}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Experience Level</p>
                                <p className="font-medium text-[#161179]">{profile.experience}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Location</p>
                                <p className="font-medium text-[#161179]">{profile.location}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Timezone</p>
                                <p className="font-medium text-[#161179]">{profile.timezone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Skills */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-[#0C0950]">Technical Skills</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Tech Stack</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profile.techStack?.map((tech, index) => (
                                        <span key={index} className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Programming Languages</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profile.languages?.map((lang, index) => (
                                        <span key={index} className="bg-[#261FB3] text-white px-3 py-1 rounded-full text-sm">
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Work Preferences */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-[#0C0950]">Work Preferences</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Work Mode</p>
                                <p className="font-medium text-[#161179]">{profile.mode}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Availability</p>
                                <p className="font-medium text-[#161179]">{profile.availability}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Communication Style</p>
                                <p className="font-medium text-[#161179]">{profile.communicationStyle}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                <p className="text-gray-600">Preferred Team Size</p>
                                <p className="font-medium text-[#161179]">{profile.teamSize}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Interests */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-[#0C0950]">Project Interests</h2>
                        <div className="bg-gray-50 p-4 rounded border border-gray-100">
                            <div className="flex flex-wrap gap-2">
                                {profile.projectInterests?.map((interest, index) => (
                                    <span key={index} className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Links */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-[#0C0950]">Links</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {profile.portfolio && (
                                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" 
                                   className="bg-gray-50 p-4 rounded hover:bg-gray-100 transition-colors border border-gray-100">
                                    <p className="text-gray-600">Portfolio</p>
                                    <p className="font-medium text-[#261FB3]">View Portfolio</p>
                                </a>
                            )}
                            {profile.github && (
                                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                                   className="bg-gray-50 p-4 rounded hover:bg-gray-100 transition-colors border border-gray-100">
                                    <p className="text-gray-600">GitHub</p>
                                    <p className="font-medium text-[#261FB3]">View GitHub</p>
                                </a>
                            )}
                            {profile.linkedin && (
                                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                                   className="bg-gray-50 p-4 rounded hover:bg-gray-100 transition-colors border border-gray-100">
                                    <p className="text-gray-600">LinkedIn</p>
                                    <p className="font-medium text-[#261FB3]">View LinkedIn</p>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage; 