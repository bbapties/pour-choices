// SignUpModal.js: The sign-up modal component with multi-step profile setup
import React, { useState, useEffect, useRef } from 'react';
import './SignUpModal.css'; // Import modal-specific styles

function SignUpModal({ onClose, onNext: onComplete }) {
  const [step, setStep] = useState(1); // 1: Username/Email, 2: Profile/Phone, 3: Custom
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(null); // Move this before customIcon
  const [customIcon, setCustomIcon] = useState({ bgColor: '#000000', textColor: '#FFFFFF', text: '' });
  const [showConfirm, setShowConfirm] = useState(false);
  const audioRef = useRef(new Audio(`${process.env.PUBLIC_URL}/cork-pop.mp3`));
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);

  // Update progress on field blur
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

  // Play first half (0-1.1s) on open, second half (1.1s-end) on next
  useEffect(() => {
    const audio = audioRef.current;
    const playFirstHalf = () => {
      audio.currentTime = 0;
      audio.play();
      setTimeout(() => audio.pause(), 1100); // 1.1 seconds
    };
    playFirstHalf();
    return () => audio.pause(); // Cleanup with captured audio
  }, [audioRef]); // Satisfies ESLint

  const trackEvent = async (eventType, page, element) => {
    try {
      await fetch('https://pour-choices-api.onrender.com/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, page, element }),
      });
    } catch (error) {
      console.error('Event tracking failed:', error);
    }
  };

  const handleNextStep = () => {
    setIsLoading(true);
    if (step === 1) {
      if (!username || !email) {
        alert('Both fields are required!');
        setIsLoading(false);
        return;
      }
      trackEvent('click', '/signup', 'next-button');
      Promise.all([checkUniqueness('username', username), checkUniqueness('email', email)])
        .then(([isUsernameUnique, isEmailUnique]) => {
          if (!isUsernameUnique) {
            alert('Username already in use—try logging in');
          } else if (!isEmailUnique) {
            alert('Email already in use—try logging in');
          } else {
            // Generate initials and random color for default icon
            let initials;
            const upper = username.toUpperCase();

            // Space split
            const spaceWords = username.split(/\s+/).filter(w => w.length > 0);
            if (spaceWords.length >= 2) {
              initials = spaceWords.slice(0, 3).map(w => w[0].toUpperCase()).join('');
            } else {
              // Capital split for camelCase
              const capitalMatches = username.match(/[A-Z]/g);
              if (capitalMatches && capitalMatches.length >= 2) {
                initials = capitalMatches.slice(0, 3).join('');
              } else {
                // Fallback first 3 uppercase
                initials = upper.substring(0, 3);
              }
            }
            console.log('Initials for username "' + username + '":', initials);

            const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
            // Contrast check
            const hex = randomColor.substring(1);
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';

            setSelectedIcon({ bgColor: randomColor, textColor, text: initials });

            setProgress(50);
            audioRef.current.currentTime = 1.1;
            audioRef.current.play();
            setStep(2);
          }
        })
        .catch(() => setIsLoading(false))
        .finally(() => setIsLoading(false));
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    trackEvent('click', '/signup', 'cancel-button');
    audioRef.current.currentTime = 0;
    setStep(1);
    setProgress(0); // Revert progress on cancel
    onClose();
  };

  const handleBack = () => {
    trackEvent('click', '/signup', 'back-button');
    if (step === 2) {
      setStep(1);
      setProgress(50); // Keep the username/email progress when going back
    } else if (step === 3) {
      setStep(2);
      setProgress(75); // Keep the icon progress when going back from step 3
    }
  };

  const handleSubmit = () => {
    trackEvent('click', '/signup', 'submit-button');
    if (phone && !/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone)) {
      alert('Invalid US phone number');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = (confirm) => {
    trackEvent('click', '/signup', confirm ? 'confirm-yes' : 'confirm-back');
    setShowConfirm(false);
    if (confirm) {
      setIsLoading(true);
      createUser(username, email, selectedIcon?.imageUrl || selectedIcon)
        .then(() => onComplete())
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  };

  const checkUniqueness = async (field, value) => {
    try {
      const response = await fetch('https://pour-choices-api.onrender.com/check-uniqueness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: value.toLowerCase() }),
      });
      const data = await response.json();
      return data.isUnique;
    } catch (error) {
      return false;
    }
  };

  const createUser = async (username, email, icon) => {
    try {
      const response = await fetch('https://pour-choices-api.onrender.com/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), email: email.toLowerCase(), profile_image_url: icon }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Creation failed');
      return true;
    } catch (error) {
      alert(`Failed to create user: ${error.message}`);
      return false;
    }
  };

const handleIconSelect = (icon) => {
  if (icon.id === 'custom') {
    setStep(3); // Go to custom step
  } else {
    setSelectedIcon(icon.image || icon); // Update for other icons
    // Progress logic: if on step 2 and progress is 50, set to 75
    setProgress(prev => (prev < 75 ? 75 : prev));
  }
};

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 10);
    setPhone(value ? `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 10)}` : '');
  };

  const handleCustomSubmit = () => {
    if (customIcon.text && customIcon.text.length === 3) {
      setSelectedIcon(customIcon);
      setStep(2);
      setProgress(75);
    } else {
      alert('Please enter 3 characters for custom icon');
    }
  };

  const handleUpload = (e) => {
    trackEvent('click', '/signup', 'upload-image');
    const file = e.target.files[0];
    if (!file || !['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('Please upload a PNG, JPEG, or JPG image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large, please select a smaller image');
      return;
    }

    const handleBackToStep1 = () => {
  setStep(1);
};
    
    // Simple file upload without cropping - just use the file as-is
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedIcon(event.target.result);
      setStep(2);
      setProgress(75);
    };
    reader.readAsDataURL(file);
  };

  // Dynamically list icons from public/user-icons (manual array for now)
  const iconFiles = [
    'user-icons/icon1.png',
    'user-icons/icon2.png',
    'user-icons/icon3.png',
    'user-icons/icon4.png',
    'user-icons/icon5.png',
    'user-icons/icon6.png',
    'user-icons/icon7.png',
    'user-icons/icon8.png',
    'user-icons/icon9.png',
    'user-icons/icon10.png',
    'user-icons/icon11.png',
    'user-icons/icon12.png',
  ].filter(file => file); // Ensure no empty entries

  const presetIcons = [...iconFiles.map((file, index) => ({
    id: `icon${index + 1}`,
    label: `Icon ${index + 1}`,
    image: file,
  }))];

  const customIconConfig = {
    id: 'custom',
    image: 'data:image/svg+xml;utf8,<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><rect width="56" height="56" fill="%23333333"/><text x="28" y="17" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">MAKE</text><text x="28" y="32" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">YOUR</text><text x="28" y="47" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">OWN</text></svg>',
    label: 'Custom'
  };

  const bothFilled = username.trim() !== '' && email.trim() !== ''; // Restored to enable Next button

  return (
    <div className={`sign-up-modal-overlay ${step === 1 ? 'step-1' : step === 2 ? 'step-2' : 'step-3'}`}>
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
      <div className="sign-up-modal-content">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          {progress > 0 && <span className="progress-label">{progress}% Sign-Up Complete</span>}
        </div>
        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => {
                console.log('Username input:', e.target.value);
                setUsername(e.target.value);
              }}
              onBlur={handleUsernameBlur}
              className="modal-input"
            />
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              className="modal-input"
            />
          </>
        )}
        {step === 2 && (
          <>
             <div className="icon-selection-area">
              <div className="main-carousel-container">
                <div className="left-section">
                  <div className="carousel-label-wrapper">
                    <span className="carousel-label"></span> {/* Invisible placeholder */}
                  </div>
                  <div className="current-box">
                    {selectedIcon && (
                      <img src={typeof selectedIcon === 'string' ? selectedIcon : `data:image/svg+xml;utf8,${encodeURIComponent(createIconSvg(selectedIcon))}`} alt="Current" />
                    )}
                  </div>
                  <span className="current-label">Current</span>
                </div>
                <div className="right-section">
                  <span className="carousel-label">Choose a new Profile Icon below</span> {/* Moved label inside .right-section */}
                  <div className="icon-scroll-container">
                    <div className="carousel-item" onClick={() => handleIconSelect(customIconConfig)}>
                      <div className="icon-card">
                        <img src={customIconConfig.image} alt={customIconConfig.label} style={{ objectFit: 'contain' }} />
                      </div>
                    </div>
                    {presetIcons.map((icon) => (
                      <div key={icon.id} className="carousel-item" onClick={() => handleIconSelect(icon)}>
                        <div className="icon-card">
                          <img src={icon.image} alt={icon.label} style={{ objectFit: 'contain' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ paddingLeft: '50px', paddingRight: '50px', width: '100%' }}>
              <input
                type="tel"
                placeholder="Phone (optional) +1 (___) ___-____"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={() => setProgress(phone ? 100 : 75)}
                className="modal-input"
              />
              <small style={{ color: '#CCCCCC', fontSize: '0.8rem', textAlign: 'center', display: 'block' }}>Phone number will be used to send text updates</small>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Current Icon - Centered at top */}
            <div className="step3-current-icon">
              <div className="current-box">
                {selectedIcon && (
                  <img src={typeof selectedIcon === 'string' ? selectedIcon : `data:image/svg+xml;utf8,${encodeURIComponent(createIconSvg(selectedIcon))}`} alt="Current" />
                )}
              </div>
              <span className="current-label">Current Icon</span>
            </div>

            {/* Two-column grid layout */}
            <div className="step3-grid-container">
              {/* Left Column - Upload Section */}
              <div className="step3-upload-section">
                <span className="step3-section-title step3-title-top">Upload Your</span>
                <div className="upload-button-container">
                  <button 
                    className="upload-button-large" 
                    onClick={() => document.getElementById('fileInput').click()} 
                    aria-label="Upload Your Own Custom Image"
                  >
                    <span className="camera-icon" role="img" aria-label="camera" style={{ paddingBottom: '40px' }}>📷</span>
                  </button>
                  <input 
                    id="fileInput" 
                    type="file" 
                    accept="image/png,image/jpeg,image/jpg" 
                    onChange={handleUpload} 
                    style={{ display: 'none' }} 
                  />
                </div>
                <span className="step3-section-title step3-title-bottom">Custom Image</span>
              </div>

              {/* OR Divider */}
              <div className="step3-or-divider">
                <span>OR</span>
              </div>

              {/* Right Column - Create Avatar Section */}
              <div className="step3-create-section">
                <span className="step3-section-title step3-title-top">Create Your Own</span>
                <div className="create-controls">
                  <button 
                    className="step3-color-button" 
                    onClick={() => setShowBgPicker(true)}
                  >
                    Background Color
                  </button>
                  <button 
                    className="step3-color-button" 
                    onClick={() => setShowTextPicker(true)}
                  >
                    Text Color
                  </button>
                  <div className="text-input-container">
                    <label className="text-input-label">TEXT:</label>
                    <input
                      type="text"
                      maxLength="3"
                      placeholder="ABC"
                      value={customIcon.text}
                      onChange={(e) => setCustomIcon(prev => ({ ...prev, text: e.target.value.toUpperCase().substring(0, 3) }))}
                      className="step3-text-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Background Picker Popup - Using native HTML color picker */}
            {showBgPicker && (
              <div className="color-picker-overlay">
                <div className="color-picker-content">
                  <h3>Choose Background Color</h3>
                  <input
                    type="color"
                    value={customIcon.bgColor}
                    onChange={(e) => setCustomIcon(prev => ({ ...prev, bgColor: e.target.value }))}
                    style={{ width: '100px', height: '50px', margin: '20px 0' }}
                  />
                  <br />
                  <button className="welcome-button login" onClick={() => setShowBgPicker(false)}>Close</button>
                </div>
              </div>
            )}

            {/* Text Picker Popup - Using native HTML color picker */}
            {showTextPicker && (
              <div className="color-picker-overlay">
                <div className="color-picker-content">
                  <h3>Choose Text Color</h3>
                  <input
                    type="color"
                    value={customIcon.textColor}
                    onChange={(e) => setCustomIcon(prev => ({ ...prev, textColor: e.target.value }))}
                    style={{ width: '100px', height: '50px', margin: '20px 0' }}
                  />
                  <br />
                  <button className="welcome-button login" onClick={() => setShowTextPicker(false)}>Close</button>
                </div>
              </div>
            )}
          </>
        )}

        {showConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-content">
              <p>Are you sure you don't want to receive text message updates?</p>
              <div className="confirm-buttons">
                <button onClick={() => handleConfirm(true)}>Yes</button>
                <button onClick={() => handleConfirm(false)}>Back</button>
              </div>
            </div>
          </div>
        )}
        <div className="modal-buttons">
          {step === 1 && bothFilled && <button className="welcome-button signup" onClick={handleNextStep}>Next</button>}
          {step === 2 && (!phone || !/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone)) && <button className="welcome-button signup" onClick={handleNextStep}>Skip</button>}
          {step === 2 && phone && /^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone) && <button className="welcome-button signup" onClick={handleSubmit}>Submit</button>}
          {step === 3 && customIcon.text && customIcon.text.length === 3 && <button className="welcome-button signup" onClick={handleCustomSubmit}>OK</button>}
          
          {/* Conditional button rendering: Cancel for step 1, Back for steps 2 and 3 */}
          {step === 1 && <button className="welcome-button login" onClick={handleCancel}>Cancel</button>}
          {(step === 2 || step === 3) && <button className="welcome-button login" onClick={handleBack}>Back</button>}
        </div>
      </div>
    </div>
  );
}

// Helper function to create SVG for custom icon
const createIconSvg = ({ bgColor, textColor, text }) => `
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="${bgColor}" />
    <text x="50" y="55" font-size="30" text-anchor="middle" fill="${textColor}">${text}</text>
  </svg>
`;

export default SignUpModal;