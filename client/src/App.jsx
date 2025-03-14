import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import CreateGrandPrix from "./components/CreateGrandPrix";
import ViewGrandPrix from "./components/ViewGrandPrix";
import ViewRacers from "./components/ViewRacers";
import AddRacer from "./components/AddRacer";
import ViewHeats from "./components/ViewHeats";


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
        </Routes>
    </Router>
  );
}

export default App;
