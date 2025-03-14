import React, { useEffect, useState } from "react";
import axios from "axios";

function ViewHeats() {
  const [heats, setHeats] = useState([]);
  const [error, setError] = useState(null);
  const [currentHeat, setCurrentHeat] = useState(null); // heat being scored
  const [modalOpen, setModalOpen] = useState(false);
  const [scoreInputs, setScoreInputs] = useState({}); // { index: placement }
  const [allScored, setAllScored] = useState(false);

  // Fetch heats on mount
  useEffect(() => {
    fetchHeats();
  }, []);

  // Check if all heats have been scored (i.e. each heat has a non-empty results array)
  useEffect(() => {
    if (heats.length > 0 && heats.every((heat) => heat.results && heat.results.length > 0)) {
      setAllScored(true);
    } else {
      setAllScored(false);
    }
  }, [heats]);

  const fetchHeats = async () => {
    try {
      const response = await axios.get("/api/heats");
      setHeats(response.data.heats || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const openModalForHeat = (heat) => {
    setCurrentHeat(heat);
    // Assume that each heat has a "racers" field (an array of racer names) from the generate endpoint.
    // Initialize an input for each racer using its index.
    const inputs = {};
    if (heat.racers && heat.racers.length > 0) {
      heat.racers.forEach((_, idx) => {
        inputs[idx] = ""; // empty string, user enters placement
      });
    }
    setScoreInputs(inputs);
    setModalOpen(true);
  };

  const handleScoreChange = (key, value) => {
    setScoreInputs((prev) => ({ ...prev, [key]: value }));
  };

  const submitScore = async () => {
    // Build a results array from the scoreInputs.
    // Since our formatted heat only has an array of racer names (not IDs),
    // we'll use the index as a surrogate.
    // In a production app, your generate endpoint should return racer IDs.
    const results = [];
    Object.keys(scoreInputs).forEach((key) => {
      const placement = parseInt(scoreInputs[key]);
      if (!isNaN(placement)) {
        results.push({ racer: key, placement });
      }
    });

    try {
      await axios.post("/api/heats/score", { heatId: currentHeat._id, results });
      // Refresh heats list and close modal
      fetchHeats();
      setModalOpen(false);
      setCurrentHeat(null);
    } catch (err) {
      alert("Error scoring heat: " + err.message);
    }
  };

  const generateBrackets = () => {
    // Placeholder for generating brackets logic
    alert("Generate Brackets button clicked. (Implement bracket generation logic.)");
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="container py-5">
        <h2 className="text-white fw-bold mb-4 text-center">Heats</h2>
        {error && <p className="text-danger">{error}</p>}
        <div className="row">
          {heats.map((heat, index) => (
            <div key={heat._id} className="col-md-4 mb-4">
              <div className="card bg-dark text-white">
                <div className="card-body">
                  <h5 className="card-title">{heat.heatName}</h5>
                  <p className="card-text">Round: {heat.round}</p>
                  {heat.results && heat.results.length > 0 ? (
                    <p className="card-text">Scored</p>
                  ) : (
                    <p className="card-text">Not scored yet</p>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => openModalForHeat(heat)}>
                    Run Heat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {allScored && (
          <div className="text-center mt-4">
            <button className="btn btn-success btn-lg" onClick={generateBrackets}>
              Generate Brackets
            </button>
          </div>
        )}
      </div>

      {/* Modal for scoring a heat */}
      {modalOpen && currentHeat && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header border-0">
                <h5 className="modal-title">Score {currentHeat.heatName}</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                {currentHeat.racers && currentHeat.racers.length > 0 ? (
                  currentHeat.racers.map((racer, idx) => (
                    <div key={idx} className="mb-3">
                      <label className="form-label">
                        {racer} - Placement:
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={scoreInputs[idx]}
                        onChange={(e) => handleScoreChange(idx, e.target.value)}
                      />
                    </div>
                  ))
                ) : (
                  <p>No racer data available.</p>
                )}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-primary" onClick={submitScore}>
                  Submit Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewHeats;
