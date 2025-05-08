
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CourseList from '@/components/lecturer/CourseList';
import RecordingStudio from '@/components/lecturer/RecordingStudio';
import LiveSession from '@/components/lecturer/LiveSession';

const LecturerDashboard = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'record' | 'live'>('courses');
  
  // Mock data - In a real app, this would come from a database
  const lecturerCourses = [
    { id: 1, title: 'Introduction to Programming', students: 23, recordings: 5 },
    { id: 2, title: 'Data Structures', students: 18, recordings: 3 },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lecturer Dashboard</h1>
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
          variant={activeTab === 'record' ? 'default' : 'outline'}
          onClick={() => setActiveTab('record')}
        >
          Record Audio
        </Button>
        <Button 
          variant={activeTab === 'live' ? 'default' : 'outline'}
          onClick={() => setActiveTab('live')}
        >
          Live Session
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'courses' && 'My Courses'}
            {activeTab === 'record' && 'Audio Recording Studio'}
            {activeTab === 'live' && 'Live Audio Session'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === 'courses' && <CourseList courses={lecturerCourses} />}
          {activeTab === 'record' && <RecordingStudio />}
          {activeTab === 'live' && <LiveSession />}
        </CardContent>
      </Card>
    </div>
  );
};

export default LecturerDashboard;
