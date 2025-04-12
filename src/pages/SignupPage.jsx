import React from 'react';
import SignupForm from '../components/auth/SignupForm';
import { Link } from 'react-router-dom';

function SignupPage() {
    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4">Sign Up</h1>
            <SignupForm />
            <div className="mt-4">
                Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Log In</Link>
            </div>
        </div>
    );
}

export default SignupPage;