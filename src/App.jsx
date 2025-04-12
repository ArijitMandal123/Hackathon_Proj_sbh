import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateProfilePage from './pages/CreateProfilePage';
import LoginPage from './pages/LoginPage'; // Import LoginPage
import SignupPage from './pages/SignupPage'; // Import SignupPage
import { useAuth } from './context/AuthContext'; // Import useAuth

function App() {
    const { currentUser, logout } = useAuth(); // Get currentUser and logout from context

    async function handleLogout() {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to logout", error);
            alert("Failed to logout"); // Basic error handling for MVP
        }
    }

    return (
        <Router>
            <div className="bg-gray-100 min-h-screen">
                <nav className="bg-blue-500 p-4 text-white">
                    <div className="container mx-auto flex justify-between items-center">
                        <Link to="/" className="text-xl font-bold">Hackathon Teammate Finder</Link>
                        <div>
                            {currentUser ? ( // If user is logged in
                                <>
                                    <Link to="/create-profile" className="bg-white text-blue-500 hover:bg-blue-100 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2">
                                        Create Profile
                                    </Link>
                                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                        Log Out
                                    </button>
                                </>
                            ) : ( // If user is not logged in
                                <>
                                    <Link to="/login" className="bg-white text-blue-500 hover:bg-blue-100 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2">
                                        Log In
                                    </Link>
                                    <Link to="/signup" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create-profile" element={<CreateProfilePage />} />
                    <Route path="/login" element={<LoginPage />} /> {/* Login Route */}
                    <Route path="/signup" element={<SignupPage />} /> {/* Signup Route */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;