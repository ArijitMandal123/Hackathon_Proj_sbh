import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateProfilePage from './pages/CreateProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage'; // Import LandingPage
import ProfileDetailsPage from './pages/ProfileDetailsPage';
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
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-[#261FB3] p-4 text-white shadow-md">
                    <div className="container mx-auto flex justify-between items-center">
                        <Link to="/" className="text-xl font-bold">Hackathon Teammate Finder</Link>
                        <div>
                            {currentUser ? ( // If user is logged in: Show profile actions and logout
                                <>
                                    <Link to="/create-profile" className="bg-[#FBE4D6] text-[#0C0950] hover:bg-[#f5d5c3] font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2 transition-colors duration-300">
                                        Create Profile
                                    </Link>
                                    <button onClick={handleLogout} className="bg-[#161179] hover:bg-[#0C0950] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300">
                                        Log Out
                                    </button>
                                </>
                            ) : ( // If user is not logged in: Navigation is handled by LandingPage
                                null
                            )}
                        </div>
                    </div>
                </nav>

                <Routes>
                    <Route path="/" element={currentUser ? <HomePage /> : <LandingPage />} />
                    <Route path="/create-profile" element={currentUser ? <CreateProfilePage /> : <LandingPage />} />
                    <Route path="/profile/:userId" element={<ProfileDetailsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;