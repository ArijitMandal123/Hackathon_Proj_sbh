import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

function TeamList({ hackathonId, onTeamJoined }) {
    const { currentUser } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userTeams, setUserTeams] = useState([]);
    const [joiningTeam, setJoiningTeam] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, [hackathonId, currentUser]);

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
                    collection(db, 'teams'),
                    where('hackathonId', '==', hackathonId),
                    where('members', 'array-contains', { userId: currentUser.uid })
                );
                const userTeamsSnapshot = await getDocs(userTeamsQuery);
                
                const userTeamsData = userTeamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUserTeams(userTeamsData);
            }
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to load teams: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleJoinTeam = async (teamId) => {
        if (!currentUser) {
            setError('Please log in to join a team');
            return;
        }

        setJoiningTeam(true);
        setError('');

        try {
            const teamRef = doc(db, 'teams', teamId);
            const team = teams.find(t => t.id === teamId);

            if (!team) {
                throw new Error('Team not found');
            }

            if (team.members?.length >= team.maxMembers) {
                throw new Error('Team is full');
            }

            // Add user to team members
            await updateDoc(teamRef, {
                members: arrayUnion({
                    userId: currentUser.uid,
                    role: 'member',
                    joinedAt: new Date().toISOString()
                })
            });

            // Update local state
            setTeams(teams.map(t => {
                if (t.id === teamId) {
                    return {
                        ...t,
                        members: [...(t.members || []), {
                            userId: currentUser.uid,
                            role: 'member',
                            joinedAt: new Date().toISOString()
                        }]
                    };
                }
                return t;
            }));

            // Update user teams
            setUserTeams([...userTeams, { teamId, role: 'member' }]);

            // Notify parent component
            if (onTeamJoined) {
                onTeamJoined();
            }
        } catch (err) {
            console.error('Error joining team:', err);
            setError(err.message || 'Failed to join team');
        } finally {
            setJoiningTeam(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#261FB3]"></div>
                </div>
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
                <p className="text-[#0C0950] text-center">No teams have been created for this hackathon yet.</p>
                {currentUser && (
                    <div className="mt-4 text-center">
                        <p className="text-gray-600 mb-2">Be the first to create a team!</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                        >
                            Create Team
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => {
                const isUserInTeam = userTeams.some(userTeam => userTeam.id === team.id);
                const userRole = isUserInTeam ? 
                    team.members.find(member => member.userId === currentUser?.uid)?.role : 
                    null;

                return (
                    <div 
                        key={team.id} 
                        className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
                    >
                        <h3 className="text-xl font-semibold mb-2 text-[#0C0950]">{team.name}</h3>
                        
                        <div className="mb-4">
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>{team.members?.length || 0} / {team.maxMembers} members</span>
                            </div>
                            
                            {team.skills && team.skills.length > 0 && (
                                <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">Skills:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {team.skills.slice(0, 3).map((skill, index) => (
                                            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                                {skill}
                                            </span>
                                        ))}
                                        {team.skills.length > 3 && (
                                            <span className="text-xs text-gray-500">+{team.skills.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{team.description}</p>

                        <div className="flex justify-between items-center">
                            <Link 
                                to={`/team/${team.id}`}
                                className="text-[#261FB3] hover:text-[#161179] text-sm font-medium"
                            >
                                View Details
                            </Link>
                            
                            {currentUser && !isUserInTeam && team.members?.length < team.maxMembers && (
                                <button
                                    onClick={() => handleJoinTeam(team.id)}
                                    disabled={joiningTeam}
                                    className="bg-[#261FB3] text-white px-4 py-2 rounded text-sm hover:bg-[#161179] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {joiningTeam ? 'Joining...' : 'Join Team'}
                                </button>
                            )}
                            
                            {isUserInTeam && (
                                <span className="text-sm text-gray-600">
                                    Your Role: {userRole}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default TeamList; 