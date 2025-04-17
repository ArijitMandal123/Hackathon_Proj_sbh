import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import TeamForm from "../components/team/TeamForm";
import TeamList from "../components/team/TeamList";

function HackathonDetailsPage() {
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [isUserInTeam, setIsUserInTeam] = useState(false);
  const { hackathonId } = useParams();
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchHackathonDetails() {
      setLoading(true);
      setError(null);
      try {
        const hackathonDoc = doc(db, "hackathons", hackathonId);
        const hackathonSnapshot = await getDoc(hackathonDoc);

        if (hackathonSnapshot.exists()) {
          const data = hackathonSnapshot.data();
          setHackathon({
            id: hackathonSnapshot.id,
            ...data,
            // Convert Firestore Timestamps to ISO strings for display
            startDate:
              data.startDate?.toDate?.()?.toISOString() || data.startDate,
            endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate,
          });
        } else {
          setError("Hackathon not found");
        }
      } catch (err) {
        console.error("Error fetching hackathon details:", err);
        setError("Failed to fetch hackathon details: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHackathonDetails();
  }, [hackathonId]);

  useEffect(() => {
    async function checkUserTeamStatus() {
      if (!currentUser) return;

      try {
        // Check if user is already in a team for this hackathon
        const teamsQuery = query(
          collection(db, "teams"),
          where("hackathonId", "==", hackathonId)
        );

        const teamsSnapshot = await getDocs(teamsQuery);

        // Filter teams where the user is a member
        const teams = teamsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (team) =>
              team.members &&
              team.members.some((member) => member.userId === currentUser.uid)
          );

        setUserTeams(teams);
        setIsUserInTeam(teams.length > 0);
      } catch (err) {
        console.error("Error checking user team status:", err);
      }
    }

    if (currentUser) {
      checkUserTeamStatus();
    }
  }, [currentUser, hackathonId]);

  const formatDate = (dateString) => {
    try {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const getStatusBadge = (startDate, endDate) => {
    try {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (now < start) {
        return (
          <span className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm font-medium">
            Upcoming
          </span>
        );
      } else if (now >= start && now <= end) {
        return (
          <span className="bg-[#261FB3] text-white px-3 py-1 rounded-full text-sm font-medium">
            Ongoing
          </span>
        );
      } else {
        return (
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            Past
          </span>
        );
      }
    } catch (error) {
      console.error("Error determining status:", error);
      return (
        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
          Unknown
        </span>
      );
    }
  };

  const isHackathonActive = () => {
    if (!hackathon) return false;
    const now = new Date();
    const start = new Date(hackathon.startDate);
    const end = new Date(hackathon.endDate);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#261FB3]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
        <div className="mt-4">
          <Link
            to="/hackathons"
            className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
          >
            ← Back to Hackathons
          </Link>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Hackathon not found
        </div>
        <div className="mt-4">
          <Link
            to="/hackathons"
            className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
          >
            ← Back to Hackathons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/hackathons"
          className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
        >
          ← Back to Hackathons
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
        {/* Hero Image */}
        <div className="h-64 md:h-96 overflow-hidden">
          {hackathon.imageUrl ? (
            <img
              src={hackathon.imageUrl}
              alt={hackathon.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0C0950] mb-2">
                {hackathon.name}
              </h1>
              <div className="flex items-center gap-4">
                {getStatusBadge(hackathon.startDate, hackathon.endDate)}
              </div>
            </div>

            <div className="mt-4 md:mt-0">
              {currentUser && !isUserInTeam && (
                <Link
                  to={`/hackathon/${hackathonId}/teams`}
                  className="bg-[#261FB3] hover:bg-[#161179] text-white font-bold py-2 px-6 rounded transition-colors duration-300 inline-flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906zM10 15v-3h.01v.01H10v-.01a4.979 4.979 0 00-1.755-3.776c.84.27 1.73.418 2.667.418h.168c.94 0 1.83-.149 2.67-.419A4.979 4.979 0 0012 12v3h-2z" />
                  </svg>
                  Add Team
                </Link>
              )}
              {currentUser && isUserInTeam && (
                <Link
                  to={`/team/${userTeams[0]?.id}`}
                  className="bg-[#161179] hover:bg-[#0C0950] text-white font-bold py-2 px-6 rounded transition-colors duration-300 inline-flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906zM10 15v-3h.01v.01H10v-.01a4.979 4.979 0 00-1.755-3.776c.84.27 1.73.418 2.667.418h.168c.94 0 1.83-.149 2.67-.419A4.979 4.979 0 0012 12v3h-2z" />
                  </svg>
                  View Your Team
                </Link>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#0C0950] mb-3">About</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {hackathon.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Location */}
            {hackathon.location && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0C0950] mb-2">
                  Location
                </h3>
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#261FB3] mr-2 mt-1 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-gray-700">{hackathon.location}</p>
                    {hackathon.isVirtual && (
                      <p className="text-sm text-gray-500 mt-1">
                        This is a virtual event
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Prizes */}
            {hackathon.prize && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0C0950] mb-2">
                  Prizes
                </h3>
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#261FB3] mr-2 mt-1 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <p className="text-gray-700">{hackathon.prize}</p>
                </div>
              </div>
            )}

            {/* Eligibility */}
            {hackathon.eligibility && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0C0950] mb-2">
                  Eligibility
                </h3>
                <p className="text-gray-700">{hackathon.eligibility}</p>
              </div>
            )}

            {/* Registration */}
            {hackathon.registration && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0C0950] mb-2">
                  Registration
                </h3>
                <p className="text-gray-700">{hackathon.registration}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {hackathon.tags && hackathon.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#0C0950] mb-3">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {hackathon.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-4 mb-8">
            {hackathon.websiteUrl && (
              <a
                href={hackathon.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#261FB3] hover:bg-[#161179] text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
              >
                Official Website
              </a>
            )}
            {hackathon.registrationUrl && (
              <a
                href={hackathon.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FBE4D6] hover:bg-[#f5d5c3] text-[#0C0950] font-medium py-2 px-6 rounded-md transition-colors duration-300"
              >
                Register Now
              </a>
            )}
          </div>

          {/* Team Management Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#0C0950]">Teams</h2>
              {currentUser && !isUserInTeam && isHackathonActive() && (
                <div className="flex gap-4">
                  {!showTeamForm && (
                    <button
                      onClick={() => setShowTeamForm(true)}
                      className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                    >
                      Create Team
                    </button>
                  )}
                  {showTeamForm && (
                    <button
                      onClick={() => setShowTeamForm(false)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {!showTeamForm && (
                    <Link
                      to={`/hackathon/${hackathonId}/teams`}
                      className="bg-[#FBE4D6] text-[#0C0950] px-4 py-2 rounded hover:bg-[#f5d5c3] transition-colors"
                    >
                      Browse Teams
                    </Link>
                  )}
                </div>
              )}
            </div>

            {showTeamForm ? (
              <div className="mb-8">
                <TeamForm
                  hackathonId={hackathonId}
                  onSuccess={() => {
                    setShowTeamForm(false);
                    // Refresh user teams
                    fetchUserTeams();
                  }}
                />
              </div>
            ) : (
              <TeamList
                hackathonId={hackathonId}
                onTeamJoined={() => {
                  // Refresh user teams
                  fetchUserTeams();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HackathonDetailsPage;
