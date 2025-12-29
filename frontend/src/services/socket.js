import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const socket = io(SOCKET_URL, { autoConnect: false });

export const joinOrganizerRoom = (organizerId) => {
  socket.emit('join-organizer-room', organizerId);
};

export default socket;