import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-container d-flex flex-column justify-content-center align-items-center text-center min-vh-100 text-white">
      <h1 className="display-1">Welcome to Awana Grand Prix!</h1>
      
      {/* Single call-to-action button with a more contrasting color scheme */}
      <Link to="/registration" className="btn btn-dark btn-lg mt-4 px-4 py-3">
        Get Started!
      </Link>
    </div>
  );
}

export default LandingPage;
