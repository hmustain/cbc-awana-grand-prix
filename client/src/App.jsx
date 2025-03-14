import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import CreateGrandPrix from "./components/CreateGrandPrix";
import ViewGrandPrix from "./pages/ViewGrandPrix"; // If stored in "src/pages"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/registration" element={<CreateGrandPrix />} />
        <Route path="/existing" element={<ViewGrandPrix />} />
      </Routes>
    </Router>
  );
}

export default App;
