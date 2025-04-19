import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

function TeamJoinRequestsPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [team, setTeam] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    async function fetchTeamAndRequests() {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        // Fetch team data
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (!teamDoc.exists()) {
          setError("Team not found");
          return;
        }

        const teamData = { id: teamDoc.id, ...teamDoc.data() };
        setTeam(teamData);

        // Check if current user is the team leader
        const userMember = teamData.members.find(
          (member) => member.userId === currentUser.uid && !member.isDeleted
        );
        const isUserLeader = userMember?.role === "leader";
        setIsLeader(isUserLeader);

        if (!isUserLeader) {
          setError("Only team leaders can manage join requests");
          return;
        }

        // Fetch join requests for this team
        const requestsQuery = query(
          collection(db, "joinRequests"),
          where("teamId", "==", teamId),
          where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        const requests = [];
        for (const requestDoc of requestsSnapshot.docs) {
          const requestData = requestDoc.data();
          // Fetch user profile for each request
          const userDoc = await getDoc(doc(db, "users", requestData.userId));
          if (userDoc.exists()) {
            requests.push({
              id: requestDoc.id,
              ...requestData,
              userProfile: { id: userDoc.id, ...userDoc.data() },
            });
          }
        }
        
        setJoinRequests(requests);
      } catch (err) {
        console.error("Error fetching team and requests:", err);
        setError("Failed to load team data: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamAndRequests();
  }, [teamId, currentUser, navigate]);

  const handleAcceptRequest = async (requestId, userId) => {
    try {
      // Check if team has space
      const activeMembers = team.members.filter(member => !member.isDeleted);
      if (activeMembers.length >= team.maxMembers) {
        throw new Error("Team is already at maximum capacity");
      }

      // Update team members
      const updatedMembers = [
        ...team.members,
        {
          userId,
          role: "member",
          joinedAt: new Date().toISOString(),
          isDeleted: false,
        },
      ];

      await updateDoc(doc(db, "teams", teamId), {
        members: updatedMembers,
      });

      // Update request status
      await updateDoc(doc(db, "joinRequests", requestId), {
        status: "accepted",
        respondedAt: new Date().toISOString(),
      });

      // Remove the accepted request from state
      setJoinRequests(requests => 
        requests.filter(request => request.id !== requestId)
      );

      // Refresh team data
      const teamDoc = await getDoc(doc(db, "teams", teamId));
      setTeam({ id: teamDoc.id, ...teamDoc.data() });
    } catch (err) {
      console.error("Error accepting request:", err);
      setError(err.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, "joinRequests", requestId), {
        status: "rejected",
        respondedAt: new Date().toISOString(),
      });

      // Remove the rejected request from state
      setJoinRequests(requests => 
        requests.filter(request => request.id !== requestId)
      );
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#261FB3] mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!isLeader) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Only team leaders can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#0C0950] mb-6">
            Join Requests for {team.name}
          </h1>

          {joinRequests.length === 0 ? (
            <p className="text-gray-600">No pending join requests.</p>
          ) : (
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg text-[#0C0950]">
                        {request.userProfile.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {request.userProfile.bio}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {request.userProfile.skills?.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id, request.userId)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamJoinRequestsPage; 