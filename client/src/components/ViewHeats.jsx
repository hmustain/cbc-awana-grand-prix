import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ViewHeats() {
  const { gpId } = useParams(); // Grab the Grand Prix ID from the URL
  const [heats, setHeats] = useState([]);
  const [gpName, setGpName] = useState(""); // To display the GP name at the top
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGPName();
    fetchHeatsForGP();
  }, [gpId]);

  // Fetch the Grand Prix name for a master title
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
            {heats.map((heat, index) => (
              <div key={heat._id} className="col-md-4 mb-4">
                <div className="card bg-dark text-white">
                  <div className="card-body">
                    <h5 className="card-title">{heat.heatName}</h5>
                    <p className="card-text">Round: {heat.round}</p>
                    {heat.racers && heat.racers.length > 0 ? (
                      <p className="card-text">
                        Racers: {heat.racers.join(", ")}
                      </p>
                    ) : (
                      <p className="card-text">No racer data available</p>
                    )}
                    {heat.results && heat.results.length > 0 ? (
                      <p className="card-text">Scored</p>
                    ) : (
                      <p className="card-text">Not scored yet</p>
                    )}
                    <button className="btn btn-primary btn-sm">Run Heat</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewHeats;
