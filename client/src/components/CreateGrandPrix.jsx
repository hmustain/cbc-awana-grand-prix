import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateGrandPrix() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/grandprix', formData);
      console.log('Grand Prix created:', response.data);
      navigate('/existing');
    } catch (error) {
      console.error('Error creating Grand Prix:', error);
    }
  };

  return (
    /* 
      Outer overlay to dim the background
      - We use d-flex, align-items-center, justify-content-center 
        to center the form both vertically and horizontally.
      - backgroundColor: 'rgba(0, 0, 0, 0.6)' dims the global background.
    */
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      {/* 
        Inner container for the form
        - maxWidth: 600px keeps the form narrow.
        - backgroundColor: 'rgba(0, 0, 0, 0.5)' gives a subtle overlay behind the form.
        - text-white to make text readable on dark background.
      */}
      <div
        className="p-4 text-white"
        style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
        }}
      >
        {/* Centered, bold heading */}
        <h2 className="text-center fw-bold mb-4">Create Grand Prix</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="mb-3">
            <label htmlFor="gpName" className="form-label fw-bold text-white">
              Name
            </label>
            <input
              type="text"
              id="gpName"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description Field */}
          <div className="mb-3">
            <label htmlFor="gpDescription" className="form-label fw-bold text-white">
              Description
            </label>
            <textarea
              id="gpDescription"
              name="description"
              className="form-control"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Date Field */}
          <div className="mb-3">
            <label htmlFor="gpDate" className="form-label fw-bold text-white">
              Date
            </label>
            <input
              type="date"
              id="gpDate"
              name="date"
              className="form-control"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Location Field */}
          <div className="mb-3">
            <label htmlFor="gpLocation" className="form-label fw-bold text-white">
              Location
            </label>
            <input
              type="text"
              id="gpLocation"
              name="location"
              className="form-control"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit Button - Dark theme */}
          <button type="submit" className="btn btn-danger btn-lg w-100 mt-3 fw-bold">
            Create Grand Prix
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGrandPrix;
