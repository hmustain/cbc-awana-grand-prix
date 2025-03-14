import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ViewHeats() {
  const { gpId } = useParams(); // Grand Prix ID
  const [heats, setHeats] = useState([]);
  const [gpName, setGpName] = useState(""); // Store the GP name
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGrandPrixName();
    fetchHeatsForGP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional: fetch GP name for display
  const fetchGrandPrixName = async () => {
    try {
      const response = await axios.get(`/api/grandprix/${gpId}`);
      setGpName(response.data.grandPrix.name);
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

  return (
    <div className="min-vh-100" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="container py-5">
        <h2 className="text-white fw-bold mb-4 text-center">
          Heats for {gpName || "Grand Prix"}
        </h2>
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
                  {/* 
                    The rest of your "Run Heat" logic goes here 
                    (modal or next steps for scoring).
                  */}
                  <button className="btn btn-primary btn-sm">Run Heat</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* If you want to show "Generate Brackets" or other logic at bottom */}
      </div>
    </div>
  );
}

export default ViewHeats;
