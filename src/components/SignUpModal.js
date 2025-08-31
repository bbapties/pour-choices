// SignUpModal.js: The sign-up modal component
import React, { useState, useEffect, useCallback } from 'react';
import './SignUpModal.css'; // Import modal-specific styles

function SignUpModal({ onClose, onNext }) {
  const [username, setUsername] = useState(''); // State for username
  const [email, setEmail] = useState(''); // State for email
  const [progress, setProgress] = useState(0); // State for progress bar (0-100%)
  const [isCreating, setIsCreating] = useState(false); // State to track creation process

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

  // Check uniqueness with backend API
  const checkUniqueness = async (field, value) => {
    try {
      console.log(`Starting uniqueness check for ${field}: ${value}`); // Debug start
      const response = await fetch('https://fresh-taxis-wish.loca.lt/check-uniqueness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: value.toLowerCase() }),
      });
      const data = await response.json();
      console.log(`Uniqueness check result for ${field}: ${value} -> ${data.isUnique}`); // Debug result
      return data.isUnique;
    } catch (error) {
      console.error(`Uniqueness check failed for ${field}: ${error.message}`);
      return false; // Fallback on error
    }
  };    

  // Create user with backend API
  const createUser = async (username, email) => {
    console.log(`Initiating user creation for ${username}, ${email}`); // Debug start
    try {
      const response = await fetch('https://fresh-taxis-wish.loca.lt/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), email: email.toLowerCase() }),
      });
      const data = await response.json();
      console.log(`User creation response: ${JSON.stringify(data)}`); // Debug response
      if (!response.ok) throw new Error(data.error || 'Creation failed');
      return true;
    } catch (error) {
      console.error(`User creation failed: ${error.message}`);
      alert(`Failed to create user: ${error.message}`);
      return false;
    }
  };

  // Handle Next button click with validation and creation
  const handleNext = useCallback(async () => {
    console.log('Handle Next triggered'); // Debug trigger
    if (!username || !email) {
      alert('Both fields are required!');
      return;
    }
    setIsCreating(true); // Start creation process
    try {
      const isUsernameUnique = await checkUniqueness('username', username);
      const isEmailUnique = await checkUniqueness('email', email);
      console.log(`Uniqueness checks completed: username=${isUsernameUnique}, email=${isEmailUnique}`); // Debug checks
      if (!isUsernameUnique) {
        alert('Username already in use—try logging in');
        setIsCreating(false);
        return;
      }
      if (!isEmailUnique) {
        alert('Email already in use—try logging in');
        setIsCreating(false);
        return;
      }
      console.log('Proceeding to user creation'); // Debug before creation
      const userCreated = await createUser(username, email); // Await creation
      console.log(`User creation result: ${userCreated}`); // Debug result
      if (userCreated) {
        onNext(); // Proceed to coming soon screen only if creation succeeds
      }
    } catch (error) {
      console.error('Handle Next error:', error);
      alert('An error occurred during signup process');
    } finally {
      setIsCreating(false); // Reset creation state regardless of outcome
    }
  }, [username, email, onNext]);

  // Debug button to manually trigger createUser
  const debugCreate = () => {
    console.log('Debug Create button clicked'); // Debug entry point
    if (!username || !email) {
      alert('Please fill both username and email fields!');
      return;
    }
    createUser(username, email).then(() => console.log('Debug Create completed'));
  };

  // Check if both fields are filled for showing Next button
  const bothFilled = username.trim() !== '' && email.trim() !== '';

  return (
    <div className="sign-up-modal-overlay">
      <div className="sign-up-modal-content">
        {/* Progress bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          {progress > 0 && (
            <span className="progress-label" style={{ left: `${progress - 5}%` }}>{progress}%</span>
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
          {bothFilled && !isCreating && (
            <button className="welcome-button signup" onClick={handleNext}>Next</button>
          )}
          <button className="welcome-button login" onClick={onClose}>Cancel</button>
          <button className="welcome-button debug" onClick={debugCreate}>Debug Create</button> {/* Always visible */}
        </div>
      </div>
    </div>
  );
}

// Export the component for use in other parts of the app
export default SignUpModal;