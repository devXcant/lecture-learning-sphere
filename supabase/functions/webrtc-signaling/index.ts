
// Supabase Edge Function for WebRTC signaling

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Types
interface Participant {
  socket: WebSocket;
  id: string;
  name: string;
  isBroadcaster: boolean;
}

interface Room {
  id: string;
  participants: Map<string, Participant>;
  broadcaster: Participant | null;
}

// In-memory state for rooms
const rooms = new Map<string, Room>();

// Clean up rooms that have been inactive for more than 2 hours
const cleanupInactiveRooms = () => {
  const now = Date.now();
  rooms.forEach((room, roomId) => {
    if (room.participants.size === 0) {
      rooms.delete(roomId);
    }
  });
};

// Schedule cleanup every hour
setInterval(cleanupInactiveRooms, 60 * 60 * 1000);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  // Only accept WebSocket connections
  const upgradeHeader = req.headers.get('upgrade') || '';
  if (upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response(
      JSON.stringify({ error: 'This endpoint requires a WebSocket connection' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
  
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Track connection state
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;
  
  socket.onopen = () => {
    console.log('WebSocket connection opened');
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      const { type, roomId, userId, userName, isBroadcaster = false } = message;
      
      console.log(`Received message type: ${type}, room: ${roomId}, user: ${userId}`);
      
      switch (type) {
        case 'join':
          handleJoin(socket, roomId, userId, userName || 'Anonymous', isBroadcaster);
          currentRoomId = roomId;
          currentUserId = userId;
          break;
          
        case 'offer':
          handleOffer(roomId, userId, message.payload);
          break;
          
        case 'answer':
          handleAnswer(roomId, userId, message.payload);
          break;
          
        case 'ice-candidate':
          handleIceCandidate(roomId, userId, message.payload);
          break;
          
        case 'leave':
          handleLeave(roomId, userId);
          break;
          
        default:
          console.log(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    if (currentRoomId && currentUserId) {
      handleLeave(currentRoomId, currentUserId);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return response;
});

function handleJoin(
  socket: WebSocket,
  roomId: string,
  userId: string,
  userName: string,
  isBroadcaster: boolean
) {
  // Create room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      participants: new Map(),
      broadcaster: null,
    });
  }
  
  const room = rooms.get(roomId)!;
  
  // Create new participant
  const participant: Participant = {
    socket,
    id: userId,
    name: userName,
    isBroadcaster,
  };
  
  // Add participant to room
  room.participants.set(userId, participant);
  
  // If this is the broadcaster, update the room
  if (isBroadcaster) {
    room.broadcaster = participant;
  }
  
  // Notify existing participants about the new user
  if (isBroadcaster) {
    // If broadcaster is joining, notify all participants
    room.participants.forEach((p) => {
      if (p.id !== userId) {
        p.socket.send(JSON.stringify({
          type: 'broadcaster-joined',
          roomId,
          userId,
        }));
      }
    });
  } else {
    // If listener is joining and broadcaster exists, notify broadcaster
    if (room.broadcaster) {
      room.broadcaster.socket.send(JSON.stringify({
        type: 'user-joined',
        roomId,
        userId,
        userName,
      }));
    }
  }
  
  // Send current participants list to everyone
  const participantsList = Array.from(room.participants.values()).map(p => ({
    id: p.id,
    name: p.name,
    isBroadcaster: p.isBroadcaster,
  }));
  
  room.participants.forEach(participant => {
    participant.socket.send(JSON.stringify({
      type: 'participants-list',
      roomId,
      participants: participantsList,
    }));
  });
  
  console.log(`User ${userId} joined room ${roomId}`);
}

function handleOffer(roomId: string, senderId: string, offer: RTCSessionDescriptionInit) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  // Find the target recipient (should be sent to a specific user)
  const targetParticipant = room.participants.get(senderId);
  if (!targetParticipant) return;
  
  // Send the offer to the recipient
  targetParticipant.socket.send(JSON.stringify({
    type: 'offer',
    roomId,
    userId: senderId,
    payload: offer,
  }));
}

function handleAnswer(roomId: string, senderId: string, answer: RTCSessionDescriptionInit) {
  const room = rooms.get(roomId);
  if (!room || !room.broadcaster) return;
  
  // Send the answer to the broadcaster
  room.broadcaster.socket.send(JSON.stringify({
    type: 'answer',
    roomId,
    userId: senderId,
    payload: answer,
  }));
}

function handleIceCandidate(roomId: string, senderId: string, candidate: RTCIceCandidateInit) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  if (room.broadcaster && room.broadcaster.id === senderId) {
    // If sender is broadcaster, send to all participants
    room.participants.forEach((participant) => {
      if (!participant.isBroadcaster) {
        participant.socket.send(JSON.stringify({
          type: 'ice-candidate',
          roomId,
          userId: senderId,
          payload: candidate,
        }));
      }
    });
  } else {
    // If sender is participant, send to broadcaster
    if (room.broadcaster) {
      room.broadcaster.socket.send(JSON.stringify({
        type: 'ice-candidate',
        roomId,
        userId: senderId,
        payload: candidate,
      }));
    }
  }
}

function handleLeave(roomId: string, userId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const participant = room.participants.get(userId);
  if (!participant) return;
  
  // Remove participant from room
  room.participants.delete(userId);
  
  // If the broadcaster left, notify all participants and clean up the room
  if (participant.isBroadcaster && room.broadcaster?.id === userId) {
    room.participants.forEach((p) => {
      p.socket.send(JSON.stringify({
        type: 'session-ended',
        roomId,
      }));
    });
    
    // Delete the room if broadcaster left
    rooms.delete(roomId);
  } else {
    // Notify broadcaster that a participant left
    if (room.broadcaster) {
      room.broadcaster.socket.send(JSON.stringify({
        type: 'user-left',
        roomId,
        userId,
      }));
    }
  }
  
  // If room is empty, delete it
  if (room.participants.size === 0) {
    rooms.delete(roomId);
  }
  
  console.log(`User ${userId} left room ${roomId}`);
}
