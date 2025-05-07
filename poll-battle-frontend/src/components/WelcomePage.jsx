import React from 'react';

function WelcomePage({ username, setUsername, roomCode, setRoomCode, createRoom, joinRoom }) {
  // Handle enter key press in input fields
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };
  
  return (
    <div className="welcome-container">
      <h2>Join or Create a Poll Battle</h2>
      
      <div className="input-group">
        <label htmlFor="username">Your Name:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          onKeyPress={(e) => handleKeyPress(e, createRoom)}
        />
      </div>
      
      <div className="actions">
        <div className="action-group">
          <h3>Create a New Room</h3>
          <button 
            className="primary-button"
            onClick={createRoom}
            disabled={!username.trim()}
          >
            Create Room
          </button>
        </div>
        
        <div className="divider">OR</div>
        
        <div className="action-group">
          <h3>Join Existing Room</h3>
          <div className="input-group">
            <label htmlFor="roomCode">Room Code:</label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              onKeyPress={(e) => handleKeyPress(e, joinRoom)}
            />
          </div>
          <button 
            className="secondary-button"
            onClick={joinRoom}
            disabled={!username.trim() || !roomCode.trim()}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;