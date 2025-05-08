
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Mic, Square, Upload } from "lucide-react";

const RecordingStudio: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingDescription, setRecordingDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const courses = [
    { id: 1, title: 'Introduction to Programming' },
    { id: 2, title: 'Data Structures' },
  ];

  const startRecording = () => {
    if (!recordingTitle || !selectedCourse) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a course before recording.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRecording(true);
    setRecordingTime(0);
    
    // In a real app, this would use the Web Audio API to record audio
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prevTime => prevTime + 1);
    }, 1000);
    
    toast({
      title: "Recording Started",
      description: "Your audio recording has begun.",
    });
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    
    // In a real app, this would stop the audio recording and process the file
    
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
      setSelectedFile(e.target.files[0]);
      toast({
        title: "File Selected",
        description: `${e.target.files[0].name} has been selected.`,
      });
    }
  };

  const uploadFile = () => {
    if (!selectedFile || !recordingTitle || !selectedCourse) {
      toast({
        title: "Missing Information",
        description: "Please provide a title, select a course, and select a file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would upload the file to a server
    
    toast({
      title: "File Uploaded",
      description: `${selectedFile.name} has been uploaded successfully.`,
    });
    
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                  disabled={isRecording}
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
                  <Button onClick={startRecording} disabled={!recordingTitle || !selectedCourse}>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                )}
              </div>
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
                
                <Button 
                  onClick={uploadFile} 
                  disabled={!selectedFile || !recordingTitle || !selectedCourse}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Audio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecordingStudio;
