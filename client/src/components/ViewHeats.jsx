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
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0);
  const [scoreInputs, setScoreInputs] = useState({});

  useEffect(() => {
    fetchGPName();
    fetchHeatsForGP();
  }, [gpId]);

  const fetchGPName = async () => {
    try {
      const response = await axios.get(`/api/grandprix/${gpId}`);
      setGpName(response.data.grandPrix.name);
    } catch (err) {
      console.error("Error fetching GP name:", err);
    }
  };

  const fetchHeatsForGP = async () => {
    try {
      const response = await axios.get(`/api/heats/gp/${gpId}`);
      setHeats(response.data.heats || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const openModalForHeat = (index) => {
    setCurrentHeatIndex(index);
    setScoreInputs({});
    setModalOpen(true);
  };

  const currentHeat = heats[currentHeatIndex];
  const laneInfo = currentHeat?.laneInfo || [];

  const handlePlaceChange = (racerId, value) => {
    setScoreInputs((prev) => ({
      ...prev,
      [racerId]: value,
    }));
  };

  const handleScoreHeat = async () => {
    if (!currentHeat) return;

    const results = laneInfo.map((item) => {
      const placement = parseInt(scoreInputs[item.racerId]) || 0;
      return { racerId: item.racerId, placement };
    });

    try {
      await axios.post("/api/heats/score", {
        heatId: currentHeat._id,
        results,
      });

      // Refresh the heats
      await fetchHeatsForGP();

      // Move to the next heat automatically
      if (currentHeatIndex < heats.length - 1) {
        setCurrentHeatIndex(currentHeatIndex + 1);
        setScoreInputs({});
      } else {
        // Last heat => close modal
        setModalOpen(false);
      }
    } catch (err) {
      alert("Error scoring heat: " + err.message);
    }
  };

  return (
    <div
      className="min-vh-100"
      style={{
        // Dimmed background image + optional overlay for darkening
        background: `
          linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), 
          url('/path/to/your-background.jpg')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container py-5">
        {/* Heading with text shadow */}
        <h2
          className="fw-bold mb-4 text-center text-white"
          style={{
            textShadow: "2px 2px 5px rgba(0,0,0,0.8)",
          }}
        >
          Heats for {gpName || "Grand Prix"}
        </h2>

        {error && <p className="text-danger text-center">{error}</p>}

        {heats.length === 0 ? (
          <p className="text-white text-center">
            No heats generated yet for this Grand Prix.
          </p>
        ) : (
          <div className="row">
            {heats.map((heat, index) => {
              const cardTitle = heat.heatName;
              const isScored = heat.results && heat.results.length > 0;

              return (
                <div key={heat._id} className="col-md-4 mb-4">
                  {/* Translucent card */}
                  <div
                    className="h-100 p-3 text-white"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.7)",
                      borderRadius: "8px",
                    }}
                  >
                    <h5 className="fw-bold mb-3">{cardTitle}</h5>
                    <div style={{ overflowX: "auto" }}>
                      <table className="table table-light table-striped table-sm">
                        <thead>
                          <tr>
                            <th>Racer</th>
                            <th>Lane</th>
                            {isScored && <th>Place</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {heat.laneInfo?.map((item, i) => {
                            const shortName = item.name.split(" - ")[0];
                            const laneDisplay = item.lane + 1;

                            // If scored, find the racer's place
                            let place = "";
                            if (isScored) {
                              const foundResult = heat.results.find((r) => {
                                if (!r.racer || !item.racerId) return false;
                                return (
                                  r.racer.toString() === item.racerId.toString()
                                );
                              });
                              place = foundResult?.placement || "";
                            }

                            return (
                              <tr key={i}>
                                <td>{shortName}</td>
                                <td>{laneDisplay}</td>
                                {isScored && <td>{place}</td>}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        className="btn btn-danger btn-sm"
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
            <div className="modal-content bg-light text-dark">
              <div className="modal-header border-0">
                <h5 className="modal-title">{currentHeat.heatName}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <table className="table table-light table-sm">
                  <thead>
                    <tr>
                      <th>Racer</th>
                      <th>Lane</th>
                      <th>Place</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laneInfo.map((item) => {
                      const shortName = item.name.split(" - ")[0];
                      const laneDisplay = item.lane + 1;
                      return (
                        <tr key={item.racerId}>
                          <td>{shortName}</td>
                          <td>{laneDisplay}</td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-danger" onClick={handleScoreHeat}>
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
