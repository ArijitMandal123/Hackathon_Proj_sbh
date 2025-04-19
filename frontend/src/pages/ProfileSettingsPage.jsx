import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DeleteAccountForm from "../components/auth/DeleteAccountForm";

function ProfileSettingsPage() {
  const { currentUser, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    skills: [],
    experience: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Set form data from current user
    setFormData({
      name: currentUser.name || "",
      email: currentUser.email || "",
      bio: currentUser.bio || "",
      skills: currentUser.skills || [],
      experience: currentUser.experience || "",
      githubUrl: currentUser.githubUrl || "",
      linkedinUrl: currentUser.linkedinUrl || "",
      portfolioUrl: currentUser.portfolioUrl || "",
    });
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      setError("Failed to log out");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await updateUserProfile(formData);
      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <p className="text-center text-gray-700">
            Please log in to access your profile settings.
          </p>
          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="inline-block bg-[#261FB3] text-white px-4 py-2 rounded"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#0C0950]">
            Account Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your profile and account settings
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-[#0C0950] mb-6">
            Profile Settings
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                id="email"
                type="email"
                name="email"
                value={formData.email}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="bio"
              >
                Bio
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="bio"
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={handleLogout}
              >
                Logout
              </button>
              <button
                type="submit"
                className="bg-[#261FB3] hover:bg-[#161179] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <DeleteAccountForm />
        </div>
      </div>
    </div>
  );
}

export default ProfileSettingsPage;
