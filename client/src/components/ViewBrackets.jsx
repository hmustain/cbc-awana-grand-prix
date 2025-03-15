// src/components/ViewBrackets.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ViewBrackets() {
  const { gpId } = useParams();
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBracket() {
      try {
        console.log("Sending POST /api/bracket/generateFull with grandPrixId:", gpId);
        const response = await axios.post("/api/bracket/generateFull", { grandPrixId: gpId });
        const data = response.data.bracket;
        console.log("Fetched bracket data from server:", data);
        console.log("Participants:", data.participants);
        console.log("Stages:", data.stages);
        console.log("Matches:", data.matches);
        console.log("MatchGames:", data.matchGames);

        setBracketData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bracket:", err);
        setError(err.message);
        setLoading(false);
      }
    }
    fetchBracket();
  }, [gpId]);

  useEffect(() => {
    if (bracketData && window.bracketsViewer) {
      const { participants, stages, matches, matchGames } = bracketData;
      console.log("Calling bracketsViewer.render with:", { participants, stages, matches, matchGames });
      try {
        window.bracketsViewer.render(
          { participants, stages, matches, matchGames },
          "#bracket-container"
        );
      } catch (err) {
        console.error("Error rendering bracket viewer:", err);
      }
    }
  }, [bracketData]);

  if (loading)
    return (
      <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>
        Loading bracket...
      </div>
    );
  if (error)
    return (
      <div style={{ color: "red", textAlign: "center", padding: "2rem" }}>
        Error: {error}
      </div>
    );
  if (!bracketData)
    return (
      <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>
        No bracket data available.
      </div>
    );

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#fff", padding: "1rem" }}>
      <h2 className="text-center mb-4">
        {bracketData.grandPrix.name} – Double Elimination Bracket
      </h2>
      {/* This is the container where bracketsViewer will render the bracket */}
      <div id="bracket-container" style={{ overflowX: "auto" }} />
    </div>
  );
}

export default ViewBrackets;
