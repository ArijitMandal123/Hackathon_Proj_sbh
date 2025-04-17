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

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#0C0950]">Teams</h2>
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

          {!isUserInTeam && currentUser && (
            <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h3 className="text-xl font-semibold text-[#0C0950] mb-4">
                Create a New Team
              </h3>
              <TeamForm
                hackathonId={hackathonId}
                onSuccess={() => {
                  setIsUserInTeam(true);
                }}
              />
            </div>
          )}

          {isUserInTeam && (
            <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[#0C0950]">
                  Your Team
                </h3>
                {userTeams.length > 0 && (
                  <Link
                    to={`/team/${userTeams[0].id}`}
                    className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
                  >
                    View Team Details
                  </Link>
                )}
              </div>
              {userTeams.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-700">
                      Team:{" "}
                      <span className="text-[#0C0950]">
                        {userTeams[0].name}
                      </span>
                    </p>
                    <div className="bg-[#EEF2FF] text-[#4F46E5] text-sm px-3 py-1 rounded-full">
                      {userTeams[0].members.filter((m) => !m.isDeleted).length}{" "}
                      / {userTeams[0].maxMembers} Members
                    </div>
                  </div>

                  {userTeams[0].members &&
                    userTeams[0].members.find(
                      (m) => m.userId === currentUser?.uid && !m.isDeleted
                    )?.role && (
                      <p className="text-gray-600 mt-2">
                        Your role:{" "}
                        <span className="capitalize">
                          {
                            userTeams[0].members.find(
                              (m) =>
                                m.userId === currentUser?.uid && !m.isDeleted
                            )?.role
                          }
                        </span>
                      </p>
                    )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {userTeams[0].members &&
                      userTeams[0].members
                        .filter((m) => !m.isDeleted)
                        .map((member, index) => (
                          <div
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700"
                          >
                            {member.role === "leader" ? "👑 " : ""}
                            {member.userId === currentUser?.uid
                              ? "You"
                              : "Member"}
                          </div>
                        ))}

                    {userTeams[0].members &&
                      userTeams[0].maxMembers >
                        userTeams[0].members.filter((m) => !m.isDeleted)
                          .length &&
                      Array.from(
                        {
                          length:
                            userTeams[0].maxMembers -
                            userTeams[0].members.filter((m) => !m.isDeleted)
                              .length,
                        },
                        (_, i) => (
                          <div
                            key={`vacancy-${i}`}
                            className="text-xs px-2 py-1 bg-green-100 rounded-full text-green-700"
                          >
                            Open Position
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}
            </div>
          )}

          <TeamList
            hackathonId={hackathonId}
            onTeamJoined={() => setIsUserInTeam(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default HackathonTeamsPage;
