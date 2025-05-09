
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EnrolledCourses from '@/components/student/EnrolledCourses';
import LiveSessions from '@/components/student/LiveSessions';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  title: string;
  lecturer: string;
  recordings: number;
}

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'live'>('courses');
  const { user, userDetails } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableLiveSessions, setAvailableLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch enrolled courses
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', user.id);
        
        if (enrollmentError) throw enrollmentError;
        
        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id);
          
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select(`
              id,
              title,
              lecturer_users(name)
            `)
            .in('id', courseIds);
          
          if (coursesError) throw coursesError;
          
          const processedCourses: Course[] = (coursesData || []).map(course => ({
            id: course.id,
            title: course.title,
            lecturer: course.lecturer_users?.name || 'Unknown',
            recordings: 0 // We'll update this with actual count
          }));
          
          setEnrolledCourses(processedCourses);
        }
        
        // Fetch live sessions
        const { data: liveSessions, error: liveError } = await supabase
          .from('live_sessions')
          .select(`
            id,
            title,
            courses(title),
            lecturer_users(name),
            start_time,
            is_active
          `)
          .eq('is_active', true)
          .order('start_time', { ascending: true });
        
        if (liveError) throw liveError;
        
        setAvailableLiveSessions(liveSessions || []);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <Button onClick={() => window.location.href = '/'} variant="outline">Back to Home</Button>
      </div>

      <div className="flex space-x-4 mb-6">
        <Button 
          variant={activeTab === 'courses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('courses')}
        >
          My Courses
        </Button>
        <Button 
          variant={activeTab === 'live' ? 'default' : 'outline'}
          onClick={() => setActiveTab('live')}
        >
          Live Sessions
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'courses' && 'My Enrolled Courses'}
            {activeTab === 'live' && 'Available Live Sessions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {activeTab === 'courses' && <EnrolledCourses courses={enrolledCourses} />}
              {activeTab === 'live' && <LiveSessions sessions={availableLiveSessions} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
