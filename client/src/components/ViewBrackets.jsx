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
        const response = await axios.post("/api/bracket/generateFull", {
          grandPrixId: gpId,
        });
        console.log("Fetched bracket data:", response.data.bracket);
        setBracketData(response.data.bracket);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bracket:", err);
        setError(err.message);
        setLoading(false);
      }
    }
    fetchBracket();
  }, [gpId]);

  // Once bracketData is loaded and bracketsViewer is available, render the bracket
  useEffect(() => {
    if (bracketData && window.bracketsViewer) {
      const { participants, stages, matches, matchGames } = bracketData;
      window.bracketsViewer.render(
        {
          participants,
          stages,
          matches,
          matchGames,
        },
        "#bracket-container"
      );
    }
  }, [bracketData]);

  if (loading)
    return <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>Loading bracket...</div>;
  if (error)
    return <div style={{ color: "red", textAlign: "center", padding: "2rem" }}>Error: {error}</div>;
  if (!bracketData)
    return <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>No bracket data found.</div>;

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#fff", padding: "1rem" }}>
      <h2 className="text-center mb-4">Double Elimination Bracket</h2>
      {/* The brackets-viewer will render into this container */}
      <div id="bracket-container" style={{ overflowX: "auto" }} />
    </div>
  );
}

export default ViewBrackets;
