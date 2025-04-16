import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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

function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [team, setTeam] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setLoading(true);
        // Fetch team data
        const teamDoc = await getDoc(doc(db, "teams", teamId));

        if (!teamDoc.exists()) {
          setError("Team not found");
          setLoading(false);
          return;
        }

        const teamData = { id: teamDoc.id, ...teamDoc.data() };
        setTeam(teamData);

        // Fetch associated hackathon
        if (teamData.hackathonId) {
          const hackathonDoc = await getDoc(
            doc(db, "hackathons", teamData.hackathonId)
          );
          if (hackathonDoc.exists()) {
            setHackathon({ id: hackathonDoc.id, ...hackathonDoc.data() });
          }
        }

        // Fetch member profiles
        const memberProfiles = [];
        if (teamData.members && teamData.members.length > 0) {
          const memberPromises = teamData.members.map(async (member) => {
            try {
              const userDoc = await getDoc(doc(db, "users", member.userId));
              if (userDoc.exists()) {
                return {
                  ...member,
                  profile: { id: userDoc.id, ...userDoc.data() },
                };
              }
              return member;
            } catch (err) {
              console.error("Error fetching member profile:", err);
              return member;
            }
          });

          const resolvedMembers = await Promise.all(memberPromises);
          setMembers(resolvedMembers);
        }
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Failed to load team data: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#261FB3]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <div className="mt-4">
            <Link
              to="/hackathons"
              className="text-[#261FB3] hover:text-[#161179] font-medium"
            >
              Back to Hackathons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0C0950] mb-2">
                {team.name}
              </h1>
              {hackathon && (
                <div className="flex items-center mb-4">
                  <span className="text-gray-600 mr-2">Hackathon:</span>
                  <Link
                    to={`/hackathon/${hackathon.id}`}
                    className="text-[#261FB3] hover:text-[#161179] font-medium"
                  >
                    {hackathon.title}
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <span className="text-gray-700 font-medium">
                {members.length} / {team.maxMembers} Members
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#0C0950] mb-2">
              Description
            </h2>
            <p className="text-gray-700">{team.description}</p>
          </div>

          {team.skills && team.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#0C0950] mb-3">
                Skills Needed
              </h2>
              <div className="flex flex-wrap gap-2">
                {team.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#0C0950] mb-3">
              Team Members
            </h2>
            <div className="space-y-4">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <h3 className="font-medium text-lg text-[#0C0950]">
                        {member.profile?.name || "Anonymous User"}
                      </h3>
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded capitalize">
                        {member.role}
                      </span>
                    </div>

                    {member.profile && (
                      <>
                        <p className="text-gray-600 mt-1">
                          {member.profile.experience && (
                            <span className="capitalize">
                              {member.profile.experience} •{" "}
                            </span>
                          )}
                          {member.profile.skills &&
                            member.profile.skills.slice(0, 3).join(", ")}
                          {member.profile.skills &&
                            member.profile.skills.length > 3 &&
                            ", ..."}
                        </p>

                        <div className="mt-2">
                          <Link
                            to={`/profile/${member.userId}`}
                            className="text-sm text-[#261FB3] hover:text-[#161179] font-medium"
                          >
                            View Profile
                          </Link>
                        </div>
                      </>
                    )}
                  </div>

                  {member.joinedAt && (
                    <div className="text-xs text-gray-500">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {team.projectLinks && Object.keys(team.projectLinks).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#0C0950] mb-3">
                Project Links
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(team.projectLinks).map(
                  ([key, value]) =>
                    value && (
                      <a
                        key={key}
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="capitalize mr-2">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="text-[#261FB3] truncate">{value}</span>
                      </a>
                    )
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            {hackathon && (
              <Link
                to={`/hackathon/${hackathon.id}`}
                className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
              >
                Back to Hackathon
              </Link>
              //   <Link
              //     to={`/hackathon/${hackathon.id}/teams`}
              //     className="text-[#261FB3] hover:text-[#161179] font-medium"
              //   >
              //     Back to Teams
              //   </Link>
            )}

            {/* Additional actions could go here */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamDetailPage;
