import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

function LoginForm({ returnTo = "/" }) {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, googleSignIn } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate('/hackathons'); // Redirect to hackathons page after successful login
    } catch (firebaseError) {
      if (firebaseError.code === "auth/invalid-credential") {
        setError(
          "Invalid email or password. Please check your credentials and try again."
        );
      } else if (firebaseError.code === "auth/user-not-found") {
        setError(
          "No account found with this email. Please check your email or sign up."
        );
      } else if (firebaseError.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setError(
          "Too many failed login attempts. Please try again later or reset your password."
        );
      } else {
        setError(
          firebaseError.message ||
            "An error occurred during login. Please try again."
        );
      }
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError("");
      setLoading(true);
      await googleSignIn();
      navigate(returnTo); // Redirect to returnTo URL after successful Google sign-in
    } catch (firebaseError) {
      if (firebaseError.code === "auth/popup-closed-by-user") {
        setError(
          "Sign-in cancelled. Please try again if you want to sign in with Google."
        );
      } else {
        // Handle error message whether it's a string or object
        const errorMessage =
          firebaseError.message ||
          (typeof firebaseError === "object"
            ? JSON.stringify(firebaseError)
            : "An error occurred during sign in");
        setError(errorMessage);
      }
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-[#0C0950]">Login</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {error.includes("Sign-in cancelled") && (
            <button
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
              onClick={handleGoogleSignIn}
            >
              Try Again
            </button>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            ref={emailRef}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            ref={passwordRef}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
            required
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#261FB3] hover:bg-[#161179] text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FBE4D6] transition-all duration-300"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="mt-4 text-gray-600">
        Need to create a profile?{" "}
        <Link
          to={`/create-profile?returnTo=${encodeURIComponent(returnTo)}`}
          className="justify-center text-[#261FB3] hover:text-[#161179] hover:underline transition-colors duration-300"
        >
          Create Profile
        </Link>
      </div>

      </form>
    </div>
  );
}

export default LoginForm;
