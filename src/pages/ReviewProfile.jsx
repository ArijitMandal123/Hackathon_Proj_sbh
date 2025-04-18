import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReviewProfile = ({ username, onPointsUpdate, userId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const fetchGitHubData = async () => {
    if (!username || !userId) {
      setError('GitHub username and user ID are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`Sending request to analyze GitHub profile for username: ${username}, userId: ${userId}`);
      
      const response = await axios.post('http://localhost:8000/analyze-github-profile', {
        username: username,
        user_id: userId
      });
      
      console.log('GitHub profile analysis response:', response.data);
      setProfileData(response.data);
      
      // Update points if the callback is provided
      if (onPointsUpdate && response.data.total_points) {
        console.log(`Updating points to: ${response.data.total_points}`);
        onPointsUpdate(response.data.total_points);
      }
    } catch (err) {
      console.error('Error fetching GitHub data:', err);
      
      // Extract the error message from the response
      if (err.response?.data?.detail) {
        // If it's a string, use it directly
        if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } 
        // If it's an object with a msg property, use that
        else if (err.response.data.detail.msg) {
          setError(err.response.data.detail.msg);
        }
        // Otherwise, use a generic error message
        else {
          setError('An error occurred while analyzing your GitHub profile');
        }
      } else {
        setError('An error occurred while fetching GitHub data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username && userId) {
      fetchGitHubData();
    }
  }, [username, userId]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#261FB3]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchGitHubData}
            className="mt-4 bg-[#261FB3] hover:bg-[#161179] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mt-8 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-[#0C0950]">
          GitHub Profile Analysis
        </h1>
        
        {profileData && (
          <>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="grid gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Username: {profileData.username}
                  </h2>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Total Repositories: {profileData.total_repos}
                  </h2>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#261FB3]">
                    Total Stars: {profileData.total_stars}
                  </h2>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#261FB3]">
                    Total Forks: {profileData.total_forks}
                  </h2>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#261FB3]">
                    Total Commits: {profileData.total_commits}
                  </h2>
                </div>
                {profileData.total_points && (
                  <div>
                    <h2 className="text-2xl font-bold text-[#261FB3]">
                      Total Points: {profileData.total_points}
                    </h2>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-[#0C0950]">
              Top Repository Analysis
            </h2>
            
            <div className="space-y-4">
              {profileData.repo_details && profileData.repo_details.map((repo, index) => (
                <div key={index} className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{repo.name}</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-[#261FB3] font-medium">
                          Stars: {repo.stars}
                        </p>
                        <p className="text-[#261FB3] font-medium">
                          Forks: {repo.forks}
                        </p>
                        <p className="text-[#261FB3] font-medium">
                          Commits: {repo.commits}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(repo.difficulty)}`}>
                      {repo.difficulty} difficulty
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewProfile;
