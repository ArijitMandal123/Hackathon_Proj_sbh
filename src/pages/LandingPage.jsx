import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
    return (
        <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-700 mb-4">
                    Welcome to Hackathon Teammate Finder!
                </h1>
                <p className="text-lg text-gray-700 mb-8">
                    Find your perfect team for the next hackathon. Connect with developers, build amazing projects, and innovate together.
                </p>
                <div className="space-x-4">
                    <Link to="/signup" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Sign Up
                    </Link>
                    <Link to="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Log In
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;