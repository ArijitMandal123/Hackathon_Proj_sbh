import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';

function LoginPage() {
    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6 text-[#0C0950]">Login</h1>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 w-full max-w-md">
                <LoginForm />
            </div>
            <div className="mt-4 text-gray-600">
                Need an account? <Link to="/signup" className="text-[#261FB3] hover:text-[#161179] hover:underline transition-colors duration-300">Sign Up</Link>
            </div>
        </div>
    );
}

export default LoginPage;