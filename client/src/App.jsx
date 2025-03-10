import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Registration from "./pages/Registration";
// import HeatRaces from "./pages/HeatRaces";
// import Bracket from "./pages/Bracket";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Registration />} />
        <Route path="/heat-races" element={<HeatRaces />} />
        <Route path="/bracket" element={<Bracket />} />
      </Routes>
    </Router>
  );
}

export default App;
