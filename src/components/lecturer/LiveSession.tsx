
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Mic, MicOff, User } from "lucide-react";

const LiveSession: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [liveTime, setLiveTime] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  // Mock data
  const courses = [
    { id: 1, title: 'Introduction to Programming' },
    { id: 2, title: 'Data Structures' },
  ];

  const startLiveSession = () => {
    if (!sessionTitle || !selectedCourse) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a course before starting a live session.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLive(true);
    setLiveTime(0);
    // Simulate some students joining
    setParticipants([
      'Jane Doe',
      'John Smith',
      'Maria Garcia',
    ]);
    
    // In a real app, this would set up WebRTC or similar for audio streaming
    
    // Simulate sending notifications to students
    toast({
      title: "Live Session Started",
      description: "Notifications sent to all enrolled students.",
    });
    
    // Start a timer to track session duration
    setInterval(() => {
      setLiveTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const endLiveSession = () => {
    setIsLive(false);
    setParticipants([]);
    
    // In a real app, this would close the WebRTC connections
    
    toast({
      title: "Live Session Ended",
      description: `Your session lasted ${formatTime(liveTime)}.`,
    });
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    toast({
      title: isMuted ? "Microphone Unmuted" : "Microphone Muted",
      description: isMuted ? "Students can now hear you again." : "Students cannot hear you.",
    });
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
                disabled={!sessionTitle || !selectedCourse}
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
                  <Button variant="destructive" onClick={endLiveSession}>
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
                    {participants.map((name, index) => (
                      <div key={index} className="flex items-center py-2 border-b last:border-0">
                        <User className="h-4 w-4 mr-2" />
                        <span>{name}</span>
                      </div>
                    ))}
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
