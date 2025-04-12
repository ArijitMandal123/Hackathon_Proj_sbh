import React from 'react';

function ProfileForm() {
    return (
        <form className="max-w-lg mx-auto bg-white p-6 rounded-md shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Create Your Profile</h2>
            <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
                <input type="text" id="name" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                <input type="email" id="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-4">
                <label htmlFor="techStack" className="block text-gray-700 text-sm font-bold mb-2">Tech Stack:</label>
                <input type="text" id="techStack" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="e.g., JavaScript, React, Python" />
            </div>
            {/* Add more fields similarly (Preferences, Mode, Location, GitHub, LinkedIn) */}
            <div className="flex items-center justify-between">
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                    Create Profile
                </button>
            </div>
        </form>
    );
}

export default ProfileForm;