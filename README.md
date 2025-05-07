# Poll Battle - Real-Time Voting Application

Poll Battle is a real-time polling application that allows users to create or join poll rooms and vote on questions. Results update instantly across all users in the same room using WebSockets.

![Poll Battle](https://i.imgur.com/example.png)

## Features

- **User Authentication**: Simple username-based authentication with no password required
- **Room Management**: Create new rooms or join existing ones with room codes
- **Real-time Updates**: Live vote counts and percentages using WebSockets
- **Voting System**: One vote per user with visual indicators
- **Countdown Timer**: 60-second timer that automatically ends polls
- **Responsive Design**: Works on desktop and mobile devices
- **Session Persistence**: User sessions are saved in localStorage to persist across page refreshes

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.IO

## Setup Instructions

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd poll-battle
   ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the server:
   ```bash
   npm start
   ```

   The server will run on port 5000 by default.

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

   The application will be available at http://localhost:3000

## How to Use

1. Enter your username on the welcome page
2. Choose to either:
   - Create a new poll room
   - Join an existing room with a room code
3. In the poll room, select one of the two options to cast your vote
4. Watch real-time updates as other users vote
5. The poll automatically closes after 60 seconds

## Architecture and State Management

### Vote State Sharing and Room Management

The application uses a centralized state management approach where the server acts as the source of truth for all poll data. Each poll room is stored in memory on the server using a rooms object with unique room codes as keys. When users perform actions like voting, the server updates its internal state and broadcasts the changes to all connected clients in the specific room.

Socket.IO's room functionality provides an efficient way to manage different polling sessions simultaneously. Each client subscribes only to events for their current room, enabling a scalable system where multiple active poll rooms can exist independently. The socket connection maintains a persistent session, which helps track user identities and prevent duplicate votes.

The vote data structure includes:
- Room information (code, creator, active status)
- User list with voting status
- Vote counts for each option
- A voter map that links socket IDs to their votes
- Timing information for the countdown

This structure ensures data consistency across all clients and provides a robust foundation for real-time updates. When votes come in, the server validates them against this structure before accepting and broadcasting changes.

## Project Structure

```
poll-live-app/
├── server/
│   ├── server.js          # Main server file with Socket.IO logic
│   └── package.json       # Backend dependencies
├── client/
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── PollRoom.jsx
│   │   │   └── WelcomePage.jsx
│   │   ├── services/
│   │   │   └── socket.js  # Shared Socket.IO instance
│   │   ├── App.css        # Application styles
│   │   ├── App.jsx        # Main React component
│   │   └── index.js       # React entry point
│   └── package.json       # Frontend dependencies
└── README.md              # Project documentation
```
