import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// Helper to format racer name as "FirstName L."
function formatRacerName(racer) {
  if (!racer) return "TBD";
  const firstName = racer.firstName || "";
  const lastInitial = racer.lastName ? racer.lastName.charAt(0) : "";
  return `${firstName} ${lastInitial}.`;
}

function ViewBrackets() {
  const { gpId } = useParams();
  const [bracketData, setBracketData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state for race result
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null); // the match being raced
  const [selectedWinner, setSelectedWinner] = useState(null); // "racer1" or "racer2"

  useEffect(() => {
    async function fetchBracket() {
      try {
        const response = await axios.post("/api/bracket/generateFull", { grandPrixId: gpId });
        setBracketData(response.data.bracket);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchBracket();
  }, [gpId]);

  // Open the modal for a given match
  const openRaceModal = (match) => {
    setCurrentMatch(match);
    setSelectedWinner(null);
    setModalOpen(true);
  };

  // When a user selects a winner in the modal
  const handleWinnerSelect = (winnerKey) => {
    setSelectedWinner(winnerKey);
  };

  // Confirm the race result and update the bracket via backend
  const confirmRaceResult = async () => {
    if (!currentMatch || !selectedWinner || !bracketData?._id) return;
    
    const winnerRacer = currentMatch[selectedWinner];
    const loserKey = selectedWinner === "racer1" ? "racer2" : "racer1";
    const loserRacer = currentMatch[loserKey];

    const body = {
      matchId: currentMatch.matchId,
      winnerId: winnerRacer?._id || null,
      loserId: loserRacer?._id || null,
      nextMatchIdIfWin: currentMatch.nextMatchIdIfWin,
      nextMatchSlot: currentMatch.nextMatchSlot
    };

    try {
      const response = await axios.post(
        `/api/bracket/${bracketData._id}/matchResult`,
        body
      );
      setBracketData(response.data.bracket);
    } catch (err) {
      console.error("Error updating match result:", err);
      alert("Error updating match result: " + err.message);
    }
    setModalOpen(false);
  };

  // Revert match result via backend (only for the match that was clicked)
  const revertRaceResult = async () => {
    if (!currentMatch || !bracketData?._id) return;
    try {
      await axios.delete(`/api/bracket/${bracketData._id}/matchResult`, {
        data: { matchId: currentMatch.matchId }
      });
      // Refetch the bracket to update state.
      const resp = await axios.post("/api/bracket/generateFull", { grandPrixId: gpId });
      setBracketData(resp.data.bracket);
    } catch (err) {
      console.error("Error reverting match result:", err);
      alert("Error reverting match result: " + err.message);
    }
    setModalOpen(false);
  };

  // Check if a match has a winner (based on winner field being set)
  const matchHasWinner = (match) => {
    return !!match.winner;
  };

  // Render a table row for a racer.
  // Always render three columns; the third shows a check mark if a winner is set.
  const renderRacerRow = (match, racer) => {
    const hasWinner = matchHasWinner(match);
    const isWinner = hasWinner && (match.winner === racer?._id);
    return (
      <tr>
        <td>{racer?.seed || ""}</td>
        <td>{racer ? formatRacerName(racer) : "TBD"}</td>
        <td style={{ textAlign: "center" }}>{hasWinner ? (isWinner ? "✓" : "") : ""}</td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-white">
        Loading bracket...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-danger">
        Error: {error}
      </div>
    );
  }

  if (!bracketData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-white">
        No bracket data available.
      </div>
    );
  }

  return (
    <div
      className="min-vh-100"
      style={{
        background: `
          linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
          url('/path/to/your-checkered-background.jpg')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container py-5">
        {/* Page Title */}
        <h2
          className="fw-bold mb-5 text-center text-white"
          style={{ textShadow: "2px 2px 5px rgba(0,0,0,0.8)" }}
        >
          {bracketData.grandPrix.name} - Bracket
        </h2>

        {/* Winners Bracket */}
        <div className="mb-5">
          <h3 className="fw-bold mb-4 text-white" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}>
            Winners Bracket
          </h3>
          {bracketData.winnersBracket.map((round) => (
            <div key={round.round} className="mb-4">
              {/* Restore card title with round and match info */}
              <h4 className="mb-3 text-white" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>
                Round {round.round}
              </h4>
              <div className="row">
                {round.matchups.map((match, index) => (
                  <div key={index} className="col-md-4 mb-4">
                    <div
                      className="h-100 p-3 text-white"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.7)",
                        borderRadius: "8px",
                      }}
                    >
                      {/* Card title includes round and match info */}
                      <h5 className="fw-bold mb-3">Round {round.round} - {match.matchName || `Match ${index + 1}`}</h5>
                      <div style={{ overflowX: "auto" }}>
                        <table className="table table-light table-striped table-sm">
                          <thead>
                            <tr>
                              <th>Seed</th>
                              <th>Racer</th>
                              <th>{match.winner ? "Winner" : ""}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {renderRacerRow(match, match.racer1)}
                            {renderRacerRow(match, match.racer2)}
                          </tbody>
                        </table>
                      </div>
                      <div className="d-flex justify-content-end">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openRaceModal(match)}
                        >
                          Race
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Losers Bracket */}
        <div className="mb-5">
          <h3 className="fw-bold mb-4 text-white" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}>
            Losers Bracket
          </h3>
          {bracketData.losersBracket && bracketData.losersBracket.length > 0 ? (
            bracketData.losersBracket.map((round, i) => (
              <div key={i} className="mb-4">
                <h4 className="mb-3 text-white" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>
                  Round {round.round}
                </h4>
                <div className="row">
                  {round.matchups.map((match, index) => (
                    <div key={index} className="col-md-4 mb-4">
                      <div
                        className="h-100 p-3 text-white"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.7)",
                          borderRadius: "8px",
                        }}
                      >
                        <h5 className="fw-bold mb-3">
                          {match.matchName || `Match ${index + 1}`}
                        </h5>
                        <div style={{ overflowX: "auto" }}>
                          <table className="table table-light table-striped table-sm">
                            <thead>
                              <tr>
                                <th>Seed</th>
                                <th>Racer</th>
                                <th>{match.winner ? "Winner" : ""}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {renderRacerRow(match, match.racer1)}
                              {renderRacerRow(match, match.racer2)}
                            </tbody>
                          </table>
                        </div>
                        <div className="d-flex justify-content-end">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openRaceModal(match)}
                          >
                            Race
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-white">No losers bracket available.</p>
          )}
        </div>

        {/* Finals */}
        <div className="mb-5">
          <h3 className="fw-bold mb-4 text-white" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}>
            Finals
          </h3>
          <div className="row">
            {/* Championship */}
            <div className="col-md-6 mb-4">
              <div
                className="h-100 p-3 text-white"
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: "8px",
                }}
              >
                <h5 className="fw-bold mb-3">Championship</h5>
                <div style={{ overflowX: "auto" }}>
                  <table className="table table-light table-striped table-sm">
                    <thead>
                      <tr>
                        <th>Seed</th>
                        <th>Racer</th>
                        <th>{"Winner"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{bracketData.finals.championship.match.racer1?.seed || ""}</td>
                        <td>{formatRacerName(bracketData.finals.championship.match.racer1)}</td>
                        <td>{bracketData.finals.championship.match.winner === bracketData.finals.championship.match.racer1?._id ? "✓" : ""}</td>
                      </tr>
                      <tr>
                        <td>{bracketData.finals.championship.match.racer2?.seed || ""}</td>
                        <td>{formatRacerName(bracketData.finals.championship.match.racer2)}</td>
                        <td>{bracketData.finals.championship.match.winner === bracketData.finals.championship.match.racer2?._id ? "✓" : ""}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* Third Place */}
            <div className="col-md-6 mb-4">
              <div
                className="h-100 p-3 text-white"
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: "8px",
                }}
              >
                <h5 className="fw-bold mb-3">Third Place</h5>
                <div style={{ overflowX: "auto" }}>
                  <table className="table table-light table-striped table-sm">
                    <thead>
                      <tr>
                        <th>Seed</th>
                        <th>Racer</th>
                        <th>{"Winner"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{bracketData.finals.thirdPlace.match.racer1?.seed || ""}</td>
                        <td>{formatRacerName(bracketData.finals.thirdPlace.match.racer1)}</td>
                        <td>{bracketData.finals.thirdPlace.match.winner === bracketData.finals.thirdPlace.match.racer1?._id ? "✓" : ""}</td>
                      </tr>
                      <tr>
                        <td>{bracketData.finals.thirdPlace.match.racer2?.seed || ""}</td>
                        <td>{formatRacerName(bracketData.finals.thirdPlace.match.racer2)}</td>
                        <td>{bracketData.finals.thirdPlace.match.winner === bracketData.finals.thirdPlace.match.racer2?._id ? "✓" : ""}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Race Modal */}
      {modalOpen && currentMatch && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{currentMatch.matchName} - Race</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <p>Select the winner:</p>
                <div className="list-group">
                  <button
                    className={`list-group-item list-group-item-action ${selectedWinner === "racer1" ? "list-group-item-success" : ""}`}
                    onClick={() => handleWinnerSelect("racer1")}
                  >
                    {currentMatch.racer1 ? formatRacerName(currentMatch.racer1) : "TBD"}
                  </button>
                  <button
                    className={`list-group-item list-group-item-action ${selectedWinner === "racer2" ? "list-group-item-success" : ""}`}
                    onClick={() => handleWinnerSelect("racer2")}
                  >
                    {currentMatch.racer2 ? formatRacerName(currentMatch.racer2) : "TBD"}
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={revertRaceResult}>
                  Revert Result
                </button>
                <button className="btn btn-primary" onClick={confirmRaceResult}>
                  Confirm Winner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewBrackets;
