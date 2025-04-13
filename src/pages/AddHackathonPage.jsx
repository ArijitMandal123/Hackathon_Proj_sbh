import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddHackathonForm from '../components/hackathon/AddHackathonForm';

function AddHackathonPage() {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#0C0950]">Add New Hackathon</h1>
                <button
                    onClick={() => navigate('/hackathons')}
                    className="bg-gray-200 hover:bg-gray-300 text-[#161179] font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
                >
                    Back to Hackathons
                </button>
            </div>
            
            <div className="max-w-4xl mx-auto">
                <AddHackathonForm />
            </div>
        </div>
    );
}

export default AddHackathonPage; 