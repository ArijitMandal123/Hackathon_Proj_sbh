import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import TeamForm from '../components/team/TeamForm';
import TeamList from '../components/team/TeamList';

function HackathonTeamsPage() {
    const { hackathonId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [hackathon, setHackathon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showTeamForm, setShowTeamForm] = useState(false);

    useEffect(() => {
        async function fetchHackathon() {
            try {
                const hackathonDoc = await getDoc(doc(db, 'hackathons', hackathonId));
                if (!hackathonDoc.exists()) {
                    setError('Hackathon not found');
                    return;
                }
                setHackathon({ id: hackathonDoc.id, ...hackathonDoc.data() });
            } catch (err) {
                console.error('Error fetching hackathon:', err);
                setError('Failed to load hackathon: ' + err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchHackathon();
    }, [hackathonId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[#0C0950]">Loading hackathon details...</p>
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

    if (!hackathon) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#0C0950] mb-2">{hackathon.title}</h1>
                    <p className="text-gray-600">{hackathon.description}</p>
                </div>

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-[#0C0950]">Teams</h2>
                        {currentUser && (
                            <button
                                onClick={() => setShowTeamForm(!showTeamForm)}
                                className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                            >
                                {showTeamForm ? 'Hide Form' : 'Create/Join Team'}
                            </button>
                        )}
                    </div>

                    {showTeamForm && (
                        <div className="mb-8">
                            <TeamForm 
                                hackathonId={hackathonId}
                                onSuccess={() => setShowTeamForm(false)}
                            />
                        </div>
                    )}

                    <TeamList hackathonId={hackathonId} />
                </div>
            </div>
        </div>
    );
}

export default HackathonTeamsPage; 