import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

function TeamList({ hackathonId }) {
    const { currentUser } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userTeams, setUserTeams] = useState([]);

    useEffect(() => {
        async function fetchTeams() {
            try {
                // Fetch teams for this hackathon
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('hackathonId', '==', hackathonId)
                );
                const teamsSnapshot = await getDocs(teamsQuery);
                
                const teamsData = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTeams(teamsData);

                // If user is logged in, fetch their teams
                if (currentUser) {
                    const userTeamsQuery = query(
                        collection(db, 'users'),
                        where('userId', '==', currentUser.uid)
                    );
                    const userProfileSnapshot = await getDocs(userTeamsQuery);
                    
                    if (!userProfileSnapshot.empty) {
                        const userProfile = userProfileSnapshot.docs[0].data();
                        const userTeamsData = userProfile.teams || [];
                        setUserTeams(userTeamsData);
                    }
                }
            } catch (err) {
                console.error('Error fetching teams:', err);
                setError('Failed to load teams: ' + err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchTeams();
    }, [hackathonId, currentUser]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <p className="text-[#0C0950]">Loading teams...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    if (teams.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <p className="text-[#0C0950]">No teams have been created for this hackathon yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-[#0C0950]">Teams</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => {
                    const isUserInTeam = userTeams.some(userTeam => 
                        userTeam.teamId === team.id
                    );
                    const userRole = isUserInTeam ? 
                        userTeams.find(userTeam => userTeam.teamId === team.id).role : 
                        null;

                    return (
                        <div 
                            key={team.id} 
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <h3 className="text-xl font-semibold mb-2 text-[#0C0950]">{team.name}</h3>
                            
                            <p className="text-gray-600 mb-4">{team.description}</p>
                            
                            <div className="mb-4">
                                <h4 className="font-semibold text-[#161179] mb-2">Team Leader</h4>
                                <Link 
                                    to={`/profile/${team.leaderProfileId}`}
                                    className="text-[#261FB3] hover:text-[#161179]"
                                >
                                    {team.leaderName}
                                </Link>
                            </div>
                            
                            <div className="mb-4">
                                <h4 className="font-semibold text-[#161179] mb-2">Members ({team.members.length}/{team.maxMembers})</h4>
                                <ul className="space-y-1">
                                    {team.members.map(member => (
                                        <li key={member.userId}>
                                            <Link 
                                                to={`/profile/${member.profileId}`}
                                                className="text-[#261FB3] hover:text-[#161179]"
                                            >
                                                {member.name} {member.role === 'leader' && '(Leader)'}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-semibold text-[#161179] mb-2">Requirements</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Experience:</span>
                                        <span className="bg-[#FBE4D6] text-[#0C0950] px-2 py-1 rounded text-sm">
                                            {team.experienceLevel}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Time Commitment:</span>
                                        <span className="bg-[#FBE4D6] text-[#0C0950] px-2 py-1 rounded text-sm">
                                            {team.timeCommitment}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Location:</span>
                                        <span className="bg-[#FBE4D6] text-[#0C0950] px-2 py-1 rounded text-sm">
                                            {team.locationPreference}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {team.skills && team.skills.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-[#161179] mb-2">Required Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {team.skills.map((skill, index) => (
                                            <span 
                                                key={index}
                                                className="bg-[#FBE4D6] text-[#0C0950] px-2 py-1 rounded text-sm"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {team.preferredTechnologies && team.preferredTechnologies.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-[#161179] mb-2">Preferred Technologies</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {team.preferredTechnologies.map((tech, index) => (
                                            <span 
                                                key={index}
                                                className="bg-[#FBE4D6] text-[#0C0950] px-2 py-1 rounded text-sm"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {team.preferredRoles && team.preferredRoles.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-[#161179] mb-2">Preferred Roles</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {team.preferredRoles.map((role, index) => (
                                            <span 
                                                key={index}
                                                className="bg-[#FBE4D6] text-[#0C0950] px-2 py-1 rounded text-sm"
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {team.projectIdea && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-[#161179] mb-2">Project Idea</h4>
                                    <p className="text-gray-600">{team.projectIdea}</p>
                                </div>
                            )}

                            <div className="mb-4">
                                <h4 className="font-semibold text-[#161179] mb-2">Additional Requirements</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    {team.githubRequired && (
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            GitHub Profile Required
                                        </li>
                                    )}
                                    {team.portfolioRequired && (
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Portfolio Required
                                        </li>
                                    )}
                                    {team.interviewRequired && (
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Interview Required
                                        </li>
                                    )}
                                </ul>
                            </div>
                            
                            {isUserInTeam ? (
                                <div className="mt-4">
                                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                        You are a {userRole} in this team
                                    </span>
                                </div>
                            ) : team.members.length < team.maxMembers && (
                                <div className="mt-4">
                                    <Link 
                                        to={`/hackathon/${hackathonId}/teams`}
                                        className="inline-block bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                                    >
                                        Join Team
                                    </Link>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TeamList; 