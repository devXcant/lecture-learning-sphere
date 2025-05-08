
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userType, loading, signOut } = useAuth();
  
  // Redirect to role-specific dashboard if user is logged in
  useEffect(() => {
    if (!loading && user && userType) {
      navigate(`/${userType}`);
    }
  }, [user, userType, loading, navigate]);

  // If we're loading, show a spinner
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Learning Sphere</h1>
      
      {!user ? (
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
              <Button onClick={() => navigate('/auth')} className="w-full">
                Sign In as Admin
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
              <Button onClick={() => navigate('/auth')} className="w-full">
                Sign In as Lecturer
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
              <Button onClick={() => navigate('/auth')} className="w-full">
                Sign In as Student
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4">You are signed in as {userType}. Redirecting...</p>
          <Button onClick={signOut} variant="outline">Sign Out</Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
