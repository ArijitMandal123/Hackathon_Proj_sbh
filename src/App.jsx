import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateProfilePage from "./pages/CreateProfilePage";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage"; // Import LandingPage
import ProfilePage from "./pages/ProfilePage";
import HackathonListingsPage from "./pages/HackathonListingsPage";
import HackathonDetailsPage from "./pages/HackathonDetailsPage";
import AddHackathonPage from "./pages/AddHackathonPage"; // Import AddHackathonPage
import HackathonTeamsPage from "./pages/HackathonTeamsPage";
import ProfilesPage from "./pages/ProfilesPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage"; // Import ProfileSettingsPage
import TeamJoinRequestsPage from "./pages/TeamJoinRequestsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function AppContent() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/'); // Redirect to landing page after logout
    } catch (error) {
      console.error("Failed to logout", error);
      alert("Failed to logout");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#261FB3] p-4 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold hover:text-[#FBE4D6] transition-colors duration-300">
            Hackathon Teammate Finder
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              to="/hackathons"
              className="text-white hover:text-[#FBE4D6] font-medium transition-colors duration-300"
            >
              Discover Hackathons
            </Link>
            {currentUser ? (
              <>
                <Link
                  to="/profiles"
                  className="text-white hover:text-[#FBE4D6] font-medium transition-colors duration-300"
                >
                  Browse Profiles
                </Link>
                <Link
                  to={`/profile/${currentUser.uid}`}
                  className="text-white hover:text-[#FBE4D6] font-medium transition-colors duration-300"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-[#161179] hover:bg-[#0C0950] text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FBE4D6] transition-all duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : null}
          </div>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={currentUser ? <HomePage /> : <LandingPage />}
        />
        <Route path="/create-profile" element={<CreateProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/settings"
          element={currentUser ? <ProfileSettingsPage /> : <LoginPage />}
        />
        <Route path="/hackathons" element={<HackathonListingsPage />} />
        <Route
          path="/hackathon/:hackathonId"
          element={<HackathonDetailsPage />}
        />
        <Route
          path="/hackathon/:hackathonId/teams"
          element={<HackathonTeamsPage />}
        />
        <Route path="/team/:teamId" element={<TeamDetailPage />} />
        <Route path="/team/:teamId/requests" element={<TeamJoinRequestsPage />} />
        <Route
          path="/add-hackathon"
          element={currentUser ? <AddHackathonPage /> : <LandingPage />}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
