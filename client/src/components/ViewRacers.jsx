import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ViewRacers() {
  const { gpId } = useParams(); // Grand Prix ID from URL
  const [grandPrix, setGrandPrix] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrandPrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGrandPrix = async () => {
    try {
      // Fetch the specific Grand Prix by ID and populate virtual "racersList"
      const response = await axios.get(`/api/grandprix/${gpId}`);
      setGrandPrix(response.data.grandPrix);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete a racer by ID
  const handleDeleteRacer = async (racerId) => {
    if (!window.confirm("Are you sure you want to delete this racer?")) return;
    try {
      await axios.delete(`/api/racers/${racerId}`);
      // After deletion, re-fetch the Grand Prix data to update the list
      fetchGrandPrix();
    } catch (err) {
      setError(err.message);
    }
  };

  // Navigate to add new racer form for this GP
  const handleAddNewRacer = () => {
    navigate(`/add-racer/${gpId}`);
  };

  if (error) {
    return (
      <div className="text-danger text-center mt-5">
        <h3>Error: {error}</h3>
      </div>
    );
  }

  if (!grandPrix) {
    return (
      <div className="text-center mt-5">
        <h3>Loading Grand Prix data...</h3>
      </div>
    );
  }

  // Use the virtual field "racersList"
  const racersArray = grandPrix.racersList || [];

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
    >
      <div
        className="my-5 p-4 text-white"
        style={{
          maxWidth: "800px",
          width: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderRadius: "8px",
        }}
      >
        <h2 className="fw-bold mb-4 text-center">
          Racer's for {grandPrix.name}
        </h2>

        {racersArray.length === 0 ? (
          <p className="text-center">No racers found for this Grand Prix.</p>
        ) : (
          <table className="table table-primary table-striped">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Club</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {racersArray.map((racer) => (
                <tr key={racer._id}>
                  <td>{racer.firstName}</td>
                  <td>{racer.lastName}</td>
                  <td>{racer.club}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteRacer(racer._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="text-center mt-4">
          <button
            className="btn btn-danger btn-lg"
            onClick={handleAddNewRacer}
          >
            Add New Racer
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewRacers;
