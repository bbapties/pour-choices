// Welcome.js: The landing page component for new and returning users
import React from 'react';
import './Welcome.css'; // Import associated styles

function Welcome() {
  return (
    // Main container with cellar background class
    <div className="welcome-container">
      {/* App logo in gold Playfair Display */}
      <h1 className="welcome-logo">Pick Your Pour</h1>
      {/* Tagline in ivory script */}
      <p className="welcome-tagline">Picture Your Spirit Journey</p>
      {/* Button container for Sign Up and Log In */}
      <div className="welcome-buttons">
        {/* Primary Sign Up button */}
        <button className="welcome-button signup">Sign Up</button>
        {/* Secondary Log In button */}
        <button className="welcome-button login">Log In</button>
      </div>
    </div>
  );
}

// Export the component for use in other parts of the app
export default Welcome;