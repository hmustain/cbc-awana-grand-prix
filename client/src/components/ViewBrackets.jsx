// src/components/ViewBrackets.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BracketsViewer } from "brackets-viewer"; // Import the viewer component

function ViewBrackets() {
  const { gpId } = useParams();
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBracket() {
      try {
        const response = await axios.post("/api/bracket/generateFull", { grandPrixId: gpId });
        // Assuming the backend now returns the bracket in the new format
        const data = response.data.bracket;
        console.dir(data, { depth: null });
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
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        {bracketData.tournamentName || "Tournament Bracket"}
      </h2>
      {/* The BracketsViewer component takes the bracket data as the "data" prop */}
      <BracketsViewer data={bracketData} />
    </div>
  );
}

export default ViewBrackets;
