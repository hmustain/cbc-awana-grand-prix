// src/components/HeatResults.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function HeatResults() {
  const { gpId } = useParams();
  const navigate = useNavigate();

  // State for racers (with points), heats, lane stats, and racer averages.
  const [racers, setRacers] = useState([]);
  const [heats, setHeats] = useState([]);
  const [laneStats, setLaneStats] = useState([]);
  // racerAverages: { [racerId]: { avg, count } }
  const [racerAverages, setRacerAverages] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRacers();
    fetchHeats();
  }, [gpId]);

  // 1) Fetch racers for this GP, sort by descending points, assign seeds.
  const fetchRacers = async () => {
    try {
      const response = await axios.get(`/api/racers/gp/${gpId}`);
      // Sort by descending points
      const sorted = (response.data.racers || []).sort(
        (a, b) => b.points - a.points
      );

      // Assign seeds based on sorted order (1 for top seed, etc.)
      for (let i = 0; i < sorted.length; i++) {
        const racer = sorted[i];
        const newSeed = i + 1; // 1-based indexing
        if (racer.seed !== newSeed) {
          await axios.put(`/api/racers/${racer._id}/seed`, { seed: newSeed });
          racer.seed = newSeed; // update local copy as well
        }
      }

      setRacers(sorted);
    } catch (err) {
      console.error("Error fetching racers:", err);
      setError(err.message);
    }
  };

  // 2) Fetch heats and compute lane stats and racer averages.
  const fetchHeats = async () => {
    try {
      const response = await axios.get(`/api/heats/gp/${gpId}`);
      const fetchedHeats = response.data.heats || [];
      setHeats(fetchedHeats);
      console.log("Fetched Heats:", fetchedHeats);

      const laneStatsResult = computeLaneStats(fetchedHeats);
      setLaneStats(laneStatsResult);

      const racerAvgResult = computeRacerAverages(fetchedHeats);
      setRacerAverages(racerAvgResult);
    } catch (err) {
      console.error("Error fetching heats:", err);
      setError(err.message);
    }
  };

  // Helper: Compute lane averages.
  const computeLaneStats = (heatsData) => {
    const laneTotals = [
      { lane: 0, totalPlaces: 0, count: 0 },
      { lane: 1, totalPlaces: 0, count: 0 },
      { lane: 2, totalPlaces: 0, count: 0 },
      { lane: 3, totalPlaces: 0, count: 0 },
    ];
    heatsData.forEach((heat) => {
      if (!heat.laneInfo || !heat.results) return;
      heat.laneInfo.forEach((laneItem) => {
        const foundResult = heat.results.find((r) => {
          if (!r.racer || !laneItem.racerId) return false;
          return r.racer.toString() === laneItem.racerId.toString();
        });
        if (foundResult) {
          const laneIndex = laneItem.lane;
          laneTotals[laneIndex].totalPlaces += foundResult.placement;
          laneTotals[laneIndex].count += 1;
        }
      });
    });
    return laneTotals;
  };

  // Helper: Compute average finishing position and races run per racer.
  const computeRacerAverages = (heatsData) => {
    const stats = {}; // { racerId: { total: number, count: number } }
    heatsData.forEach((heat) => {
      if (!heat.laneInfo || !heat.results) return;
      heat.laneInfo.forEach((laneItem) => {
        const foundResult = heat.results.find((r) => {
          if (!r.racer || !laneItem.racerId) return false;
          return r.racer.toString() === laneItem.racerId.toString();
        });
        if (foundResult) {
          const rId = laneItem.racerId.toString();
          if (!stats[rId]) stats[rId] = { total: 0, count: 0 };
          stats[rId].total += foundResult.placement;
          stats[rId].count += 1;
        }
      });
    });
    const averages = {};
    Object.keys(stats).forEach((rId) => {
      const { total, count } = stats[rId];
      averages[rId] = { avg: count > 0 ? total / count : 0, count };
    });
    return averages;
  };

  // Check if all heats are fully scored.
  const areAllHeatsScored = () => {
    if (heats.length === 0) return false;
    return heats.every((heat) => {
      return heat.results && heat.laneInfo && (heat.results.length === heat.laneInfo.length);
    });
  };

  return (
    <div
      className="min-vh-100"
      style={{
        background: "rgba(0,0,0,0.6)",
      }}
    >
      <div className="container py-5">
        <h2
          className="text-white fw-bold mb-4 text-center"
          style={{ textShadow: "4px 4px 8px rgba(0, 0, 0, 0.9)" }}
        >
          Grand Prix Results
        </h2>
        {error && <p className="text-danger text-center">{error}</p>}

        <div className="text-center mb-4">
          <button
            className="btn btn-danger"
            onClick={() => navigate(`/heats/${gpId}`)}
          >
            Back to Heats
          </button>
        </div>

        {/* Racer Standings Table */}
        <div
          className="p-3 mb-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "8px" }}
        >
          <h4 className="text-white mb-3">Racer Standings</h4>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-light table-striped table-sm">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Racer</th>
                  <th>Club</th>
                  <th>Points</th>
                  <th>Races Run</th>
                  <th>Avg Finish</th>
                </tr>
              </thead>
              <tbody>
                {racers.map((racer, idx) => {
                  const rId = racer._id.toString();
                  const racerStat = racerAverages[rId];
                  const avg =
                    racerStat && racerStat.count > 0 ? racerStat.avg.toFixed(2) : "N/A";
                  const count =
                    racerStat && racerStat.count > 0 ? racerStat.count : "N/A";
                  return (
                    <tr key={racer._id}>
                      <td>{idx + 1}</td>
                      <td>{racer.firstName} {racer.lastName}</td>
                      <td>{racer.club}</td>
                      <td>{racer.points}</td>
                      <td>{count}</td>
                      <td>{avg}</td>
                    </tr>
                  );
                })}
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
                  const laneNum = laneObj.lane + 1;
                  const avg =
                    laneObj.count > 0 ? (laneObj.totalPlaces / laneObj.count).toFixed(2) : "N/A";
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

        {/* Generate/View Brackets Button */}
        {areAllHeatsScored() && (
          <div className="text-center mt-4">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/brackets/${gpId}`)}
            >
              Generate/View Brackets
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HeatResults;
