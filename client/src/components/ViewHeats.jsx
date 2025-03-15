import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ViewHeats() {
  const { gpId } = useParams();
  const [heats, setHeats] = useState([]);
  const [gpName, setGpName] = useState("");
  const [error, setError] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0); // which heat are we scoring?
  const [scoreInputs, setScoreInputs] = useState({}); // { racerId: placement }

  useEffect(() => {
    fetchGPName();
    fetchHeatsForGP();
  }, [gpId]);

  // Fetch the Grand Prix name
  const fetchGPName = async () => {
    try {
      const response = await axios.get(`/api/grandprix/${gpId}`);
      const gp = response.data.grandPrix;
      setGpName(gp.name);
    } catch (err) {
      console.error("Error fetching GP name:", err);
    }
  };

  // Fetch only the heats for this GP
  const fetchHeatsForGP = async () => {
    try {
      const response = await axios.get(`/api/heats/gp/${gpId}`);
      setHeats(response.data.heats || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Open the modal for a specific heat index
  const openModalForHeat = (index) => {
    setCurrentHeatIndex(index);
    setScoreInputs({});
    setModalOpen(true);
  };

  // Build the data for the current heat
  const currentHeat = heats[currentHeatIndex];

  // If we have laneInfo from the backend, we can display it in a table
  const laneInfo = currentHeat?.laneInfo || [];

  // Handle changes to the "Place" inputs
  const handlePlaceChange = (racerId, value) => {
    setScoreInputs((prev) => ({
      ...prev,
      [racerId]: value,
    }));
  };

  // Submit the score to the backend
  const handleScoreHeat = async () => {
    if (!currentHeat) return;

    // Build the results array
    // Each object: { racerId, placement }
    const results = laneInfo.map((item) => {
      const placement = parseInt(scoreInputs[item.racerId]) || 0;
      return {
        racerId: item.racerId,
        placement,
      };
    });

    try {
      await axios.post("/api/heats/score", {
        heatId: currentHeat._id,
        results,
      });

      // Refresh heats so we see the updated "Scored" status
      await fetchHeatsForGP();

      // Move to the next heat automatically
      if (currentHeatIndex < heats.length - 1) {
        setCurrentHeatIndex(currentHeatIndex + 1);
        setScoreInputs({});
      } else {
        // If it's the last heat, close the modal
        setModalOpen(false);
      }
    } catch (err) {
      alert("Error scoring heat: " + err.message);
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="container py-5">
        <h2 className="text-white fw-bold mb-4 text-center">
          Heats for {gpName ? gpName : "Grand Prix"}
        </h2>
        {error && <p className="text-danger">{error}</p>}

        {heats.length === 0 ? (
          <p className="text-white text-center">
            No heats generated yet for this Grand Prix.
          </p>
        ) : (
          <div className="row">
            {heats.map((heat, index) => {
              // For display: "Round X - Heat Y"
              const cardTitle = `Round ${heat.round} - Heat ${index + 1}`;
              return (
                <div key={heat._id} className="col-md-4 mb-4">
                  <div className="card bg-dark text-white">
                    <div className="card-body">
                      <h5 className="card-title">{cardTitle}</h5>
                      {/* Table for vertical display: each racer is one row */}
                      <table className="table table-dark table-sm">
                        <thead>
                          <tr>
                            <th>Racer</th>
                            <th>Lane</th>
                          </tr>
                        </thead>
                        <tbody>
                          {heat.laneInfo?.map((item, i) => (
                            <tr key={i}>
                              <td>{item.name}</td>
                              <td>{item.lane}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {heat.results && heat.results.length > 0 ? (
                        <p className="card-text">Scored</p>
                      ) : (
                        <p className="card-text">Not scored yet</p>
                      )}

                      {/* Button to open the scoring modal */}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openModalForHeat(index)}
                      >
                        Run Heat
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for scoring the current heat */}
      {modalOpen && currentHeat && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header border-0">
                <h5 className="modal-title">
                  Round {currentHeat.round} - Heat {currentHeatIndex + 1}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Table with Racer, Lane, Place inputs */}
                <table className="table table-dark table-sm">
                  <thead>
                    <tr>
                      <th>Racer</th>
                      <th>Lane</th>
                      <th>Place</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laneInfo.map((item, idx) => (
                      <tr key={item.racerId}>
                        <td>{item.name}</td>
                        <td>{item.lane}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={scoreInputs[item.racerId] || ""}
                            onChange={(e) =>
                              handlePlaceChange(item.racerId, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-primary" onClick={handleScoreHeat}>
                  Score Heat
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
