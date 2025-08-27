// Welcome.js: The landing page component for new and returning users
import React, { useState, useEffect } from 'react';
import './Welcome.css'; // Import associated styles

function Welcome() {
  const [showComingSoon, setShowComingSoon] = useState(false); // State to toggle the coming soon overlay

  const handleButtonClick = () => {
    setShowComingSoon(true); // Show the coming soon overlay on button click
  };

  return (
    // Main container with cellar background class
    <div className="welcome-container">
      {/* Button container for Sign Up and Log In */}
      <div className="welcome-buttons">
        {/* Primary Sign Up button */}
        <button className="welcome-button signup" onClick={handleButtonClick}>Sign Up</button>
        {/* Secondary Log In button */}
        <button className="welcome-button login" onClick={handleButtonClick}>Log In</button>
      </div>
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