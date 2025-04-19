import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
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
  const [isUserInTeam, setIsUserInTeam] = useState(false);
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Add helper function for logging team capacity
  const logTeamCapacity = (team, stage = "checking") => {
    if (!team || !team.members) return;

    const activeMembers = team.members.filter((m) => !m.isDeleted);
    const maxMembers = team.maxMembers || 4;
    const hasVacancies = activeMembers.length < maxMembers;

    console.log(
      `[${stage}] Team ${team.id} capacity: ${activeMembers.length}/${maxMembers} members`,
      {
        teamId: team.id,
        activeMembers: activeMembers.length,
        maxMembers: maxMembers,
        hasVacancies: hasVacancies,
        deletedMembers: team.members.filter((m) => m.isDeleted).length,
        totalMembers: team.members.length,
      }
    );

    return { activeMembers, maxMembers, hasVacancies };
  };

  // Add function to handle joining a team directly from the team details page
  const handleJoinTeam = async () => {
    if (!currentUser) {
      navigate(`/login?returnTo=/team/${teamId}`);
      return;
    }

    setIsJoiningTeam(true);
    setError("");

    try {
      // Check if user is already in a team for this hackathon
      const teamsQuery = query(
        collection(db, "teams"),
        where("hackathonId", "==", team.hackathonId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      const userInTeam = teamsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .some(
          (team) =>
            team.members &&
            team.members.some(
              (member) => member.userId === currentUser.uid && !member.isDeleted
            )
        );

      if (userInTeam) {
        throw new Error(
          "You are already a member of a team in this hackathon. You can only join one team per hackathon."
        );
      }

      // Check if team has space
      const activeMembers = team.members.filter(member => !member.isDeleted);
      if (activeMembers.length >= team.maxMembers) {
        throw new Error("Team is already at maximum capacity");
      }

      // Check if there's already a pending join request from this user
      const existingRequestQuery = query(
        collection(db, "joinRequests"),
        where("teamId", "==", teamId),
        where("userId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);
      
      if (!existingRequestSnapshot.empty) {
        throw new Error("You already have a pending join request for this team");
      }

      // Create a new join request
      await addDoc(collection(db, "joinRequests"), {
        teamId,
        userId: currentUser.uid,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // Show success message
      setJoinSuccess(true);
      setTimeout(() => {
        setJoinSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error joining team:", err);
      setError(err.message || "Failed to join team");
    } finally {
      setIsJoiningTeam(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [teamId, currentUser]);

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

      // Check if current user is an active member of this team
      if (currentUser && teamData.members) {
        const userIsMember = teamData.members.some(
          (member) => member.userId === currentUser.uid && !member.isDeleted
        );
        setIsUserInTeam(userIsMember);
      } else {
        setIsUserInTeam(false);
      }

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
            // Check if user document exists (user hasn't been deleted)
            const userDoc = await getDoc(doc(db, "users", member.userId));
            if (userDoc.exists()) {
              return {
                ...member,
                profile: { id: userDoc.id, ...userDoc.data() },
                exists: true,
              };
            }
            return {
              ...member,
              profile: {
                name: "Open Position",
                bio: "This position is available for a new team member.",
                skills: [],
              },
              exists: false,
              isVacancy: true,
            };
          } catch (err) {
            console.error("Error fetching member profile:", err);
            return {
              ...member,
              profile: {
                name: "Unknown Member",
                bio: "Could not retrieve profile data.",
                skills: [],
              },
              exists: false,
            };
          }
        });

        const resolvedMembers = await Promise.all(memberPromises);
        setMembers(resolvedMembers);
      }

      // After all processing is done
      setLoading(false);
    } catch (err) {
      console.error("Error fetching team data:", err);
      setError("Failed to load team data: " + err.message);
      setLoading(false);
    }
  }

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

            <div className="flex flex-col items-end">
              <div className="bg-gray-100 rounded-full px-4 py-2 mb-2">
                <span className="text-gray-700 font-medium">
                  {members.filter((m) => m.exists).length} / {team.maxMembers}{" "}
                  Members
                </span>
                {members.filter((m) => m.exists).length < team.maxMembers && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {team.maxMembers - members.filter((m) => m.exists).length}{" "}
                    Positions Available
                  </span>
                )}
              </div>

              {currentUser &&
                !isUserInTeam &&
                members.filter((m) => m.exists).length < team.maxMembers && (
                  <button
                    onClick={handleJoinTeam}
                    disabled={isJoiningTeam}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {isJoiningTeam ? "Sending Request..." : "Apply to Join"}
                  </button>
                )}

              {isUserInTeam && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  You're a member
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {joinSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Join request sent successfully! Please wait for the team leader to review your request.
            </div>
          )}

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

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-[#0C0950] mb-4">Team Members</h2>
            
            <div className="space-y-4">
              {members.map((member, index) => (
                <div
                  key={index}
                  className={`flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    member.exists
                      ? "border-gray-200"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <h3
                        className={`font-medium text-lg ${
                          member.exists ? "text-[#0C0950]" : "text-green-700"
                        }`}
                      >
                        {member.exists ? member.profile?.name : "Open Position"}
                      </h3>
                      <span
                        className={`ml-2 text-xs font-semibold px-2 py-1 rounded capitalize ${
                          member.exists
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {member.exists ? member.role : "Vacant"}
                      </span>
                      {!member.exists && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Join Now
                        </span>
                      )}
                    </div>

                    {member.profile && (
                      <>
                        <p
                          className={`mt-1 ${
                            member.exists ? "text-gray-600" : "text-green-600"
                          }`}
                        >
                          {member.exists
                            ? member.profile.bio || "No bio available"
                            : "This position is available for a new team member."}
                        </p>

                        {member.exists &&
                          member.profile.skills &&
                          member.profile.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {member.profile.skills
                                .slice(0, 3)
                                .map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {member.profile.skills.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{member.profile.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                        <div className="mt-2">
                          {!member.exists && (
                            <button
                              onClick={handleJoinTeam}
                              disabled={isJoiningTeam}
                              className="text-sm bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              {isJoiningTeam ? "Sending Request..." : "Apply to Join"}
                            </button>
                          )}

                          {member.exists && (
                            <Link
                              to={`/profile/${member.userId}`}
                              className="text-sm text-[#261FB3] hover:text-[#161179] font-medium"
                            >
                              View Profile
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {member.exists && member.joinedAt ? (
                    <div className="text-xs text-gray-500">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-xs text-green-500 font-medium">
                      Available
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Join Team Button */}
            {currentUser && !isUserInTeam && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleJoinTeam}
                  disabled={isJoiningTeam}
                  className={`bg-[#261FB3] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#161179] transition-colors ${
                    isJoiningTeam ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isJoiningTeam ? "Sending Request..." : "Apply to Join"}
                </button>
              </div>
            )}

            {/* Manage Requests Button for Leaders */}
            {isUserInTeam && userRole === "leader" && (
              <div className="mt-6 flex justify-center">
                <Link
                  to={`/team/${teamId}/requests`}
                  className="bg-[#FBE4D6] text-[#0C0950] px-6 py-3 rounded-lg font-medium hover:bg-[#f5d5c3] transition-colors"
                >
                  Manage Join Requests
                </Link>
              </div>
            )}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamDetailPage;
