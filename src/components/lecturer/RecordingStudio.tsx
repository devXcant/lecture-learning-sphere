
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Mic, Square, Upload, Play, Pause } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';

const RecordingStudio: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingDescription, setRecordingDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch lecturer's courses
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

  const startRecording = async () => {
    if (!recordingTitle || !selectedCourse) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a course before recording.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        
        // Create a File object for potential upload
        const recordingFile = new File([audioBlob], `${recordingTitle}.webm`, { type: 'audio/webm' });
        setSelectedFile(recordingFile);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Your audio recording has begun.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not access your microphone. Please ensure it's connected and permissions are granted.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    
    toast({
      title: "Recording Complete",
      description: `Your ${formatTime(recordingTime)} recording has been saved.`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAudioURL(URL.createObjectURL(file));
      
      toast({
        title: "File Selected",
        description: `${file.name} has been selected.`,
      });
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !recordingTitle || !selectedCourse) {
      toast({
        title: "Missing Information",
        description: "Please provide a title, select a course, and select a file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploadProgress(0);
      
      // Generate a unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user!.id}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('recordings')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });
      
      if (uploadError) throw uploadError;
      
      // Save record in the database
      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          title: recordingTitle,
          description: recordingDescription || null,
          file_path: filePath,
          course_id: selectedCourse,
          lecturer_id: user!.id
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: "Upload Successful",
        description: "Your recording has been uploaded successfully.",
      });
      
      // Reset the form
      setSelectedFile(null);
      setAudioURL(null);
      setRecordingTitle('');
      setRecordingDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadProgress(0);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "There was a problem uploading your file.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Record Audio</CardTitle>
            <CardDescription>
              Record a new audio lecture for your students
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
                  disabled={isRecording || isLoading}
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
                <label className="block text-sm font-medium mb-1">Recording Title</label>
                <Input
                  placeholder="e.g., Lecture 1: Introduction"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  disabled={isRecording}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  placeholder="Describe what this recording is about..."
                  value={recordingDescription}
                  onChange={(e) => setRecordingDescription(e.target.value)}
                  disabled={isRecording}
                />
              </div>
              
              <div className="bg-gray-100 rounded-md p-4 text-center">
                {isRecording ? (
                  <div className="flex flex-col items-center">
                    <div className="text-red-500 animate-pulse text-xl mb-2">
                      Recording... {formatTime(recordingTime)}
                    </div>
                    <Button onClick={stopRecording} variant="destructive">
                      <Square className="mr-2 h-4 w-4" />
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={startRecording} 
                    disabled={!recordingTitle || !selectedCourse}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                )}
              </div>

              {audioURL && !isRecording && (
                <div className="bg-gray-100 rounded-md p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Preview Recording</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={togglePlayback}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 mr-1" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                  </div>
                  <audio 
                    ref={audioRef} 
                    src={audioURL} 
                    onEnded={() => setIsPlaying(false)} 
                    className="w-full" 
                    controls
                    style={{ display: 'none' }}
                  />
                  <Button 
                    onClick={uploadFile} 
                    disabled={!selectedFile || !recordingTitle || !selectedCourse}
                    className="w-full mt-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Recording
                  </Button>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-center text-sm mt-1">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload Audio File</CardTitle>
            <CardDescription>
              Upload an existing audio recording
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
                <label className="block text-sm font-medium mb-1">Recording Title</label>
                <Input
                  placeholder="e.g., Lecture 1: Introduction"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  placeholder="Describe what this recording is about..."
                  value={recordingDescription}
                  onChange={(e) => setRecordingDescription(e.target.value)}
                />
              </div>
              
              <div className="bg-gray-100 rounded-md p-4">
                <div className="mb-4">
                  <input 
                    type="file" 
                    accept="audio/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="w-full"
                  />
                </div>
                
                {selectedFile && (
                  <div className="text-sm mb-2">
                    Selected file: {selectedFile.name}
                  </div>
                )}

                {audioURL && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Preview File</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={togglePlayback}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                    </div>
                    <audio 
                      ref={audioRef} 
                      src={audioURL} 
                      onEnded={() => setIsPlaying(false)} 
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
                
                <Button 
                  onClick={uploadFile} 
                  disabled={!selectedFile || !recordingTitle || !selectedCourse}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Audio
                </Button>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-center text-sm mt-1">{uploadProgress}% uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecordingStudio;
