import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';

function LoginPage() {
    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4">Login</h1>
            <LoginForm />
            <div className="mt-4">
                Need an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
            </div>
        </div>
    );
}

export default LoginPage;