
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Book, BookOpen, Play } from "lucide-react";

interface Course {
  id: string;
  title: string;
  lecturer: string;
  recordings: number;
}

interface Recording {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  created_at: string;
}

interface EnrolledCoursesProps {
  courses?: Course[];
}

const EnrolledCourses: React.FC<EnrolledCoursesProps> = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showRecordingsDialog, setShowRecordingsDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseRecordings, setCourseRecordings] = useState<Recording[]>([]);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Fetch enrolled and available courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      try {
        // Get enrolled courses
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select(`
            course_id,
            courses(
              id,
              title,
              lecturer_id,
              lecturer_users(name)
            )
          `)
          .eq('student_id', user.id);
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Transform the data
        const enrolled = await Promise.all(
          (enrollments || []).map(async (enrollment) => {
            const course = enrollment.courses;
            
            // Get recordings count
            const { count, error: countError } = await supabase
              .from('recordings')
              .select('id', { count: 'exact' })
              .eq('course_id', course.id);
            
            return {
              id: course.id,
              title: course.title,
              lecturer: course.lecturer_users?.name || 'Unknown',
              recordings: countError ? 0 : (count || 0)
            };
          })
        );
        
        setEnrolledCourses(enrolled);
        
        // Get all courses for enrollment
        const { data: allCourses, error: coursesError } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            lecturer_id,
            lecturer_users(name)
          `);
        
        if (coursesError) throw coursesError;
        
        // Filter out already enrolled courses
        const enrolledIds = enrolled.map(c => c.id);
        const available = (allCourses || [])
          .filter(course => !enrolledIds.includes(course.id))
          .map(course => ({
            id: course.id,
            title: course.title,
            lecturer: course.lecturer_users?.name || 'Unknown',
            recordings: 0
          }));
        
        setAvailableCourses(available);
        
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load course data",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [user]);

  const enrollInCourse = async (courseId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId
        });
      
      if (error) throw error;
      
      toast({
        title: "Enrollment Successful",
        description: "You have successfully enrolled in this course.",
      });
      
      // Refresh the course lists
      const enrolledCourse = availableCourses.find(c => c.id === courseId);
      if (enrolledCourse) {
        setEnrolledCourses([...enrolledCourses, enrolledCourse]);
        setAvailableCourses(availableCourses.filter(c => c.id !== courseId));
      }
      
      setShowEnrollDialog(false);
      
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: "There was an error enrolling in the course.",
      });
    }
  };

  const viewCourseRecordings = async (course: Course) => {
    try {
      setSelectedCourse(course);
      
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('course_id', course.id);
      
      if (error) throw error;
      
      setCourseRecordings(data || []);
      setShowRecordingsDialog(true);
      
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load course recordings",
      });
    }
  };

  const playRecording = async (recording: Recording) => {
    try {
      // Get a URL for the recording
      const { data, error } = await supabase.storage
        .from('recordings')
        .createSignedUrl(recording.file_path, 3600); // 1 hour expiry
      
      if (error) throw error;
      
      setCurrentAudio(data.signedUrl);
      
      // Play the audio after a small delay to ensure it's loaded
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
      
    } catch (error) {
      console.error('Error playing recording:', error);
      toast({
        variant: "destructive",
        title: "Playback Error",
        description: "Could not play the recording",
      });
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>My Enrolled Courses</div>
            <Button 
              onClick={() => setShowEnrollDialog(true)} 
              disabled={availableCourses.length === 0}
            >
              Enroll in New Course
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading courses...</div>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-8">
              <Book className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">You are not enrolled in any courses</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setShowEnrollDialog(true)}
                disabled={availableCourses.length === 0}
              >
                Browse Available Courses
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Title</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Recordings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledCourses.map(course => (
                  <TableRow key={course.id}>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.lecturer}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{course.recordings}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        onClick={() => viewCourseRecordings(course)}
                        disabled={course.recordings === 0}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Recordings
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Enroll in Course Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Available Courses</DialogTitle>
            <DialogDescription>
              Select a course to enroll
            </DialogDescription>
          </DialogHeader>
          
          {availableCourses.length === 0 ? (
            <div className="text-center py-4">
              No available courses to enroll in
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Title</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableCourses.map(course => (
                  <TableRow key={course.id}>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.lecturer}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => enrollInCourse(course.id)}
                      >
                        Enroll
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* View Recordings Dialog */}
      <Dialog 
        open={showRecordingsDialog} 
        onOpenChange={(open) => {
          setShowRecordingsDialog(open);
          if (!open) {
            stopPlayback();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse?.title} - Recordings
            </DialogTitle>
            <DialogDescription>
              Lecturer: {selectedCourse?.lecturer}
            </DialogDescription>
          </DialogHeader>
          
          {courseRecordings.length === 0 ? (
            <div className="text-center py-8">
              No recordings available for this course
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseRecordings.map(recording => (
                    <TableRow key={recording.id}>
                      <TableCell>{recording.title}</TableCell>
                      <TableCell>{recording.description || 'N/A'}</TableCell>
                      <TableCell>{new Date(recording.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={currentAudio && isPlaying ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (currentAudio && isPlaying) {
                              stopPlayback();
                            } else {
                              playRecording(recording);
                            }
                          }}
                        >
                          {currentAudio && isPlaying ? (
                            <>Stop</>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Play
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {currentAudio && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Now Playing</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={stopPlayback}
                    >
                      Stop
                    </Button>
                  </div>
                  <audio 
                    ref={audioRef}
                    src={currentAudio}
                    controls
                    className="w-full mt-2"
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnrolledCourses;
