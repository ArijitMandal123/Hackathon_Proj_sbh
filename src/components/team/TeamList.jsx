import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getTeamsWithVacancies } from "../../utils/userCleanup";

function TeamList({ hackathonId, onTeamJoined }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userTeams, setUserTeams] = useState([]);
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [showVacanciesOnly, setShowVacanciesOnly] = useState(false);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [userInHackathonTeam, setUserInHackathonTeam] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [hackathonId, currentUser]);

  useEffect(() => {
    // Apply filtering whenever teams or filter state changes
    if (showVacanciesOnly) {
      setFilteredTeams(
        teams.filter((team) => {
          // Check for actual vacancies by comparing member count to max members
          const activeMembers = team.members.filter((member) => {
            // Consider members without isDeleted flag as active
            return !member.isDeleted;
          });
          return activeMembers.length < team.maxMembers;
        })
      );
    } else {
      setFilteredTeams(teams);
    }
  }, [teams, showVacanciesOnly]);

  // Check if user is already in any team for this hackathon
  const checkUserInHackathonTeam = async () => {
    if (!currentUser) {
      setUserInHackathonTeam(false);
      return false;
    }

    try {
      const teamsQuery = query(
        collection(db, "teams"),
        where("hackathonId", "==", hackathonId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      // Check if user is in any team for this hackathon
      const userInTeam = teamsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .some(
          (team) =>
            team.members &&
            team.members.some(
              (member) => member.userId === currentUser.uid && !member.isDeleted
            )
        );

      setUserInHackathonTeam(userInTeam);
      return userInTeam;
    } catch (err) {
      console.error("Error checking if user is in hackathon team:", err);
      return false;
    }
  };

  async function fetchTeams() {
    try {
      // Fetch teams for this hackathon
      const teamsQuery = query(
        collection(db, "teams"),
        where("hackathonId", "==", hackathonId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      const teamsData = teamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Process teams to check for deleted users
      const processedTeams = await Promise.all(
        teamsData.map(async (team) => {
          if (!team.members || team.members.length === 0) {
            return team;
          }

          // Check each member to see if their account still exists
          const processedMembers = await Promise.all(
            team.members.map(async (member) => {
              try {
                const userDoc = await getDoc(doc(db, "users", member.userId));
                if (userDoc.exists()) {
                  return { ...member, isDeleted: false };
                } else {
                  return { ...member, isDeleted: true };
                }
              } catch (err) {
                console.error(`Error checking member ${member.userId}:`, err);
                return { ...member, isDeleted: false };
              }
            })
          );

          return { ...team, members: processedMembers };
        })
      );

      // Filter out teams with no active leader
      const teamsWithActiveLeaders = processedTeams.filter((team) => {
        // Find if there's at least one active leader in the team
        const hasActiveLeader =
          team.members &&
          team.members.some(
            (member) => member.role === "leader" && !member.isDeleted
          );

        // If there's no active leader, log this team as inactive
        if (!hasActiveLeader) {
          console.log(
            `Team ${team.id} has no active leader and will not be displayed`
          );
        }

        return hasActiveLeader;
      });

      setTeams(teamsWithActiveLeaders);

      // Check if user is in any team for this hackathon
      if (currentUser) {
        await checkUserInHackathonTeam();
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError("Failed to load teams: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Add this helper function at the top of the component
  const logTeamStatus = (team, action = "checking") => {
    if (!team || !team.members) return;

    const activeMembers = team.members.filter((m) => !m.isDeleted);
    const maxMembers = team.maxMembers || 4;

    console.log(
      `[${action}] Team ${team.id || team.name}: Active members: ${
        activeMembers.length
      }/${maxMembers}`,
      {
        teamId: team.id,
        teamName: team.name,
        activeMembers: activeMembers.length,
        maxMembers: maxMembers,
        hasVacancy: activeMembers.length < maxMembers,
        totalMembers: team.members.length,
        deletedMembers: team.members.filter((m) => m.isDeleted).length,
      }
    );
  };

  const handleJoinTeam = async (teamId) => {
    if (!currentUser) {
      // Redirect to login with return URL
      navigate(`/login?returnTo=/hackathon/${hackathonId}/teams`);
      return;
    }

    // Double-check if user is already in a team for this hackathon
    const isInTeam = await checkUserInHackathonTeam();
    if (isInTeam) {
      setError(
        "You are already a member of a team in this hackathon. You can only join one team per hackathon."
      );
      return;
    }

    setJoiningTeam(true);
    setError("");

    try {
      const teamRef = doc(db, "teams", teamId);
      const teamSnapshot = await getDoc(teamRef);

      if (!teamSnapshot.exists()) {
        throw new Error("Team not found");
      }

      const team = { ...teamSnapshot.data(), id: teamId };

      // Log team status before processing
      logTeamStatus(team, "before join");

      // First, check if the user is already a member of this specific team (even if marked as deleted)
      const existingMember =
        team.members &&
        team.members.find((member) => member.userId === currentUser.uid);

      if (existingMember) {
        if (!existingMember.isDeleted) {
          throw new Error("You are already a member of this team");
        } else {
          // User was previously a member but marked as deleted, reactivate their membership
          console.log(
            `Reactivating previously deleted member in team ${team.id}`
          );
          const updatedMembers = team.members.map((member) => {
            if (member.userId === currentUser.uid) {
              return {
                ...member,
                isDeleted: false,
                role: "member", // Reset to member role
                joinedAt: new Date().toISOString(),
                rejoined: true,
              };
            }
            return member;
          });

          await updateDoc(teamRef, {
            members: updatedMembers,
          });

          logTeamStatus(
            { ...team, members: updatedMembers },
            "after reactivation"
          );

          // Update state to reflect changes
          await fetchTeams();
          setUserInHackathonTeam(true);
          if (onTeamJoined) onTeamJoined(teamId);
          return; // Exit early as we've already handled the join
        }
      }

      // After checking if user is not already a member of this team
      // Get active members (non-deleted)
      const activeMembers = team.members
        ? team.members.filter((member) => !member.isDeleted)
        : [];
      const maxMembers = team.maxMembers || 4; // Default to 4 if maxMembers is missing

      // Check if team has space for new members
      if (activeMembers.length >= maxMembers) {
        throw new Error(
          `Team is full. No more members can join. (${activeMembers.length}/${maxMembers})`
        );
      }

      // Find deleted members that could be reused as vacant positions
      const vacantPositions = team.members
        ? team.members.filter((member) => member.isDeleted)
        : [];
      console.log(
        `Found ${vacantPositions.length} vacant positions in team ${team.id}`
      );

      // If there are deleted members, reuse a vacant position if available
      const vacantPosition =
        vacantPositions.length > 0 ? vacantPositions[0] : null;

      if (vacantPosition) {
        console.log(
          `Using vacant position previously held by user ${vacantPosition.userId}`
        );
        // Reuse the vacant position by updating it with the new member info
        const updatedMembers = team.members.map((member) => {
          if (member.userId === vacantPosition.userId && member.isDeleted) {
            return {
              userId: currentUser.uid,
              role: "member",
              joinedAt: new Date().toISOString(),
              isDeleted: false,
              // Add reference to original position for tracking
              replacedUser: vacantPosition.userId,
            };
          }
          return member;
        });

        await updateDoc(teamRef, {
          members: updatedMembers,
        });

        logTeamStatus(
          { ...team, members: updatedMembers },
          "after join (reused position)"
        );
      } else {
        // Add user to team members as normal if no vacant positions
        console.log(`Adding new member position to team ${team.id}`);
        const newMember = {
          userId: currentUser.uid,
          role: "member",
          joinedAt: new Date().toISOString(),
          isDeleted: false,
        };

        const updatedMembers = [...(team.members || []), newMember];

        await updateDoc(teamRef, {
          members: updatedMembers,
        });

        logTeamStatus(
          { ...team, members: updatedMembers },
          "after join (new position)"
        );
      }

      // Update state to reflect changes
      await fetchTeams(); // Refetch all teams with latest data
      setUserInHackathonTeam(true);

      // Show success notification
      setError(""); // Clear any previous errors

      // Notify parent component if callback exists
      if (onTeamJoined) {
        onTeamJoined(teamId);
      }

      // Log successful join
      logTeamStatus({ ...team, members: updatedMembers }, "after join");
    } catch (err) {
      console.error("Error joining team:", err);
      setError(err.message || "Failed to join team");
    } finally {
      setJoiningTeam(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#261FB3]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <p className="text-[#0C0950] text-center">
          No teams have been created for this hackathon yet.
        </p>
        {!currentUser && (
          <div className="mt-4 text-center">
            <p className="text-gray-600 mb-2">Log in to create a team!</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#0C0950]">
          Available Teams
        </h2>
        <div className="flex items-center">
          {currentUser && userInHackathonTeam && (
            <div className="mr-4 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              You are already in a team for this hackathon
            </div>
          )}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-[#261FB3] transition duration-150 ease-in-out"
              checked={showVacanciesOnly}
              onChange={() => setShowVacanciesOnly(!showVacanciesOnly)}
            />
            <span className="ml-2 text-sm text-gray-700">
              Show teams with vacancies only
            </span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => {
          // Check if current user is in this specific team
          const isUserInTeam =
            currentUser && team.members
              ? team.members.some(
                  (member) =>
                    member.userId === currentUser.uid && !member.isDeleted
                )
              : false;

          // Get user's role in this team if they are a member
          const userRole =
            isUserInTeam && currentUser
              ? team.members.find(
                  (member) =>
                    member.userId === currentUser.uid && !member.isDeleted
                )?.role
              : null;

          // Count active members (excluding deleted accounts)
          const activeMembers =
            team.members?.filter((member) => !member.isDeleted) || [];

          // Check if team has vacancy
          const hasVacancy = activeMembers.length < team.maxMembers;

          // Calculate number of vacancies
          const vacancyCount = team.maxMembers - activeMembers.length;

          return (
            <div
              key={team.id}
              className={`bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow ${
                hasVacancy ? "border-green-200" : "border-gray-100"
              }`}
            >
              <h3 className="text-xl font-semibold mb-2 text-[#0C0950]">
                {team.name}
              </h3>

              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {activeMembers.length} / {team.maxMembers} members
                  </span>
                  {hasVacancy && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded ml-2">
                      {vacancyCount}{" "}
                      {vacancyCount === 1 ? "Position" : "Positions"} Available
                    </span>
                  )}
                </div>

                {/* Display members visualization */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {activeMembers.map((member, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-800 border border-blue-200"
                      title={member.role}
                    >
                      {member.role === "leader" ? "👑" : "👤"}
                    </div>
                  ))}
                  {hasVacancy &&
                    Array.from({ length: vacancyCount }, (_, i) => (
                      <div
                        key={`vacancy-${i}`}
                        className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs text-green-800 border border-green-200"
                        title="Open Position"
                      >
                        ➕
                      </div>
                    ))}
                </div>

                {team.skills && team.skills.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Skills:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {team.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {team.skills.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{team.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {team.description}
              </p>

              <div className="flex justify-between items-center">
                <Link
                  to={`/team/${team.id}`}
                  className="text-[#261FB3] hover:text-[#161179] text-sm font-medium"
                >
                  View Details
                </Link>

                {!userInHackathonTeam && hasVacancy && currentUser && (
                  <button
                    onClick={() => handleJoinTeam(team.id)}
                    disabled={joiningTeam}
                    className="bg-[#261FB3] text-white px-4 py-2 rounded text-sm hover:bg-[#161179] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joiningTeam ? "Joining..." : "Join Team"}
                  </button>
                )}

                {isUserInTeam && userRole && (
                  <span className="text-sm text-gray-600">
                    Your Role: <span className="capitalize">{userRole}</span>
                  </span>
                )}

                {currentUser && !isUserInTeam && userInHackathonTeam && (
                  <span className="text-sm text-gray-500">
                    Already in a team
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default TeamList;
