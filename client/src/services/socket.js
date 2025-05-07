// Socket service to provide a single socket instance across components
import io from 'socket.io-client';

// Create a single socket instance
const socket = io('https://live-poll-app-server.onrender.com/');

export default socket;
