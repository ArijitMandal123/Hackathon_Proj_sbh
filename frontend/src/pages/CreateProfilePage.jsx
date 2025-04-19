import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProfileForm from "../components/ProfileForm";

function CreateProfilePage() {
  const location = useLocation();

  // Extract returnTo parameter from the URL
  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get("returnTo") || "/hackathons";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#0C0950]">
        Create Your Profile
      </h1>
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
        <ProfileForm returnTo={returnTo} />
      </div>
    </div>
  );
}

export default CreateProfilePage;
