import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateProfilePage from "./pages/CreateProfilePage";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage"; // Import LandingPage
import ProfileDetailsPage from "./pages/ProfileDetailsPage";
import HackathonListingsPage from "./pages/HackathonListingsPage";
import HackathonDetailsPage from "./pages/HackathonDetailsPage";
import AddHackathonPage from "./pages/AddHackathonPage"; // Import AddHackathonPage
import HackathonTeamsPage from "./pages/HackathonTeamsPage";
import ProfilesPage from "./pages/ProfilesPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage"; // Import ProfileSettingsPage
import { useAuth, AuthProvider } from "./contexts/AuthContext";

function AppContent() {
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#261FB3] p-4 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Hackathon Teammate Finder
          </Link>
          <div className="flex items-center">
            <Link
              to="/hackathons"
              className="text-white hover:text-[#FBE4D6] font-medium mr-4 transition-colors duration-300"
            >
              Hackathons
            </Link>
            {currentUser ? ( // If user is logged in: Show profile and logout
              <>
                <Link
                  to={`/profile/${currentUser.uid}`}
                  className="text-white hover:text-[#FBE4D6] font-medium mr-4 transition-colors duration-300"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-[#161179] hover:bg-[#0C0950] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
                >
                  Log Out
                </button>
              </>
            ) : // If user is not logged in: Navigation is handled by LandingPage
            null}
          </div>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={currentUser ? <HomePage /> : <LandingPage />}
        />
        <Route path="/create-profile" element={<CreateProfilePage />} />
        <Route path="/profile/:userId" element={<ProfileDetailsPage />} />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/login" element={<LoginPage />} />
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
