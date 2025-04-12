import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function SignupForm() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup } = useAuth(); // Get signup function from context
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError("Passwords do not match");
        }

        try {
            setError('');
            setLoading(true);
            await signup(emailRef.current.value, passwordRef.current.value);
            // Redirect to home page or profile page after successful signup
        } catch (firebaseError) {
            setError(firebaseError.message); // Display Firebase error message
        }
        setLoading(false);
    }

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Sign Up</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                    <input type="email" id="email" ref={emailRef} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                    <input type="password" id="password" ref={passwordRef} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-6">
                    <label htmlFor="password-confirm" className="block text-gray-700 text-sm font-bold mb-2">Confirm Password:</label>
                    <input type="password" id="password-confirm" ref={passwordConfirmRef} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="flex items-center justify-center">
                    <button disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                        Sign Up
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SignupForm;