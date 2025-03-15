// src/components/ViewBrackets.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Bracket } from "react-tournament-bracket"; // Using react-tournament-bracket

// Conversion function for Winners Bracket
function convertWinnersToReactBracket(winnersBracket) {
  return {
    rounds: winnersBracket.map(round => ({
      title: `Winners Round ${round.round}`,
      seeds: round.matchups.map(match => ({
        id: match.matchId,
        teams: [
          {
            name: match.racer1
              ? `#${match.racer1.seed} ${match.racer1.firstName} ${match.racer1.lastName}`
              : "TBD",
          },
          {
            name: match.racer2
              ? `#${match.racer2.seed} ${match.racer2.firstName} ${match.racer2.lastName}`
              : "TBD",
          },
        ],
      })),
    })),
  };
}

// Conversion function for Losers Bracket
function convertLosersToReactBracket(losersBracket) {
  return {
    rounds: losersBracket.map(lbRound => ({
      title: `Losers Round ${lbRound.round}`,
      seeds: lbRound.matchups.map(match => {
        const p1 = match.participants && match.participants[0];
        const p2 = match.participants && match.participants[1];

        const name1 = p1
          ? p1.source
            ? `From ${p1.source} (M#${p1.matchIndex + 1})`
            : "TBD"
          : "TBD";

        const name2 = p2
          ? p2.source
            ? `From ${p2.source} (M#${p2.matchIndex + 1})`
            : "TBD"
          : "TBD";

        return {
          id: match.matchupId,
          teams: [
            { name: name1 },
            { name: name2 },
          ],
        };
      }),
    })),
  };
}

function ViewBrackets() {
  const { gpId } = useParams();
  const [winnersData, setWinnersData] = useState(null);
  const [losersData, setLosersData] = useState(null);
  const [finalsData, setFinalsData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch bracket data when component mounts.
  useEffect(() => {
    async function fetchBracket() {
      try {
        const response = await axios.post("/api/bracket/generateFull", { grandPrixId: gpId });
        const bracket = response.data.bracket;
        if (!bracket) {
          setError("No bracket data found.");
          setLoading(false);
          return;
        }
        // Convert winners and losers bracket into react-tournament-bracket format.
        const winnersBracket = convertWinnersToReactBracket(bracket.winnersBracket);
        const losersBracket = convertLosersToReactBracket(bracket.losersBracket);

        setWinnersData(winnersBracket);
        setLosersData(losersBracket);
        setFinalsData(bracket.finals);
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
  if (!winnersData || !losersData)
    return (
      <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>
        No bracket data available.
      </div>
    );

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#fff", padding: "1rem" }}>
      <h2 className="text-center mb-4">Double Elimination Bracket</h2>
      <div
        style={{
          display: "flex",
          gap: "2rem",
          overflowX: "auto", // Horizontal scroll to see entire bracket
          paddingBottom: "1rem",
        }}
      >
        {/* Winners Bracket */}
        <div style={{ minWidth: "600px" }}>
          <h3 className="text-center">Winners Bracket</h3>
          <Bracket rounds={winnersData.rounds} />
        </div>

        {/* Losers Bracket */}
        <div style={{ minWidth: "600px" }}>
          <h3 className="text-center">Losers Bracket</h3>
          <Bracket rounds={losersData.rounds} />
        </div>
      </div>

      {/* Finals Section */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <h3>Finals</h3>
        {finalsData && finalsData.championship && (
          <div style={{ marginTop: "1rem" }}>
            <strong>Championship Match:</strong>
            <div>TBD or show the actual racers</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewBrackets;
