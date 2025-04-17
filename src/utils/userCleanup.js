import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Cleanup user data when an account is deleted
 * This marks the user as deleted in teams rather than removing them completely
 * to create vacancies for new members
 * @param {string} userId - The ID of the user being deleted
 */
export async function cleanupDeletedUserData(userId) {
  try {
    // Find all teams that the user is a member of
    const teamsQuery = query(
      collection(db, "teams"),
      where("members", "array-contains", { userId })
    );

    const teamsSnapshot = await getDocs(teamsQuery);

    // Process each team
    const updatePromises = teamsSnapshot.docs.map(async (teamDoc) => {
      const team = teamDoc.data();
      const teamRef = doc(db, "teams", teamDoc.id);

      // Find the member with matching userId
      const memberIndex = team.members.findIndex(
        (member) => member.userId === userId
      );

      if (memberIndex >= 0) {
        const memberToModify = team.members[memberIndex];

        // If the user was a team leader, promote another member if available
        if (memberToModify.role === "leader" && team.members.length > 1) {
          // Get other active members (not marked as deleted)
          const otherMembers = team.members.filter(
            (member) => member.userId !== userId && !member.isDeleted
          );

          if (otherMembers.length > 0) {
            // Promote the first active member to leader
            const newLeader = {
              ...otherMembers[0],
              role: "leader",
              promotedAt: new Date().toISOString(),
            };

            // Create updated members array: mark the deleted user as deleted and update the new leader
            const updatedMembers = team.members.map((member) => {
              if (member.userId === userId) {
                return {
                  ...member,
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                  // Keep the position but mark it as vacant
                  role: "vacant",
                  // Store the original userId to help with position identification
                  originalUserId: member.userId,
                };
              } else if (member.userId === newLeader.userId) {
                return newLeader;
              } else {
                return member;
              }
            });

            // Update team with modified members array
            await updateDoc(teamRef, { members: updatedMembers });
          }
        } else {
          // Just mark the member as deleted to create a vacancy
          const updatedMembers = team.members.map((member) => {
            if (member.userId === userId) {
              return {
                ...member,
                isDeleted: true,
                deletedAt: new Date().toISOString(),
                // Keep the position but mark it as vacant
                role: "vacant",
                // Store the original userId to help with position identification
                originalUserId: member.userId,
              };
            } else {
              return member;
            }
          });

          // Update team with modified members array
          await updateDoc(teamRef, { members: updatedMembers });
        }
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log(`Successfully created vacancies for deleted user: ${userId}`);
    return true;
  } catch (error) {
    console.error("Error handling deleted user data:", error);
    return false;
  }
}

/**
 * Get teams that have vacancies for users to join
 * @param {string} hackathonId - The ID of the hackathon
 * @returns {Promise<Array>} - Array of teams with vacancies
 */
export async function getTeamsWithVacancies(hackathonId) {
  try {
    const teamsQuery = query(
      collection(db, "teams"),
      where("hackathonId", "==", hackathonId)
    );

    const teamsSnapshot = await getDocs(teamsQuery);

    // Process teams to check for deleted users and calculate real vacancies
    const processedTeams = await Promise.all(
      teamsSnapshot.docs.map(async (doc) => {
        const team = {
          id: doc.id,
          ...doc.data(),
        };

        // Count active members (not deleted)
        const activeMembers = team.members
          ? team.members.filter((m) => !m.isDeleted)
          : [];

        // Check if team has vacancies
        const hasVacancies = activeMembers.length < team.maxMembers;
        const vacancyCount = team.maxMembers - activeMembers.length;

        return {
          ...team,
          activeMembers,
          hasVacancies,
          vacancyCount,
        };
      })
    );

    // Filter teams that have vacancies
    const teamsWithVacancies = processedTeams.filter(
      (team) => team.hasVacancies
    );

    return teamsWithVacancies;
  } catch (error) {
    console.error("Error getting teams with vacancies:", error);
    return [];
  }
}
