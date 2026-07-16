import { Server } from 'socket.io';

const PORT = 3005;

const io = new Server(PORT, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

console.log(`[notification-service] Socket.io server listening on port ${PORT}`);

// Track connected users
const connectedUsers = new Map<string, Set<string>>();

/**
 * Send a notification to a specific user by userId.
 * Emits the 'notification' event to the user's room.
 */
function sendNotification(userId: string, data: unknown) {
  const room = `user_${userId}`;
  io.to(room).emit('notification', data);
  console.log(`[notification-service] Sent notification to ${room}`, data);
}

// Export for programmatic use
export { io, sendNotification };

// Handle connections
io.on('connection', (socket) => {
  console.log(`[notification-service] Client connected: ${socket.id}`);

  // Client must emit 'join' with { userId } to join their room
  socket.on('join', ({ userId }: { userId: string }) => {
    if (!userId || typeof userId !== 'string') {
      console.warn(`[notification-service] Invalid join attempt from ${socket.id}`);
      return;
    }

    const room = `user_${userId}`;
    socket.join(room);

    // Track the socket for this user
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);

    console.log(`[notification-service] Socket ${socket.id} joined room ${room} (user: ${userId}, total sockets for user: ${connectedUsers.get(userId)!.size})`);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`[notification-service] Client disconnected: ${socket.id} (reason: ${reason})`);

    // Clean up from tracking
    for (const [userId, sockets] of connectedUsers.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);
        }
        break;
      }
    }
  });

  // Handle errors
  socket.on('error', (err) => {
    console.error(`[notification-service] Socket error from ${socket.id}:`, err.message);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[notification-service] Shutting down...');
  io.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[notification-service] Shutting down...');
  io.close();
  process.exit(0);
});