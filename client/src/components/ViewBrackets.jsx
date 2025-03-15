// src/components/ViewBrackets.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ViewBrackets() {
  const { gpId } = useParams();
  const [bracketData, setBracketData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch bracket data when component mounts.
  useEffect(() => {
    const fetchBracket = async () => {
      try {
        // If a bracket already exists for this GP, you could use a GET route.
        // For simplicity, here we call the generateFull route to generate/fetch the bracket.
        const response = await axios.post("/api/bracket/generateFull", { grandPrixId: gpId });
        setBracketData(response.data.bracket);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bracket:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchBracket();
  }, [gpId]);

  if (loading) return <div className="text-white text-center py-5">Loading bracket...</div>;
  if (error) return <div className="text-danger text-center py-5">{error}</div>;
  if (!bracketData) return <div className="text-white text-center py-5">No bracket data found.</div>;

  return (
    <div className="min-vh-100" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="container py-5">
        <h2
          className="text-white fw-bold mb-4 text-center"
          style={{ textShadow: "4px 4px 8px rgba(0,0,0,0.9)" }}
        >
          {bracketData.grandPrix.name} – Double-Elimination Bracket
        </h2>

        <div className="row">
          {/* Winners Bracket */}
          <div className="col-md-6">
            <h4 className="text-white">Winners Bracket</h4>
            {bracketData.winnersBracket.map((round, rIndex) => (
              <div key={rIndex} className="mb-3">
                <h5 className="text-white">Round {round.round}</h5>
                {round.matchups.map((matchup, mIndex) => (
                  <div
                    key={mIndex}
                    className="p-2 mb-2"
                    style={{ border: "1px solid #fff", borderRadius: "4px" }}
                  >
                    <div className="text-white">
                      <strong>{matchup.matchName}</strong>
                    </div>
                    <div className="text-white">
                      {matchup.racer1
                        ? `${matchup.racer1.firstName} ${matchup.racer1.lastName.charAt(0)}.`
                        : "TBD"}
                    </div>
                    <div className="text-white">
                      {matchup.racer2
                        ? `${matchup.racer2.firstName} ${matchup.racer2.lastName.charAt(0)}.`
                        : "TBD"}
                    </div>
                    <div className="text-white">
                      Winner: {matchup.winner ? (matchup.winner.firstName ? `${matchup.winner.firstName} ${matchup.winner.lastName.charAt(0)}.` : matchup.winner) : "Pending"}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Losers Bracket */}
          <div className="col-md-6">
            <h4 className="text-white">Losers Bracket</h4>
            {bracketData.losersBracket.map((round, rIndex) => (
              <div key={rIndex} className="mb-3">
                <h5 className="text-white">Round {round.round}</h5>
                {round.matchups.map((matchup, mIndex) => (
                  <div
                    key={mIndex}
                    className="p-2 mb-2"
                    style={{ border: "1px solid #fff", borderRadius: "4px" }}
                  >
                    <div className="text-white">
                      <strong>{matchup.matchupId}</strong>
                    </div>
                    <div className="text-white">
                      Participant 1:{" "}
                      {matchup.participants && matchup.participants[0]
                        ? matchup.participants[0].source
                          ? `From ${matchup.participants[0].source}`
                          : "TBD"
                        : "TBD"}
                    </div>
                    <div className="text-white">
                      Participant 2:{" "}
                      {matchup.participants && matchup.participants[1]
                        ? matchup.participants[1].source
                          ? `From ${matchup.participants[1].source}`
                          : "TBD"
                        : "TBD"}
                    </div>
                    <div className="text-white">
                      Winner: {matchup.winner ? matchup.winner : "Pending"}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Finals Section */}
        <div className="mt-4">
          <h4 className="text-white text-center">Finals</h4>
          <div className="row">
            <div className="col-md-6">
              <div
                className="p-2 mb-2"
                style={{ border: "1px solid #fff", borderRadius: "4px" }}
              >
                <h5 className="text-white text-center">Championship Match</h5>
                <div className="text-white text-center">
                  {bracketData.finals.championship.match.racer1 ? "TBD" : "TBD"}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div
                className="p-2 mb-2"
                style={{ border: "1px solid #fff", borderRadius: "4px" }}
              >
                <h5 className="text-white text-center">Third Place</h5>
                <div className="text-white text-center">
                  {bracketData.finals.thirdPlace.match.racer1 ? "TBD" : "TBD"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewBrackets;
