
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

// Mock data for initial development
const initialUsers = {
  admins: [{ id: 1, name: 'Admin User', email: 'admin@example.com' }],
  lecturers: [
    { id: 1, name: 'Dr. Smith', email: 'smith@example.com', department: 'Computer Science' },
    { id: 2, name: 'Prof. Johnson', email: 'johnson@example.com', department: 'Mathematics' },
  ],
  students: [
    { id: 1, name: 'Jane Doe', email: 'jane@example.com', enrolledCourses: [1, 2] },
    { id: 2, name: 'John Smith', email: 'john@example.com', enrolledCourses: [1] },
  ],
};

const initialCourses = [
  { id: 1, title: 'Introduction to Programming', lecturer: 1, recordings: [] },
  { id: 2, title: 'Advanced Mathematics', lecturer: 2, recordings: [] },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'admin' | 'lecturer' | 'student' | null>(null);

  // In a real app, this would come from authentication
  const handleRoleSelection = (role: 'admin' | 'lecturer' | 'student') => {
    setUserRole(role);
    // In a real app, this would navigate to a role-specific dashboard
    navigate(`/${role}`);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Learning Sphere</h1>
      
      {!userRole && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
              <CardDescription>Manage users and courses</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Access administrative functions to manage all aspects of the platform.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleRoleSelection('admin')} className="w-full">
                Continue as Admin
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lecturer</CardTitle>
              <CardDescription>Manage your courses and recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create courses, upload recordings, and host live sessions for your students.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleRoleSelection('lecturer')} className="w-full">
                Continue as Lecturer
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student</CardTitle>
              <CardDescription>Access your courses and materials</CardDescription>
            </CardHeader>
            <CardContent>
              <p>View course materials, listen to recordings, and join live sessions.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleRoleSelection('student')} className="w-full">
                Continue as Student
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
