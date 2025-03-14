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

  // Existing handlers...
  const handleAddRacers = (gpId) => {
    navigate(`/add-racer/${gpId}`);
  };

  const handleStartGP = (gpId) => {
    console.log("Start GP for:", gpId);
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

  // NEW: View Racers handler
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
