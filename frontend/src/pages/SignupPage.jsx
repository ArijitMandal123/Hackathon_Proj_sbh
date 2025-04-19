import React from 'react';
import SignupForm from '../components/auth/SignupForm';
import { Link } from 'react-router-dom';

function SignupPage() {
    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6 text-[#0C0950]">Sign Up</h1>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 w-full max-w-md">
                <SignupForm />
            </div>
            <div className="mt-4 text-gray-600">
                Already have an account? <Link to="/login" className="text-[#261FB3] hover:text-[#161179] hover:underline transition-colors duration-300">Log In</Link>
            </div>
        </div>
    );
}

export default SignupPage;