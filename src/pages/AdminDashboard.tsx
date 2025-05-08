
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UserManagement from '@/components/admin/UserManagement';
import CourseManagement from '@/components/admin/CourseManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'lecturers' | 'courses'>('students');

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => window.location.href = '/'} variant="outline">Back to Home</Button>
      </div>

      <div className="flex space-x-4 mb-6">
        <Button 
          variant={activeTab === 'students' ? 'default' : 'outline'}
          onClick={() => setActiveTab('students')}
        >
          Students
        </Button>
        <Button 
          variant={activeTab === 'lecturers' ? 'default' : 'outline'}
          onClick={() => setActiveTab('lecturers')}
        >
          Lecturers
        </Button>
        <Button 
          variant={activeTab === 'courses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('courses')}
        >
          Courses
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'students' && 'Student Management'}
            {activeTab === 'lecturers' && 'Lecturer Management'}
            {activeTab === 'courses' && 'Course Management'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === 'students' && <UserManagement userType="student" />}
          {activeTab === 'lecturers' && <UserManagement userType="lecturer" />}
          {activeTab === 'courses' && <CourseManagement />}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
