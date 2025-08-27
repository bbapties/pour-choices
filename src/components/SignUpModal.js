// SignUpModal.js: The sign-up modal component
import React, { useState, useEffect } from 'react';
import './SignUpModal.css'; // Import modal-specific styles

function SignUpModal({ onClose }) {
  const [username, setUsername] = useState(''); // State for username
  const [email, setEmail] = useState(''); // State for email
  const [progress, setProgress] = useState(0); // State for progress bar (0-100%)

  // Mock uniqueness check (replace with backend call later)
  const isUnique = (field, value) => {
    // Mock DB check
    const existingUsers = ['existinguser', 'testuser']; // Mock usernames
    const existingEmails = ['existing@email.com', 'test@email.com']; // Mock emails
    if (field === 'username') return !existingUsers.includes(value.toLowerCase());
    if (field === 'email') return !existingEmails.includes(value.toLowerCase());
    return true;
  };

  // Handle Next button click with validation
  const handleNext = () => {
    if (!username || !email) {
      alert('Both fields are required!');
      return;
    }
    if (!isUnique('username', username)) {
      alert('Username already in use—try logging in');
      onClose();
      return;
    }
    if (!isUnique('email', email)) {
      alert('Email already in use—try logging in');
      onClose();
      return;
    }
    // Proceed to Step 2 (mock for now)
    alert('Proceed to Step 2!');
  };

  // Update progress on field blur (after stepping out)
  const handleUsernameBlur = () => {
    if (username.trim() !== '') {
      setProgress(25); // 0% to 25% if filled
    }
  };

  const handleEmailBlur = () => {
    if (email.trim() !== '') {
      setProgress(50); // 25% to 50% if filled
    }
  };

  // Play cork pop sound on modal open (useEffect for once)
  useEffect(() => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/cork-pop.mp3`);
    audio.play();
  }, []); // Plays once on mount

  // Check if both fields are filled for showing Next button
  const bothFilled = username.trim() !== '' && email.trim() !== '';

  return (
    <div className="sign-up-modal-overlay">
      <div className="sign-up-modal-content">
        {/* Progress bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          {progress > 0 && (
            <span className="progress-label" style={{ left: `${progress - 5}%` }}>{progress}%</span> // Position at end of fill
          )}
        </div>
        {/* Username field */}
        <input 
          type="text" 
          placeholder="Enter username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          onBlur={handleUsernameBlur} 
          className="modal-input" 
        />
        {/* Email field */}
        <input 
          type="email" 
          placeholder="Enter email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          onBlur={handleEmailBlur} 
          className="modal-input" 
        />
        {/* Buttons */}
        <div className="modal-buttons">
          {bothFilled && (
            <button className="welcome-button signup" onClick={handleNext}>Next</button>
          )}
          <button className="welcome-button login" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Export the component for use in other parts of the app
export default SignUpModal;