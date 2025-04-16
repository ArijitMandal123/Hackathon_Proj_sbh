import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/auth/LoginForm";

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Extract returnTo parameter from the URL
  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get("returnTo") || "/";

  // Redirect if the user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(returnTo);
    }
  }, [currentUser, navigate, returnTo]);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-[#0C0950]">Login</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 w-full max-w-md">
        <LoginForm returnTo={returnTo} />
      </div>
      <div className="mt-4 text-gray-600">
        Need to create a profile?{" "}
        <Link
          to={`/create-profile?returnTo=${encodeURIComponent(returnTo)}`}
          className="text-[#261FB3] hover:text-[#161179] hover:underline transition-colors duration-300"
        >
          Create Profile
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
