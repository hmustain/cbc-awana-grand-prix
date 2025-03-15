import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function HeatResults() {
  const { gpId } = useParams();
  const navigate = useNavigate();

  const [racers, setRacers] = useState([]);
  const [heats, setHeats] = useState([]);
  const [error, setError] = useState(null);

  // We'll store laneStats as an array of { lane: number, totalPlaces: number, count: number }
  // Then compute average = totalPlaces / count
  const [laneStats, setLaneStats] = useState([]);

  useEffect(() => {
    fetchRacers();
    fetchHeats();
  }, [gpId]);

  // 1) Fetch racers for this GP (including their points).
  //    Adjust this route as needed, e.g. /api/racers/gp/:gpId
  const fetchRacers = async () => {
    try {
      const response = await axios.get(`/api/racers/gp/${gpId}`);
      // Sort by descending points (highest first)
      const sorted = (response.data.racers || []).sort(
        (a, b) => b.points - a.points
      );
      setRacers(sorted);
    } catch (err) {
      console.error("Error fetching racers:", err);
      setError(err.message);
    }
  };

  // 2) Fetch all heats for this GP so we can calculate lane averages
  const fetchHeats = async () => {
    try {
      const response = await axios.get(`/api/heats/gp/${gpId}`);
      const fetchedHeats = response.data.heats || [];
      setHeats(fetchedHeats);

      // Compute lane stats
      const stats = computeLaneStats(fetchedHeats);
      setLaneStats(stats);
    } catch (err) {
      console.error("Error fetching heats:", err);
      setError(err.message);
    }
  };

  // Helper to compute lane averages
  // We assume each heat has laneInfo + results
  // For each lane, we sum up the "placement" from the corresponding result
  // and increment the count. Then average = sum / count.
  const computeLaneStats = (heatsData) => {
    // We'll track by lane index 0..3
    const laneTotals = [
      { lane: 0, totalPlaces: 0, count: 0 },
      { lane: 1, totalPlaces: 0, count: 0 },
      { lane: 2, totalPlaces: 0, count: 0 },
      { lane: 3, totalPlaces: 0, count: 0 },
    ];

    heatsData.forEach((heat) => {
      if (!heat.laneInfo || !heat.results) return;

      heat.laneInfo.forEach((laneItem) => {
        // Find the matching result
        const foundResult = heat.results.find((r) => {
          if (!r.racer || !laneItem.racerId) return false;
          return r.racer.toString() === laneItem.racerId.toString();
        });
        if (foundResult) {
          const laneIndex = laneItem.lane; // 0..3
          laneTotals[laneIndex].totalPlaces += foundResult.placement;
          laneTotals[laneIndex].count += 1;
        }
      });
    });

    return laneTotals;
  };

  return (
    <div
      className="min-vh-100"
      style={{
        background: "rgba(0,0,0,0.6)",
      }}
    >
      <div className="container py-5">
        <h2 className="text-white fw-bold mb-4 text-center">Grand Prix Results</h2>
        {error && <p className="text-danger text-center">{error}</p>}

        {/* Button to go back */}
        <div className="text-center mb-4">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/heats/${gpId}`)}
          >
            Back to Heats
          </button>
        </div>

        {/* Racer Results Table */}
        <div
          className="p-3 mb-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "8px" }}
        >
          <h4 className="text-white mb-3">Racer Standings (High to Low)</h4>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-light table-striped table-sm">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Racer</th>
                  <th>Club</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {racers.map((racer, idx) => (
                  <tr key={racer._id}>
                    <td>{idx + 1}</td>
                    <td>
                      {racer.firstName} {racer.lastName}
                    </td>
                    <td>{racer.club}</td>
                    <td>{racer.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lane Averages Table */}
        <div
          className="p-3"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "8px" }}
        >
          <h4 className="text-white mb-3">Lane Averages</h4>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-light table-striped table-sm">
              <thead>
                <tr>
                  <th>Lane</th>
                  <th>Races Run</th>
                  <th>Average Finish</th>
                </tr>
              </thead>
              <tbody>
                {laneStats.map((laneObj) => {
                  const laneNum = laneObj.lane + 1; // Show 1..4 instead of 0..3
                  const avg =
                    laneObj.count > 0
                      ? (laneObj.totalPlaces / laneObj.count).toFixed(2)
                      : "N/A";
                  return (
                    <tr key={laneObj.lane}>
                      <td>{laneNum}</td>
                      <td>{laneObj.count}</td>
                      <td>{avg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeatResults;
