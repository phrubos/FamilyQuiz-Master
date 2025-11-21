import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance (lazy initialization)
let _pusherServer: Pusher | null = null;

export const getPusherServer = () => {
  if (!_pusherServer) {
    _pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return _pusherServer;
};

// For backwards compatibility
export const pusherServer = {
  trigger: async (...args: Parameters<Pusher['trigger']>) => {
    return getPusherServer().trigger(...args);
  },
};

// Client-side Pusher instance (lazy initialization)
let _pusherClient: PusherClient | null = null;

export const pusherClient = {
  subscribe: (channel: string) => {
    if (!_pusherClient && typeof window !== 'undefined') {
      _pusherClient = new PusherClient(
        process.env.NEXT_PUBLIC_PUSHER_KEY!,
        {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          // FÁZIS 4: Enable automatic reconnection
          enabledTransports: ['ws', 'wss'],
          disabledTransports: [],
        }
      );
      
      // FÁZIS 4: Connection state monitoring
      _pusherClient.connection.bind('connected', () => {
        console.log('Pusher connected');
      });
      
      _pusherClient.connection.bind('disconnected', () => {
        console.log('Pusher disconnected');
      });
      
      _pusherClient.connection.bind('error', (err: Error) => {
        console.error('Pusher connection error:', err);
      });
      
      _pusherClient.connection.bind('state_change', (states: { previous: string; current: string }) => {
        console.log('Pusher state changed:', states.previous, '->', states.current);
      });
    }
    return _pusherClient!.subscribe(channel);
  },
  unsubscribe: (channel: string) => {
    if (_pusherClient) {
      _pusherClient.unsubscribe(channel);
    }
  },
  getConnectionState: () => {
    return _pusherClient?.connection.state || 'disconnected';
  },
  disconnect: () => {
    if (_pusherClient) {
      _pusherClient.disconnect();
    }
  },
};

// Channel naming
export const getGameChannel = (roomCode: string) => `game-${roomCode}`;
export const getPrivateChannel = (playerId: string) => `private-player-${playerId}`;

// FÁZIS 4: Connection status helper
export const isPusherConnected = () => {
  return pusherClient.getConnectionState() === 'connected';
};
