const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Cloud function that triggers when a user account is deleted from Firebase Auth
 * This ensures that even if a user is deleted directly from the Firebase console,
 * their data is still properly cleaned up from teams and vacancies are created
 */
exports.cleanupDeletedUser = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  console.log(`User account deleted: ${userId}. Processing teams...`);

  try {
    // Delete user profile document
    const userRef = admin.firestore().collection("users").doc(userId);
    await userRef.delete();
    console.log(`Deleted user profile document for ${userId}`);

    // Find all teams that the user is a member of
    const teamsSnapshot = await admin
      .firestore()
      .collection("teams")
      .where("members", "array-contains", { userId })
      .get();

    if (teamsSnapshot.empty) {
      console.log(`User ${userId} was not a member of any teams.`);
      return null;
    }

    // Process each team to mark the user as deleted or delete the team if leader with no other members
    const updatePromises = teamsSnapshot.docs.map(async (teamDoc) => {
      const team = teamDoc.data();
      const teamRef = teamDoc.ref;

      // Find the member with matching userId
      const memberIndex = team.members.findIndex(
        (member) => member.userId === userId
      );

      if (memberIndex >= 0) {
        const memberToModify = team.members[memberIndex];

        // Check if this user is the leader
        if (memberToModify.role === "leader") {
          // Get other active members (not marked as deleted)
          const otherActiveMembers = team.members.filter(
            (member) => member.userId !== userId && !member.isDeleted
          );

          if (otherActiveMembers.length > 0) {
            // Promote the first active member to leader
            const newLeader = {
              ...otherActiveMembers[0],
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

            // Update team document with modified members array
            await teamRef.update({ members: updatedMembers });

            // Get active member count after update for logging
            const activeCount = updatedMembers.filter(
              (m) => !m.isDeleted
            ).length;
            console.log(
              `User ${userId} was a leader in team ${teamDoc.id}. Promoted ${newLeader.userId} to leader. Active members: ${activeCount}/${team.maxMembers}`
            );
          } else {
            // No other active members, delete the team
            await teamRef.delete();
            console.log(
              `Deleted team ${teamDoc.id} since leader ${userId} was deleted and no other active members exist`
            );
            return; // Skip further processing for this team
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

          await teamRef.update({ members: updatedMembers });

          // Get active member count after update for logging
          const activeCount = updatedMembers.filter((m) => !m.isDeleted).length;
          console.log(
            `Created vacancy for user ${userId} in team ${teamDoc.id}. Active members: ${activeCount}/${team.maxMembers}`
          );
        }
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);
    console.log(`Successfully processed teams for deleted user: ${userId}`);
    return null;
  } catch (error) {
    console.error("Error handling deleted user data:", error);
    return null;
  }
});

/**
 * Scheduled cloud function that runs daily to clean up teams without active leaders
 * This ensures that if a leader is deleted but the team wasn't properly cleaned up,
 * it will be removed or fixed automatically
 */
exports.scheduledTeamCleanup = functions.pubsub
  .schedule("0 0 * * *") // Run at midnight every day
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("Running scheduled team cleanup...");

    try {
      // Get all teams
      const teamsSnapshot = await admin.firestore().collection("teams").get();

      if (teamsSnapshot.empty) {
        console.log("No teams found to process.");
        return null;
      }

      const cleanupPromises = teamsSnapshot.docs.map(async (teamDoc) => {
        const team = teamDoc.data();
        const teamRef = teamDoc.ref;

        // Skip teams without members
        if (!team.members || team.members.length === 0) {
          console.log(
            `Team ${teamDoc.id} has no members. Marking for deletion.`
          );
          await teamRef.delete();
          return;
        }

        // Check if team has an active leader
        const activeMembers = team.members.filter(
          (member) => !member.isDeleted
        );
        const hasActiveLeader = activeMembers.some(
          (member) => member.role === "leader"
        );

        if (!hasActiveLeader) {
          // No active leader, check if there are any active members to promote
          if (activeMembers.length > 0) {
            // Promote the first active member to leader
            const newLeader = {
              ...activeMembers[0],
              role: "leader",
              promotedAt: new Date().toISOString(),
            };

            // Update members array with the new leader
            const updatedMembers = team.members.map((member) => {
              if (member.userId === newLeader.userId) {
                return newLeader;
              }
              return member;
            });

            await teamRef.update({ members: updatedMembers });
            console.log(
              `Team ${teamDoc.id} had no active leader. Promoted ${newLeader.userId} to leader.`
            );
          } else {
            // No active members at all, delete the team
            await teamRef.delete();
            console.log(
              `Deleted team ${teamDoc.id} since it had no active leader or members.`
            );
          }
        }
      });

      await Promise.all(cleanupPromises);
      console.log("Team cleanup completed successfully.");
      return null;
    } catch (error) {
      console.error("Error during scheduled team cleanup:", error);
      return null;
    }
  });
