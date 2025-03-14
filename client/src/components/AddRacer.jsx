import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddRacer() {
  const { gpId } = useParams(); // Retrieve the Grand Prix ID from the URL
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    club: '',
  });
  
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Include the grandPrix field using gpId from the URL
      const payload = { ...formData, grandPrix: gpId };
      const response = await axios.post('/api/racers', payload);
      console.log("Racer added:", response.data);
      // Redirect to the View Racers page (or another appropriate page)
      navigate(`/view-racers/${gpId}`);
    } catch (err) {
      console.error("Error adding racer:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div
        className="my-5 p-4 text-white"
        style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
        }}
      >
        <h2 className="fw-bold mb-4 text-center">Add Racer</h2>
        {error && <p className="text-danger text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="firstName" className="form-label fw-bold text-white">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className="form-control"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="lastName" className="form-label fw-bold text-white">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className="form-control"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="club" className="form-label fw-bold text-white">
              Club
            </label>
            <input
              type="text"
              id="club"
              name="club"
              className="form-control"
              value={formData.club}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-danger btn-lg w-100 mt-3 fw-bold">
            Add Racer
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddRacer;
