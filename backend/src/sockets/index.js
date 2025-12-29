let io;

exports.initSockets = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);

    socket.on('join-organizer-room', (organizerId) => {
      socket.join(`organizer_${organizerId}`);
    });

    socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
  });
};

exports.getIo = () => io;
