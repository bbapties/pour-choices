// App.js: The root component of the application
import React from 'react';
import './App.css';
import Welcome from './components/Welcome'; // Import the Welcome component

function App() {
  return (
    <div className="App">
      {/* Render the Welcome page as the initial view */}
      <Welcome />
    </div>
  );
}

export default App;
