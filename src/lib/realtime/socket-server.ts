import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

let io: SocketIOServer | null = null;

export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      // Verify JWT token
      // Attach user to socket
      socket.data.userId = 'user-id-from-token';
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle class participation
    socket.on('join:class', (classId: string) => {
      socket.join(`class:${classId}`);
      socket.to(`class:${classId}`).emit('user:joined', {
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('leave:class', (classId: string) => {
      socket.leave(`class:${classId}`);
    });

    // Handle exam monitoring
    socket.on('join:exam', (examId: string) => {
      socket.join(`exam:${examId}`);
    });

    // Handle chat messages
    socket.on('chat:message', (data: {
      classId: string;
      message: string;
      type?: 'text' | 'question' | 'answer';
    }) => {
      io?.to(`class:${data.classId}`).emit('chat:message', {
        userId,
        message: data.message,
        type: data.type || 'text',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle real-time analytics updates
    socket.on('subscribe:analytics', () => {
      socket.join('analytics');
    });

    // Handle presence
    socket.on('presence:online', () => {
      io?.emit('presence:update', {
        userId,
        status: 'online',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle typing indicators
    socket.on('typing:start', (roomId: string) => {
      socket.to(roomId).emit('typing:start', { userId });
    });

    socket.on('typing:stop', (roomId: string) => {
      socket.to(roomId).emit('typing:stop', { userId });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      io?.emit('presence:update', {
        userId,
        status: 'offline',
        timestamp: new Date().toISOString(),
      });
    });
  });

  // Make io globally available
  global.io = io;

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

// Extend global type
declare global {
  var io: SocketIOServer | undefined;
}