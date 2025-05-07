// Backend server implementation for Poll Battle
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, specify your frontend URL
    methods: ["GET", "POST"]
  }
});

// Store rooms and their poll data in memory
const pollRooms = {};

// Generate a random room code (4 alphanumeric characters)
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new poll room
  socket.on('create_room', ({ username }) => {
    const roomCode = generateRoomCode();
    
    // Create room with initial data
    pollRooms[roomCode] = {
      creator: username,
      users: [{ id: socket.id, username, hasVoted: false, connected: true }],
      question: "Cats vs Dogs", // Default question
      options: ["Cats", "Dogs"],
      votes: { "Cats": 0, "Dogs": 0 },
      voterMap: {}, // Maps socket IDs to their votes
      startTime: Date.now(),
      endTime: Date.now() + 60000, // 60 seconds
      isActive: true
    };

    // Join the room
    socket.join(roomCode);
    
    // Start room timer
    startRoomTimer(roomCode);
    
    // Send room data to creator
    socket.emit('room_created', { roomCode, pollData: pollRooms[roomCode] });
    console.log(`Room created: ${roomCode} by ${username} with socket ID ${socket.id}`);
  });

  // Join an existing room
  socket.on('join_room', ({ roomCode, username }) => {
    console.log(`Attempting to join room: ${roomCode} with username: ${username} and socketId: ${socket.id}`);
    
    // Check if room exists
    if (!pollRooms[roomCode]) {
      socket.emit('error', { message: "Room not found" });
      return;
    }

    // Join the room
    socket.join(roomCode);
    
    // Check if user already exists in the room (reconnecting case)
    const existingUserIndex = pollRooms[roomCode].users.findIndex(
      user => user.username === username
    );
    
    if (existingUserIndex !== -1) {
      // Update the existing user's socket ID and mark as connected
      pollRooms[roomCode].users[existingUserIndex].id = socket.id;
      pollRooms[roomCode].users[existingUserIndex].connected = true;
      console.log(`User ${username} reconnected with new socket ID: ${socket.id}`);
    } else {
      // Add user to room as a new user
      pollRooms[roomCode].users.push({ 
        id: socket.id, 
        username, 
        hasVoted: false,
        connected: true
      });
      console.log(`New user ${username} joined room: ${roomCode}`);
    }
    
    // Send room data to the user
    socket.emit('room_joined', { 
      roomCode, 
      pollData: pollRooms[roomCode] 
    });
    
    // Notify everyone in the room about new or reconnected user
    io.to(roomCode).emit('user_joined', { 
      username, 
      userCount: pollRooms[roomCode].users.length,
      pollData: pollRooms[roomCode]
    });
  });

  // Handle votes
  socket.on('submit_vote', ({ roomCode, option, username }) => {
    console.log(`Vote attempt in room ${roomCode}: ${username} (${socket.id}) voting for ${option}`);
    
    const room = pollRooms[roomCode];
    
    // Check if room exists and is active
    if (!room || !room.isActive) {
      socket.emit('error', { message: "Room closed or not found" });
      return;
    }
    
    // Check if user has already voted (using socket ID)
    if (room.voterMap[socket.id]) {
      socket.emit('error', { message: "You have already voted" });
      return;
    }
    
    // Record the vote
    room.votes[option]++;
    room.voterMap[socket.id] = option;
    
    // Update user's voting status
    const userIndex = room.users.findIndex(user => user.id === socket.id);
    if (userIndex !== -1) {
      room.users[userIndex].hasVoted = true;
      console.log(`User ${username} marked as voted`);
    } else {
      console.log(`Could not find user with socket ID ${socket.id} in the users array`);
    }
    
    // Broadcast updated poll data to all users in the room
    io.to(roomCode).emit('vote_update', { 
      pollData: room,
      voter: username
    });
    
    console.log(`Vote recorded in room ${roomCode}: ${username} voted for ${option}`);
    console.log(`Current votes: Cats: ${room.votes["Cats"]}, Dogs: ${room.votes["Dogs"]}`);
    console.log(`Voter map:`, room.voterMap);
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find rooms the user was in and update user lists
    for (const roomCode in pollRooms) {
      const room = pollRooms[roomCode];
      const userIndex = room.users.findIndex(user => user.id === socket.id);
      
      if (userIndex !== -1) {
        const username = room.users[userIndex].username;
        console.log(`Found user ${username} in room ${roomCode}`);
        
        // Don't remove users immediately, just update their status
        // This helps with page refreshes so they can rejoin with the same name
        room.users[userIndex].connected = false;
        
        // Set a timeout to actually remove disconnected users after 60 seconds
        // This gives them time to reconnect if it was just a page refresh
        setTimeout(() => {
          // Check if the user is still marked as disconnected
          const currentRoom = pollRooms[roomCode];
          if (currentRoom) {
            const userStillExists = currentRoom.users.findIndex(
              u => u.username === username && !u.connected
            );
            
            if (userStillExists !== -1) {
              // If they haven't reconnected, now we can remove them
              currentRoom.users.splice(userStillExists, 1);
              console.log(`User ${username} removed from room ${roomCode} after timeout`);
              
              // If room is empty, remove it
              if (currentRoom.users.length === 0) {
                delete pollRooms[roomCode];
                console.log(`Room ${roomCode} removed as it's empty`);
              } else {
                // Notify remaining users
                io.to(roomCode).emit('user_left', { 
                  username,
                  userCount: currentRoom.users.length,
                  pollData: currentRoom
                });
              }
            }
          }
        }, 60000); // 60 second timeout
        
        // Notify users that someone disconnected (but might come back)
        io.to(roomCode).emit('user_left', { 
          username,
          userCount: room.users.length,
          pollData: room,
          temporary: true
        });
      }
    }
  });
});

// Function to start and manage room timer
function startRoomTimer(roomCode) {
  const intervalId = setInterval(() => {
    const room = pollRooms[roomCode];
    
    // Room might have been deleted if everyone left
    if (!room) {
      clearInterval(intervalId);
      return;
    }
    
    const currentTime = Date.now();
    const remainingTime = Math.max(0, room.endTime - currentTime);
    
    // Send time updates every second
    io.to(roomCode).emit('time_update', { 
      remainingTime,
      isActive: room.isActive
    });
    
    // End poll when time is up
    if (currentTime >= room.endTime && room.isActive) {
      room.isActive = false;
      io.to(roomCode).emit('poll_ended', { 
        results: room.votes,
        pollData: room
      });
      
      console.log(`Poll ended in room ${roomCode}`);
      clearInterval(intervalId);
    }
  }, 1000);
}

// Serve a simple status endpoint
app.get('/', (req, res) => {
  res.send('Poll Battle WebSocket Server is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});