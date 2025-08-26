// Welcome.js: The landing page component for new and returning users
import React, { useState, useEffect } from 'react';
import './Welcome.css'; // Import associated styles
import comingSoon from '../images/coming-soon.jpg'; // Import the coming soon image (add it to src/images)

function Welcome() {
  const [showComingSoon, setShowComingSoon] = useState(false); // State to toggle the coming soon overlay
  const [deferredPrompt, setDeferredPrompt] = useState(null); // State to store the install prompt event

  const handleButtonClick = () => {
    setShowComingSoon(true); // Show the coming soon overlay on button click
  };

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // Prevent the default prompt
      setDeferredPrompt(e); // Store the event for manual trigger
    });
  }, []);

  // Function to trigger the add to home screen prompt
  const handleAddToHomeScreen = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the prompt
      const { outcome } = await deferredPrompt.userChoice; // Wait for user response
      if (outcome === 'accepted') {
        console.log('User accepted the add to home screen prompt');
      } else {
        console.log('User dismissed the add to home screen prompt');
      }
      setDeferredPrompt(null); // Clear the prompt
    } else {
      alert('Add to home screen is not available on this device or browser');
    }
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
        {/* Add to Home Screen button */}
        <button className="welcome-button add-home" onClick={handleAddToHomeScreen}>Add to Home Screen</button>
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
