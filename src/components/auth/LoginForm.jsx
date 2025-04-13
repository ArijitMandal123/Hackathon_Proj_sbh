import React, { useRef, useState } from 'react';
import { useAuth } from '../AuthContext';

function LoginForm() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login, googleSignIn } = useAuth(); // Get login and googleSignIn from context
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(emailRef.current.value, passwordRef.current.value);
            // Redirect to home page or profile page after successful login
        } catch (firebaseError) {
            setError(firebaseError.message); // Display Firebase error message
        }
        setLoading(false);
    }

    async function handleGoogleSignIn() {
        try {
            setError('');
            setLoading(true);
            await googleSignIn();
            // Redirect after Google sign-in
        } catch (firebaseError) {
            setError(firebaseError.message);
        }
        setLoading(false);
    }


    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Log In</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                    <input type="email" id="email" ref={emailRef} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                    <input type="password" id="password" ref={passwordRef} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="flex flex-col items-center justify-between">
                    <button disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-2" type="submit">
                        Log In
                    </button>
                    <button disabled={loading} type="button" onClick={handleGoogleSignIn} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Log In with Google
                    </button>
                </div>
            </form>
        </div>
    );
}

export default LoginForm;