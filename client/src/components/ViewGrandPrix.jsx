import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ViewGrandPrix() {
  const [grandPrixList, setGrandPrixList] = useState([]);
  const [heatsExist, setHeatsExist] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrandPrix();
  }, []);

  useEffect(() => {
    // For each Grand Prix, check if heats exist.
    grandPrixList.forEach((gp) => {
      axios
        .get(`/api/heats/gp/${gp._id}`)
        .then((response) => {
          setHeatsExist((prev) => ({
            ...prev,
            [gp._id]: response.data.heats && response.data.heats.length > 0,
          }));
        })
        .catch((err) => {
          console.error("Error checking heats for GP:", gp._id, err);
        });
    });
  }, [grandPrixList]);

  const fetchGrandPrix = async () => {
    try {
      const response = await axios.get("/api/grandprix");
      setGrandPrixList(response.data.grandPrix || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddRacers = (gpId) => {
    navigate(`/add-racer/${gpId}`);
  };

  const handleViewRacers = (gpId) => {
    navigate(`/view-racers/${gpId}`);
  };

  // If heats exist, we navigate to the heats view. Otherwise, we generate heats first.
  const handleStartOrViewGP = async (gpId) => {
    try {
      if (heatsExist[gpId]) {
        navigate(`/heats/${gpId}`);
      } else {
        await axios.post("/api/heats/generate", { grandPrix: gpId });
        // Optionally update the heatsExist mapping once generated.
        setHeatsExist((prev) => ({ ...prev, [gpId]: true }));
        navigate(`/heats/${gpId}`);
      }
    } catch (err) {
      console.error("Error starting GP:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (gpId) => {
    if (!window.confirm("Are you sure you want to delete this Grand Prix?"))
      return;
    try {
      await axios.delete(`/api/grandprix/${gpId}`);
      setGrandPrixList((prev) => prev.filter((gp) => gp._id !== gpId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
    >
      <div
        className="my-5 p-4 text-white"
        style={{
          maxWidth: "1200px",
          width: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderRadius: "8px",
        }}
      >
        <h2 className="fw-bold mb-4">Existing Grand Prix</h2>
        {error && <p className="text-danger">{error}</p>}
        {grandPrixList.length === 0 ? (
          <p>No Grand Prix found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-primary table-striped align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  {/* <th>Description</th> */}
                  <th>Date</th>
                  <th>Location</th>
                  <th>Racers</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grandPrixList.map((gp) => (
                  <tr key={gp._id}>
                    <td>{gp.name}</td>
                    {/* <td>{gp.description}</td> */}
                    <td>{new Date(gp.date).toLocaleDateString("en-US")}</td>
                    <td>{gp.location}</td>
                    <td>{gp.racersList?.length || 0}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => handleAddRacers(gp._id)}
                      >
                        Add Racers
                      </button>
                      <button
                        className="btn btn-info btn-sm me-2"
                        onClick={() => handleViewRacers(gp._id)}
                      >
                        View Racers
                      </button>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => handleStartOrViewGP(gp._id)}
                      >
                        {heatsExist[gp._id] ? "View Heats" : "Start GP"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(gp._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewGrandPrix;
