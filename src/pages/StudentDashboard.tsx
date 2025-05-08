
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EnrolledCourses from '@/components/student/EnrolledCourses';
import LiveSessions from '@/components/student/LiveSessions';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'live'>('courses');
  
  // Mock data - In a real app, this would come from a database
  const enrolledCourses = [
    { id: 1, title: 'Introduction to Programming', lecturer: 'Dr. Smith', recordings: 5 },
    { id: 2, title: 'Advanced Mathematics', lecturer: 'Prof. Johnson', recordings: 3 },
  ];

  const availableLiveSessions = [
    { id: 1, title: 'Programming Q&A Session', lecturer: 'Dr. Smith', startTime: '2:00 PM', active: true },
    { id: 2, title: 'Math Problem Solving', lecturer: 'Prof. Johnson', startTime: '4:00 PM', active: false },
  ];

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
          {activeTab === 'courses' && <EnrolledCourses courses={enrolledCourses} />}
          {activeTab === 'live' && <LiveSessions sessions={availableLiveSessions} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
