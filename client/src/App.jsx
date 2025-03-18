import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import CreateGrandPrix from "./components/CreateGrandPrix";
import ViewGrandPrix from "./components/ViewGrandPrix";
import ViewRacers from "./components/ViewRacers";
import AddRacer from "./components/AddRacer";
import ViewHeats from "./components/ViewHeats";
import HeatResults from "./components/HeatResults";
import ViewBrackets from "./components/ViewBrackets";
import ViewGpResults from "./components/ViewGpResults"; // import your new results component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/registration" element={<CreateGrandPrix />} />
        <Route path="/existing" element={<ViewGrandPrix />} />
        <Route path="/view-racers/:gpId" element={<ViewRacers />} />
        <Route path="/add-racer/:gpId" element={<AddRacer />} />
        <Route path="/heats/:gpId" element={<ViewHeats />} />
        <Route path="/gp/:gpId/results" element={<HeatResults />} />
        <Route path="/brackets/:gpId" element={<ViewBrackets />} />
        <Route path="/results/:gpId" element={<ViewGpResults />} />
      </Routes>
    </Router>
  );
}

export default App;
