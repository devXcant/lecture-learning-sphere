
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Mic, Square, Disc } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Course {
  id: string;
  title: string;
}

const RecordingStudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { user } = useAuth();

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
          description: "Failed to load courses.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [user]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Create object URL for playback
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(audioBlob);
        }
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer to show recording duration
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Your audio is now being recorded.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast({
        title: "Recording Stopped",
        description: "Your recording is ready for preview.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUpload = async () => {
    if (!audioBlob || !title || !selectedCourseId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a title and select a course.",
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Generate a unique filename
      const fileName = `${Date.now()}_${title.replace(/\s+/g, '_')}.wav`;
      const filePath = `recordings/${user?.id}/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(filePath, audioBlob, {
          cacheControl: '3600'
        });
      
      if (uploadError) throw uploadError;
      
      // Create database entry
      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          title,
          description,
          lecturer_id: user?.id,
          course_id: selectedCourseId,
          file_path: filePath
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: "Upload Successful",
        description: "Your recording has been uploaded.",
      });
      
      // Reset form
      setAudioBlob(null);
      setTitle('');
      setDescription('');
      setSelectedCourseId('');
      if (audioRef.current) {
        audioRef.current.src = '';
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Failed to upload recording. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold">Audio Recording Studio</h2>
          <p className="text-gray-500">Record audio lectures for your courses</p>
        </div>
        
        {isRecording ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center h-24 w-24 rounded-full bg-red-100 animate-pulse">
              <Mic className="h-10 w-10 text-red-500" />
            </div>
            <div className="text-xl font-mono">{formatTime(recordingTime)}</div>
            <Button 
              variant="destructive" 
              onClick={stopRecording}
              className="flex items-center"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {audioBlob ? (
              <>
                <div className="flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
                  <Disc className="h-10 w-10 text-green-500" />
                </div>
                <audio ref={audioRef} controls className="w-full max-w-md" />
              </>
            ) : (
              <div className="flex items-center justify-center h-24 w-24 rounded-full bg-blue-100">
                <Mic className="h-10 w-10 text-blue-500" />
              </div>
            )}
            
            {!audioBlob && (
              <Button 
                onClick={startRecording}
                className="flex items-center"
              >
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            )}
          </div>
        )}
      </Card>
      
      {audioBlob && !isRecording && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Recording Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter a title for your recording"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Add a description"
              />
            </div>
            
            <div>
              <Label htmlFor="course">Course</Label>
              <select
                id="course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={loading}
              >
                <option value="">Select a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            <Button 
              onClick={handleUpload} 
              disabled={!title || !selectedCourseId || uploading}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Recording"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RecordingStudio;
