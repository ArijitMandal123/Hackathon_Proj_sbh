import React from 'react';
import ProfileForm from '../components/ProfileForm';

function CreateProfilePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Create Your Developer Profile</h1>
            <ProfileForm />
        </div>
    );
}

export default CreateProfilePage;