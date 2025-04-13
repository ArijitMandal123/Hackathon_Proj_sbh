import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileForm from '../components/ProfileForm';

function CreateProfilePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-[#0C0950]">Create Your Developer Profile</h1>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                <ProfileForm />
            </div>
        </div>
    );
}

export default CreateProfilePage;