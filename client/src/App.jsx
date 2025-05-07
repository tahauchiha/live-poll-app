import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import WelcomePage from './components/WelcomePage';
import PollRoom from './components/PollRoom';

// Import shared socket
import socket from './services/socket';

function App() {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [pollData, setPollData] = useState(null);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(60);
  
  // Check if user has previous session data in localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('pollBattle_username');
    const storedRoomCode = localStorage.getItem('pollBattle_roomCode');
    
    if (storedUsername && storedRoomCode) {
      setUsername(storedUsername);
      setRoomCode(storedRoomCode);
      
      // Attempt to rejoin the room
      socket.emit('join_room', { roomCode: storedRoomCode, username: storedUsername });
    }
  }, []);
  
  // Socket event listeners
  useEffect(() => {
    console.log("Setting up socket listeners");
    
    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server with socket ID:', socket.id);
    });
    
    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });
    
    socket.on('error', (data) => {
      setError(data.message);
      console.error('Socket error:', data.message);
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
    });
    
    socket.on('room_created', (data) => {
      console.log('Room created:', data.roomCode);
      setRoomCode(data.roomCode);
      setPollData(data.pollData);
      
      // Save session data
      localStorage.setItem('pollBattle_username', username);
      localStorage.setItem('pollBattle_roomCode', data.roomCode);
    });
    
    socket.on('room_joined', (data) => {
      console.log('Room joined:', data.roomCode);
      setRoomCode(data.roomCode);
      setPollData(data.pollData);
      
      // Save session data
      localStorage.setItem('pollBattle_username', username);
      localStorage.setItem('pollBattle_roomCode', data.roomCode);
    });
    
    socket.on('vote_update', (data) => {
      console.log('Vote update received:', data);
      setPollData(data.pollData);
    });
    
    socket.on('time_update', (data) => {
      setRemainingTime(Math.floor(data.remainingTime / 1000));
    });
    
    socket.on('poll_ended', (data) => {
      console.log('Poll ended:', data);
      setPollData(data.pollData);
    });
    
    socket.on('user_joined', (data) => {
      console.log('User joined:', data);
      setPollData(data.pollData);
    });
    
    socket.on('user_left', (data) => {
      console.log('User left:', data);
      setPollData(data.pollData);
    });
    
    return () => {
      console.log("Cleaning up socket listeners");
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('vote_update');
      socket.off('time_update');
      socket.off('poll_ended');
      socket.off('user_joined');
      socket.off('user_left');
    };
  }, [username]);
  
  // Handle creating a new room
  const createRoom = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    socket.emit('create_room', { username });
  };
  
  // Handle joining an existing room
  const joinRoom = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    socket.emit('join_room', { roomCode, username });
  };
  
  // Handle submitting a vote
  const submitVote = (option) => {
    socket.emit('submit_vote', { roomCode, option, username });
  };
  
  // Handle leaving a room
  const leaveRoom = () => {
    setPollData(null);
    setRoomCode('');
    localStorage.removeItem('pollBattle_roomCode');
  };
  
  return (
    <div className="app-container">
      <header>
        <h1>Poll Battle</h1>
        {connected ? (
          <span className="connection-status connected">Connected</span>
        ) : (
          <span className="connection-status disconnected">Disconnected</span>
        )}
      </header>
      
      {error && <div className="error-message">{error}</div>}
      
      {!pollData ? (
        <WelcomePage 
          username={username}
          setUsername={setUsername}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          createRoom={createRoom}
          joinRoom={joinRoom}
        />
      ) : (
        <PollRoom 
          pollData={pollData}
          username={username}
          roomCode={roomCode}
          remainingTime={remainingTime}
          submitVote={submitVote}
          leaveRoom={leaveRoom}
        />
      )}
    </div>
  );
}

export default App;