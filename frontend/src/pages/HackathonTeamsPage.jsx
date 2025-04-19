import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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

function HackathonTeamsPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [isUserInTeam, setIsUserInTeam] = useState(false);

  useEffect(() => {
    async function fetchHackathon() {
      try {
        const hackathonDoc = await getDoc(doc(db, "hackathons", hackathonId));
        if (!hackathonDoc.exists()) {
          setError("Hackathon not found");
          return;
        }
        setHackathon({ id: hackathonDoc.id, ...hackathonDoc.data() });
      } catch (err) {
        console.error("Error fetching hackathon:", err);
        setError("Failed to load hackathon: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHackathon();
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

        // Filter teams where the user is an active member (not marked as deleted)
        const teams = teamsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (team) =>
              team.members &&
              team.members.some(
                (member) =>
                  member.userId === currentUser.uid && !member.isDeleted
              )
          );

        setUserTeams(teams);
        setIsUserInTeam(teams.length > 0);
      } catch (err) {
        console.error("Error checking user team status:", err);
      }
    }

    checkUserTeamStatus();
  }, [currentUser, hackathonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#0C0950]">Loading hackathon details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <div className="mt-4">
            <Link
              to={`/hackathon/${hackathonId}`}
              className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
            >
              ← Back to Hackathon
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Link
            to={`/hackathon/${hackathonId}`}
            className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
          >
            ← Back to Hackathon
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0C0950] mb-2">
            {hackathon.title || hackathon.name}
          </h1>
          <p className="text-gray-600">{hackathon.description}</p>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#0C0950]">Teams</h2>
            {currentUser && isUserInTeam && (
              <div className="text-gray-600 px-4 py-2 rounded border border-gray-300">
                You are already in a team for this hackathon
              </div>
            )}
          </div>

          <div className="mb-6 bg-blue-50 text-blue-800 p-4 border-l-4 border-blue-500 rounded">
            <p className="font-medium">Hackathon Team Rules:</p>
            <ul className="list-disc ml-5 mt-1 text-sm">
              <li>
                You can only join <strong>one team</strong> per hackathon
              </li>
              <li>
                Once you've joined or created a team, you cannot join another
                team in this hackathon
              </li>
              <li>Each team must have a designated team leader</li>
              <li>Teams without active leaders will be removed</li>
            </ul>
          </div>

          {/* Team Management Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#0C0950]">Teams</h2>
              {currentUser && !isUserInTeam && (
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

export default HackathonTeamsPage;
