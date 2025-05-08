
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Mic, MicOff, User, Users, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';

const LiveSession: React.FC = () => {
  const { user, userDetails } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [liveTime, setLiveTime] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // WebRTC related state
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const localStreamRef = useRef<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('lecturer_id', user.id);
        
        if (error) throw error;
        
        setCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your courses",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [user]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup WebRTC resources
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Cleanup WebSocket connection
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      
      // Cleanup timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // If live session is still active, end it
      if (isLive && sessionId) {
        endLiveSession(true);
      }
    };
  }, [isLive, sessionId]);

  // Setup WebRTC for broadcasting
  const setupWebRTC = async () => {
    try {
      // Get local audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      // Initialize WebSocket connection to signaling server
      const wsUrl = `wss://blnjgaizfqdojvqemjwm.functions.supabase.co/webrtc-signaling`;
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        // Send join message as broadcaster
        if (sessionId) {
          ws.send(JSON.stringify({
            type: 'join',
            roomId: sessionId,
            userId: user?.id,
            isBroadcaster: true
          }));
        }
      };
      
      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'user-joined':
            // New listener joined, create a peer connection
            handleNewParticipant(message.userId, message.userName);
            break;
          
          case 'offer':
            // We don't need to handle offers as broadcaster
            break;
          
          case 'answer':
            // Remote peer has answered our offer
            const pc = peerConnections.get(message.userId);
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
            }
            break;
          
          case 'ice-candidate':
            // Add ICE candidate to the peer connection
            const connection = peerConnections.get(message.userId);
            if (connection) {
              await connection.addIceCandidate(new RTCIceCandidate(message.payload));
            }
            break;
          
          case 'user-left':
            // Remove participant
            handleParticipantLeft(message.userId);
            break;
            
          case 'participants-list':
            // Update participants list
            setParticipants(message.participants.map((p: any) => p.name));
            break;
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "There was an error connecting to the session server.",
        });
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
      
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: "Could not access your microphone. Please ensure it's connected and permissions are granted.",
      });
      
      // End the session if can't set up WebRTC
      if (isLive) {
        endLiveSession();
      }
    }
  };

  const handleNewParticipant = async (userId: string, userName: string) => {
    if (!localStreamRef.current) return;
    
    try {
      // Create new peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      
      // Add all tracks from local stream
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && webSocketRef.current) {
          webSocketRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            roomId: sessionId,
            userId: userId,
            payload: event.candidate
          }));
        }
      };
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (webSocketRef.current) {
        webSocketRef.current.send(JSON.stringify({
          type: 'offer',
          roomId: sessionId,
          userId: userId,
          payload: offer
        }));
      }
      
      // Add to peer connections map
      setPeerConnections(prev => new Map(prev).set(userId, pc));
      
      // Update participants list
      setParticipants(prev => [...prev, userName]);
      
    } catch (error) {
      console.error('Error handling new participant:', error);
    }
  };

  const handleParticipantLeft = (userId: string) => {
    // Close the peer connection
    const pc = peerConnections.get(userId);
    if (pc) {
      pc.close();
      const newPeerConnections = new Map(peerConnections);
      newPeerConnections.delete(userId);
      setPeerConnections(newPeerConnections);
    }
    
    // Update participants (this is a simplification)
    setParticipants(prev => prev.filter(p => p !== userId));
  };

  const startLiveSession = async () => {
    if (!sessionTitle || !selectedCourse) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a course before starting a live session.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create live session record in the database
      const { data, error } = await supabase
        .from('live_sessions')
        .insert({
          title: sessionTitle,
          description: sessionDescription || null,
          course_id: selectedCourse,
          lecturer_id: user!.id,
          is_active: true,
          start_time: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setSessionId(data.id);
      setIsLive(true);
      setLiveTime(0);
      
      // Start WebRTC for broadcasting
      await setupWebRTC();
      
      // Start timer to track session duration
      timerRef.current = setInterval(() => {
        setLiveTime(prevTime => prevTime + 1);
      }, 1000);
      
      toast({
        title: "Live Session Started",
        description: "Your live audio session has begun.",
      });
      
    } catch (error) {
      console.error('Error starting live session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start the live session.",
      });
    }
  };

  const endLiveSession = async (isCleanup = false) => {
    try {
      // Stop all audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close WebSocket connection
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      
      // Close all peer connections
      peerConnections.forEach(pc => pc.close());
      setPeerConnections(new Map());
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Update the session record in the database
      if (sessionId) {
        const { error } = await supabase
          .from('live_sessions')
          .update({
            is_active: false,
            end_time: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        if (error && !isCleanup) throw error;
      }
      
      setIsLive(false);
      setSessionId(null);
      setParticipants([]);
      
      if (!isCleanup) {
        toast({
          title: "Live Session Ended",
          description: `Your session lasted ${formatTime(liveTime)}.`,
        });
      }
    } catch (error) {
      console.error('Error ending live session:', error);
      if (!isCleanup) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was an error ending the session.",
        });
      }
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      
      setIsMuted(!isMuted);
      
      toast({
        title: isMuted ? "Microphone Unmuted" : "Microphone Muted",
        description: isMuted ? "Students can now hear you again." : "Students cannot hear you.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div>
      {!isLive ? (
        <Card>
          <CardHeader>
            <CardTitle>Start a Live Audio Session</CardTitle>
            <CardDescription>
              Create a live audio session for your students to join and participate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select a course...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Session Title</label>
                <Input
                  placeholder="e.g., Q&A Session for Midterm"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  placeholder="Describe what this session will cover..."
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={startLiveSession} 
                disabled={!sessionTitle || !selectedCourse || isLoading}
                className="w-full"
              >
                <Mic className="mr-2 h-4 w-4" />
                Start Live Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div>
                  LIVE: {sessionTitle}
                  <div className="text-sm font-normal text-red-500">
                    Duration: {formatTime(liveTime)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={toggleMute}>
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button variant="destructive" onClick={() => endLiveSession()}>
                    End Session
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {sessionDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Audio Controls</h3>
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <div className="text-center mb-4">
                      {isMuted ? (
                        <div className="text-red-500">Your microphone is muted</div>
                      ) : (
                        <div className="text-green-500">Your microphone is active</div>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <Button variant={isMuted ? "outline" : "destructive"} onClick={toggleMute}>
                        {isMuted ? (
                          <>
                            <Mic className="mr-2 h-4 w-4" />
                            Unmute
                          </>
                        ) : (
                          <>
                            <MicOff className="mr-2 h-4 w-4" />
                            Mute
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">
                    Participants ({participants.length})
                  </h3>
                  <div className="bg-white p-4 rounded-md shadow-sm h-[200px] overflow-y-auto">
                    {participants.length === 0 ? (
                      <div className="text-center text-gray-500 py-4">
                        No participants yet
                      </div>
                    ) : (
                      participants.map((name, index) => (
                        <div key={index} className="flex items-center py-2 border-b last:border-0">
                          <User className="h-4 w-4 mr-2" />
                          <span>{name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveSession;
