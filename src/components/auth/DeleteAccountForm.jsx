import React, { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function DeleteAccountForm() {
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { deleteAccount } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    // Validate password match
    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);

      await deleteAccount(passwordRef.current.value);

      // Redirect to home page after successful deletion
      navigate("/");
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/requires-recent-login") {
        setError(
          "For security reasons, please log out and log back in before deleting your account."
        );
      } else {
        setError("Failed to delete account: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-xl font-semibold text-red-600 mb-4">
        Delete Account
      </h2>

      <p className="text-gray-700 mb-4">
        Deleting your account will:
        <ul className="list-disc ml-6 mt-2">
          <li>Permanently delete your user profile</li>
          <li>Remove you from all teams you have joined</li>
          <li>
            If you are a team leader, another team member will be promoted
          </li>
          <li>This action cannot be undone</li>
        </ul>
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!showConfirmation ? (
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={() => setShowConfirmation(true)}
        >
          Delete Account
        </button>
      ) : (
        <form onSubmit={handleDeleteAccount}>
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            Please enter your password to confirm account deletion.
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Enter your password"
              ref={passwordRef}
              required
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              ref={passwordConfirmRef}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm Delete"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default DeleteAccountForm;
