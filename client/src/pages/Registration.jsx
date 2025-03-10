import { useState } from "react";
import axios from "axios";

function Registration() {
  const [name, setName] = useState("");
  const [racers, setRacers] = useState([]);

  const registerRacer = async () => {
    if (!name.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/api/racers", { name });
      setRacers([...racers, res.data]);
      setName("");
    } catch (error) {
      console.error("Error registering racer:", error);
    }
  };

  return (
    <div>
      <h2>Racer Registration</h2>
      <input
        type="text"
        placeholder="Enter Racer Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={registerRacer}>Register</button>

      <h3>Registered Racers:</h3>
      <ul>
        {racers.map((racer) => (
          <li key={racer._id}>{racer.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Registration;
