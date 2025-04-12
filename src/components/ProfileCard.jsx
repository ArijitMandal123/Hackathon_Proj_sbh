import React from 'react';

function ProfileCard({ name, techStack, preferences, mode, location, github, linkedin }) {
    return (
        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">{name}</h3>
            <p className="text-gray-600 mb-1"><strong>Tech Stack:</strong> {techStack.join(', ')}</p>
            <p className="text-gray-600 mb-1"><strong>Preferences:</strong> {preferences}</p>
            <p className="text-gray-600 mb-1"><strong>Mode:</strong> {mode}</p>
            <p className="text-gray-600 mb-1"><strong>Location:</strong> {location}</p>
            <div className="flex mt-2 space-x-2">
                {github && <a href={github} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>}
                {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">LinkedIn</a>}
            </div>
        </div>
    );
}

export default ProfileCard;