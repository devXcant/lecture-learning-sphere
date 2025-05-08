
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Volume2, VolumeX } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface LiveSessionProps {
  sessions?: any[];
}

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  lecturer: string;
  course_title: string;
  start_time: string;
  is_active: boolean;
}

const LiveSessions: React.FC<LiveSessionProps> = () => {
  const { user } = useAuth();
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const webSocketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch live sessions
  useEffect(() => {
    const fetchLiveSessions = async () => {
      if (!user) return;
      
      try {
        // Get enrolled courses first
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', user.id);
        
        if (enrollmentsError) throw enrollmentsError;
        
        if (!enrollments || enrollments.length === 0) {
          setLiveSessions([]);
          setIsLoading(false);
          return;
        }
        
        const courseIds = enrollments.map(e => e.course_id);
        
        // Get live sessions for enrolled courses
        const { data: sessions, error: sessionsError } = await supabase
          .from('live_sessions')
          .select(`
            id,
            title,
            description,
            start_time,
            is_active,
            lecturer_id,
            lecturer_users(name),
            course_id,
            courses(title)
          `)
          .in('course_id', courseIds)
          .order('start_time', { ascending: false });
        
        if (sessionsError) throw sessionsError;
        
        const formattedSessions = (sessions || []).map(session => ({
          id: session.id,
          title: session.title,
          description: session.description,
          lecturer: session.lecturer_users?.name || 'Unknown',
          course_title: session.courses?.title || 'Unknown Course',
          start_time: session.start_time,
          is_active: session.is_active,
        }));
        
        setLiveSessions(formattedSessions);
        
      } catch (error) {
        console.error('Error fetching live sessions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load live sessions",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLiveSessions();
    
    // Set up polling to refresh session status
    const interval = setInterval(fetchLiveSessions, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const setupWebRTC = async (sessionId: string) => {
    try {
      // Initialize WebSocket connection to signaling server
      const wsUrl = `wss://blnjgaizfqdojvqemjwm.functions.supabase.co/webrtc-signaling`;
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;
      
      // Set up audio output
      pc.ontrack = (event) => {
        if (audioRef.current && event.streams[0]) {
          audioRef.current.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ice-candidate',
            roomId: sessionId,
            userId: user?.id,
            payload: event.candidate
          }));
        }
      };
      
      // WebSocket event handlers
      ws.onopen = () => {
        console.log('WebSocket connection established');
        // Join the session
        ws.send(JSON.stringify({
          type: 'join',
          roomId: sessionId,
          userId: user?.id,
          userName: user?.email || 'Anonymous',
          isBroadcaster: false
        }));
      };
      
      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'offer':
            // Broadcaster has sent us an offer
            await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            ws.send(JSON.stringify({
              type: 'answer',
              roomId: sessionId,
              userId: user?.id,
              payload: answer
            }));
            break;
          
          case 'ice-candidate':
            // Add ICE candidate from broadcaster
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(message.payload));
            }
            break;
          
          case 'session-ended':
            // Broadcaster ended the session
            leaveSession();
            toast({
              title: "Session Ended",
              description: "The live session has ended by the lecturer.",
            });
            break;
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "There was an error connecting to the session.",
        });
        leaveSession();
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        if (isJoined) {
          toast({
            title: "Disconnected",
            description: "You have been disconnected from the session.",
          });
          setIsJoined(false);
        }
      };
      
      setIsJoined(true);
      
      toast({
        title: "Session Joined",
        description: "You have successfully joined the live session.",
      });
      
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to join the live session.",
      });
      leaveSession();
    }
  };

  const joinSession = (session: LiveSession) => {
    setSelectedSession(session);
    setIsDialogOpen(true);
    setupWebRTC(session.id);
  };

  const leaveSession = () => {
    // Close WebSocket connection
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsJoined(false);
    setIsMuted(false);
    setIsDialogOpen(false);
    setSelectedSession(null);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Live Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading sessions...</div>
          ) : liveSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No live sessions are currently available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveSessions.map(session => (
                  <TableRow key={session.id}>
                    <TableCell>{session.title}</TableCell>
                    <TableCell>{session.course_title}</TableCell>
                    <TableCell>{session.lecturer}</TableCell>
                    <TableCell>
                      {session.is_active ? (
                        <Badge className="bg-red-500">Live</Badge>
                      ) : (
                        <Badge variant="secondary">Ended</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline"
                        disabled={!session.is_active}
                        onClick={() => joinSession(session)}
                      >
                        Join
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Live Session Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => !open && leaveSession()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedSession?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Course: {selectedSession?.course_title}
              </p>
              <p className="text-sm text-gray-500">
                Lecturer: {selectedSession?.lecturer}
              </p>
              {selectedSession?.description && (
                <p className="mt-2">{selectedSession.description}</p>
              )}
            </div>
            
            <div className="bg-gray-100 p-4 rounded-md">
              {isJoined ? (
                <div className="flex flex-col items-center">
                  <div className={`text-lg mb-4 ${isMuted ? 'text-gray-500' : 'text-green-500'}`}>
                    {isMuted ? 'Audio Muted' : 'Listening...'}
                  </div>
                  <audio 
                    ref={audioRef} 
                    autoPlay 
                    style={{ display: 'none' }}
                  />
                  <div className="flex space-x-4">
                    <Button onClick={toggleMute} variant="outline">
                      {isMuted ? (
                        <>
                          <Volume2 className="h-4 w-4 mr-2" />
                          Unmute
                        </>
                      ) : (
                        <>
                          <VolumeX className="h-4 w-4 mr-2" />
                          Mute
                        </>
                      )}
                    </Button>
                    <Button onClick={leaveSession} variant="destructive">
                      Leave Session
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Connecting to session...</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveSessions;
