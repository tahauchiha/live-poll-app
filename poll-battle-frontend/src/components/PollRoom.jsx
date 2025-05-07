import React from 'react';
import socket from '../services/socket';

function PollRoom({ pollData, username, roomCode, remainingTime, submitVote, leaveRoom }) {
  const { question, options, votes, voterMap, isActive, users } = pollData;
  
  console.log("Socket ID in PollRoom:", socket.id);
  console.log("Voter Map:", voterMap);
  
  // Check if current user has voted by checking socket id
  const hasVoted = Boolean(voterMap[socket.id]);
  console.log("Has voted:", hasVoted);
  
  // Calculate total votes
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
  
  // Calculate percentage for each option
  const getPercentage = (votes, option) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes[option] / totalVotes) * 100);
  };
  
  // Format time remaining
  const formatTime = (seconds) => {
    return `${seconds}s`;
  };
  
  // Find winning option or tie
  const getWinner = () => {
    if (totalVotes === 0) return "No votes yet";
    
    const maxVotes = Math.max(...Object.values(votes));
    const winners = Object.keys(votes).filter(option => votes[option] === maxVotes);
    
    if (winners.length > 1) return "It's a tie!";
    return `${winners[0]} wins!`;
  };
  
  return (
    <div className="poll-room">
      <div className="room-header">
        <div className="room-info">
          <h2>Room: {roomCode}</h2>
          <div className="participants">
            <span>{users.length} Participant{users.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="timer-container">
          <div className="timer">
            {isActive ? (
              <span>Time Remaining: {formatTime(remainingTime)}</span>
            ) : (
              <span className="poll-ended">Poll Ended</span>
            )}
          </div>
        </div>
        
        <button className="leave-button" onClick={leaveRoom}>Leave Room</button>
      </div>
      
      <div className="poll-container">
        <h3 className="poll-question">{question}</h3>
        
        <div className="poll-options">
          {options.map((option) => (
            <div key={option} className="poll-option">
              <div className="option-header">
                <span className="option-name">{option}</span>
                <span className="vote-count">
                  {votes[option]} vote{votes[option] !== 1 ? 's' : ''} ({getPercentage(votes, option)}%)
                </span>
              </div>
              
              <div className="progress-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${getPercentage(votes, option)}%` }}
                />
              </div>
              
              {isActive && !hasVoted && (
                <button 
                  className="vote-button"
                  onClick={() => submitVote(option)}
                >
                  Vote
                </button>
              )}
              
              {hasVoted && voterMap[socket.id] === option && (
                <span className="your-vote">Your vote</span>
              )}
            </div>
          ))}
        </div>
        
        {hasVoted && (
          <div className="vote-status">
            You voted for: <strong>{voterMap[socket.id]}</strong>
          </div>
        )}
        
        {!isActive && (
          <div className="final-result">
            <h3>Final Result: {getWinner()}</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default PollRoom;