// Welcome.js: The landing page component for new and returning users
import React, { useState } from 'react';
import './Welcome.css'; // Import associated styles
import SignUpModal from './SignUpModal'; // Import the sign-up modal component

function Welcome() {
  const [showSignUpModal, setShowSignUpModal] = useState(false); // State to toggle the sign-up modal
  const [showComingSoon, setShowComingSoon] = useState(false); // State to toggle the coming soon overlay

  const handleSignUpClick = () => {
    setShowSignUpModal(true); // Show the sign-up modal on button click
  };

  const handleLogInClick = () => {
    setShowComingSoon(true); // Show the coming soon overlay on Log In click
  };

  const handleNext = () => {
    setShowSignUpModal(false); // Close modal
    setShowComingSoon(true); // Show coming soon screen
  };

  return (
    // Main container with cellar background class
    <div className="welcome-container">
      {/* Button container for Sign Up and Log In */}
      <div className="welcome-buttons">
        {/* Primary Sign Up button */}
        <button className="welcome-button signup" onClick={handleSignUpClick}>Sign Up</button>
        {/* Secondary Log In button */}
        <button className="welcome-button login" onClick={handleLogInClick}>Log In</button>
      </div>
      {/* Sign-up modal */}
      {showSignUpModal && (
        <SignUpModal onClose={() => setShowSignUpModal(false)} onNext={handleNext} />
      )}
      {/* Full-screen coming soon overlay */}
      {showComingSoon && (
        <div className="coming-soon-overlay">
          {/* Back button */}
          <button className="welcome-button login" onClick={() => setShowComingSoon(false)}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}

// Export the component for use in other parts of the app
export default Welcome;