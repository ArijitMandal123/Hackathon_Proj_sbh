import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function LoginForm() {
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
      navigate("/"); // Redirect to home page after successful login
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
      navigate("/"); // Redirect to home page after successful Google sign-in
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
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-[#161179] text-sm font-bold mb-2"
          >
            Email:
          </label>
          <input
            type="email"
            id="email"
            ref={emailRef}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
            required
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-[#161179] text-sm font-bold mb-2"
          >
            Password:
          </label>
          <input
            type="password"
            id="password"
            ref={passwordRef}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
            required
          />
        </div>
        <div className="flex flex-col gap-4">
          <button
            disabled={loading}
            className="bg-[#261FB3] hover:bg-[#161179] text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline w-full transition-colors duration-300"
            type="submit"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline w-full transition-colors duration-300 hover:bg-gray-50"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
