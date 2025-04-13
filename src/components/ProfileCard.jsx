import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfilePicture, calculateGithubExperienceLevel } from '../utils/githubUtils';

function ProfileCard({ userId, name, techStack = [], preferences, mode, location, github, linkedin }) {
    const navigate = useNavigate();
    const [profilePicture, setProfilePicture] = useState(null);
    const [githubExperience, setGithubExperience] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfileData() {
            setLoading(true);
            try {
                // Fetch profile picture
                const picture = await getProfilePicture(github, linkedin);
                setProfilePicture(picture);
                
                // Calculate GitHub experience level if GitHub URL is provided
                if (github) {
                    const experience = await calculateGithubExperienceLevel(github);
                    setGithubExperience(experience);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchProfileData();
    }, [github, linkedin]);

    const handleCardClick = () => {
        navigate(`/profile/${userId}`);
    };

    return (
        <div 
            className="bg-white shadow-md rounded-lg p-4 mb-4 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100"
            onClick={handleCardClick}
        >
            <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 flex-shrink-0 border-2 border-[#FBE4D6]">
                    {loading ? (
                        <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                    ) : (
                        <img 
                            src={profilePicture} 
                            alt={`${name}'s profile`} 
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-[#0C0950]">{name}</h3>
                    {githubExperience && (
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            githubExperience === 'Pro' ? 'bg-[#FBE4D6] text-[#0C0950]' :
                            githubExperience === 'Intermediate' ? 'bg-[#261FB3] text-white' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {githubExperience}
                        </span>
                    )}
                </div>
            </div>
            
            <p className="text-gray-600 mb-1"><strong className="text-[#161179]">Tech Stack:</strong> {Array.isArray(techStack) ? techStack.join(', ') : 'Not specified'}</p>
            <p className="text-gray-600 mb-1"><strong className="text-[#161179]">Preferences:</strong> {preferences || 'Not specified'}</p>
            <p className="text-gray-600 mb-1"><strong className="text-[#161179]">Mode:</strong> {mode || 'Not specified'}</p>
            <p className="text-gray-600 mb-1"><strong className="text-[#161179]">Location:</strong> {location || 'Not specified'}</p>
            <div className="flex mt-2 space-x-2">
                {github && (
                    <a 
                        href={github} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#261FB3] hover:text-[#0C0950] hover:underline transition-colors duration-300"
                        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking links
                    >
                        GitHub
                    </a>
                )}
                {linkedin && (
                    <a 
                        href={linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#261FB3] hover:text-[#0C0950] hover:underline transition-colors duration-300"
                        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking links
                    >
                        LinkedIn
                    </a>
                )}
            </div>
        </div>
    );
}

export default ProfileCard;