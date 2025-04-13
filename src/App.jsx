import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateProfilePage from './pages/CreateProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage'; // Import LandingPage
import { useAuth } from './components/AuthContext';

function App() {
    const { currentUser, logout } = useAuth();

    async function handleLogout() {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to logout", error);
            alert("Failed to logout");
        }
    }

    return (
        <Router>
            <div className="bg-gray-100 min-h-screen">
                <nav className="bg-blue-500 p-4 text-white">
                    <div className="container mx-auto flex justify-between items-center">
                        <Link to="/" className="text-xl font-bold">Hackathon Teammate Finder</Link>
                        <div>
                            {currentUser ? ( // If user is logged in: Show profile actions and logout
                                <>
                                    <Link to="/create-profile" className="bg-white text-blue-500 hover:bg-blue-100 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2">
                                        Create Profile
                                    </Link>
                                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                        Log Out
                                    </button>
                                </>
                            ) : ( // If user is not logged in: Navigation is handled by LandingPage, remove links here or keep minimal if needed.
                                // You could optionally keep "Login" and "Signup" links in the navbar as well for redundancy.
                                null // Or keep minimal links if you prefer
                            )}
                        </div>
                    </div>
                </nav>

                <Routes>
                    <Route path="/" element={currentUser ? <HomePage /> : <LandingPage />} /> {/* Conditionally render HomePage or LandingPage */}
                    <Route path="/create-profile" element={currentUser ? <CreateProfilePage /> : <LandingPage />} /> {/* Protect create-profile too */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;