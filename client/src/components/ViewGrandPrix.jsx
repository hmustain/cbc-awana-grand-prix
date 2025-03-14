import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ViewGrandPrix() {
  const [grandPrixList, setGrandPrixList] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrandPrix();
  }, []);

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

  // Updated Start GP handler: Pass the GP id in the payload to the generate endpoint.
  const handleStartGP = async (gpId) => {
    try {
      // Pass the gpId to your heats generation endpoint.
      await axios.post("/api/heats/generate", { grandPrix: gpId });
      navigate("/heats");
    } catch (err) {
      console.error("Error generating heats:", err);
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

  const handleViewRacers = (gpId) => {
    navigate(`/view-racers/${gpId}`);
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
                  <th>Description</th>
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
                    <td>{gp.description}</td>
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
                        onClick={() => handleStartGP(gp._id)}
                      >
                        Start GP
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
