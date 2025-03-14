import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ViewGrandPrix() {
  const [grandPrixList, setGrandPrixList] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGrandPrix();
  }, []);

  const fetchGrandPrix = async () => {
    try {
      const response = await axios.get('/api/grandprix');
      // Your backend sends: { message: "Events retrieved", grandPrix: events }
      // So we access response.data.grandPrix
      setGrandPrixList(response.data.grandPrix || []);
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div className="container my-5">
        <h2>Existing Grand Prix</h2>
        <p className="text-danger">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2>Existing Grand Prix</h2>
      {grandPrixList.length === 0 ? (
        <p>No Grand Prix found.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Date</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {grandPrixList.map((gp) => (
              <tr key={gp._id}>
                <td>{gp.name}</td>
                <td>{gp.description}</td>
                <td>{gp.date}</td>
                <td>{gp.location}</td>
                <td>
                  {/* Future buttons for adding racers or starting the Grand Prix */}
                  <button className="btn btn-primary btn-sm me-2">Add Racers</button>
                  <button className="btn btn-success btn-sm">Start GP</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ViewGrandPrix;
