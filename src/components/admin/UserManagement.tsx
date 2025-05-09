
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserFormDialog from './UserFormDialog';
import type { UserFormData } from './UserFormDialog';

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  enrolledCourses?: number;
}

interface UserManagementProps {
  userType: 'student' | 'lecturer';
}

const UserManagement: React.FC<UserManagementProps> = ({ userType }) => {
  // Mock data - In a real app, this would come from a database
  const [users, setUsers] = useState<User[]>(
    userType === 'student' 
      ? [
          { id: '1', name: 'Jane Doe', email: 'jane@example.com', enrolledCourses: 2 },
          { id: '2', name: 'John Smith', email: 'john@example.com', enrolledCourses: 1 },
        ]
      : [
          { id: '1', name: 'Dr. Smith', email: 'smith@example.com', department: 'Computer Science' },
          { id: '2', name: 'Prof. Johnson', email: 'johnson@example.com', department: 'Mathematics' },
        ]
  );
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const handleAddUser = (userData: UserFormData) => {
    const newUser: User = {
      ...userData,
      id: (users.length + 1).toString(),
    };
    setUsers([...users, newUser]);
    toast({
      title: `${userType === 'student' ? 'Student' : 'Lecturer'} Added`,
      description: `${userData.name} has been successfully added.`,
    });
    setIsAddDialogOpen(false);
  };
  
  const handleEditUser = (updatedUserData: UserFormData) => {
    if (!currentUser) return;
    
    const updatedUser: User = {
      ...currentUser,
      ...updatedUserData
    };
    
    setUsers(users.map(user => (user.id === currentUser.id ? updatedUser : user)));
    toast({
      title: `${userType === 'student' ? 'Student' : 'Lecturer'} Updated`,
      description: `${updatedUserData.name} has been successfully updated.`,
    });
    setIsEditDialogOpen(false);
    setCurrentUser(null);
  };
  
  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
    toast({
      title: `${userType === 'student' ? 'Student' : 'Lecturer'} Deleted`,
      description: `User has been successfully removed.`,
    });
  };
  
  const openEditDialog = (user: User) => {
    setCurrentUser(user);
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input
          placeholder={`Search ${userType === 'student' ? 'students' : 'lecturers'}...`}
          className="w-64"
        />
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add {userType === 'student' ? 'Student' : 'Lecturer'}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>
              {userType === 'student' ? 'Enrolled Courses' : 'Department'}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {userType === 'student' ? user.enrolledCourses : user.department}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" className="mr-2" onClick={() => openEditDialog(user)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserFormDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddUser}
        title={`Add ${userType === 'student' ? 'Student' : 'Lecturer'}`}
        userType={userType}
      />

      {isEditDialogOpen && currentUser && (
        <UserFormDialog 
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setCurrentUser(null);
          }}
          onSubmit={handleEditUser}
          title={`Edit ${userType === 'student' ? 'Student' : 'Lecturer'}`}
          initialData={{
            name: currentUser.name,
            email: currentUser.email,
            department: userType === 'lecturer' ? currentUser.department : undefined,
            enrolledCourses: userType === 'student' ? currentUser.enrolledCourses : undefined,
          }}
          userType={userType}
        />
      )}
    </div>
  );
};

export default UserManagement;
