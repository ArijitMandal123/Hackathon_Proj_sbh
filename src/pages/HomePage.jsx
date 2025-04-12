import React from 'react';
import ProfileCard from '../components/ProfileCard';

function HomePage() {
    // Mock profile data for now
    const profiles = [
        {
            name: 'John Doe',
            techStack: ['JavaScript', 'React', 'Node.js'],
            preferences: 'Frontend focused, interested in web3',
            mode: 'Remote',
            location: 'New York, USA',
            github: 'https://github.com/johndoe',
            linkedin: 'https://linkedin.com/in/johndoe'
        },
        {
            name: 'Jane Smith',
            techStack: ['Python', 'Django', 'PostgreSQL'],
            preferences: 'Backend and data science projects',
            mode: 'In-person',
            location: 'London, UK',
            github: 'https://github.com/janesmith',
            linkedin: 'https://linkedin.com/in/janesmith'
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Find Your Hackathon Teammates</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((profile, index) => (
                    <ProfileCard key={index} {...profile} />
                ))}
            </div>
        </div>
    );
}

export default HomePage;