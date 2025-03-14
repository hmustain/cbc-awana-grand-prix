import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleCreate = () => {
    setShowModal(false);
    navigate('/registration');
  };

  const handleView = () => {
    setShowModal(false);
    navigate('/existing');
  };

  return (
    <div className="landing-container d-flex flex-column justify-content-center align-items-center text-center min-vh-100 text-white">
      <h1 className="display-1">Welcome to Awana Grand Prix!</h1>
      <button
        className="btn btn-dark btn-lg mt-4 px-4 py-3"
        onClick={() => setShowModal(true)}
      >
        Get Started!
      </button>

      {showModal && (
        <>
          {/* Modal Backdrop */}
          <div className="modal-backdrop fade show"></div>

          {/* Modal */}
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content text-center text-dark">
                
                {/* Centered Title, Close Button in Top-Right */}
                <div className="modal-header border-0 text-center position-relative">
                  <h5 className="modal-title fw-bold w-100">
                    What would you like to do?
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    style={{ position: 'absolute', top: '1rem', right: '1rem' }}
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                {/* Body */}
                <div className="modal-body fw-bold">
                  <p>Please choose an option below.</p>
                </div>

                {/* Footer with centered buttons */}
                <div className="modal-footer justify-content-center border-0">
                  <button className="btn btn-dark me-3" onClick={handleCreate}>
                    Create Grand Prix
                  </button>
                  <button className="btn btn-dark" onClick={handleView}>
                    View Existing Grand Prix
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LandingPage;
