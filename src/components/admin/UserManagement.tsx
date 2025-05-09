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
  
  const handleAddUser = (user: Omit<User, 'id'>) => {
    const newUser = {
      ...user,
      id: users.length + 1,
    };
    setUsers([...users, newUser]);
    toast({
      title: `${userType === 'student' ? 'Student' : 'Lecturer'} Added`,
      description: `${user.name} has been successfully added.`,
    });
    setIsAddDialogOpen(false);
  };
  
  const handleEditUser = (updatedUser: User) => {
    setUsers(users.map(user => (user.id === updatedUser.id ? updatedUser : user)));
    toast({
      title: `${userType === 'student' ? 'Student' : 'Lecturer'} Updated`,
      description: `${updatedUser.name} has been successfully updated.`,
    });
    setIsEditDialogOpen(false);
    setCurrentUser(null);
  };
  
  const handleDeleteUser = (id: number) => {
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

      {/* These would be actual implementation of dialogs with the UserFormDialog component */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Add {userType === 'student' ? 'Student' : 'Lecturer'}</h2>
              <div className="space-y-4">
                <Input placeholder="Name" />
                <Input placeholder="Email" type="email" />
                <Input placeholder={userType === 'student' ? 'Student ID' : 'Department'} />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    // This would actually save the form data
                    handleAddUser({
                      name: 'New User',
                      email: 'new@example.com',
                      [userType === 'student' ? 'enrolledCourses' : 'department']: userType === 'student' ? 0 : 'Department'
                    });
                  }}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isEditDialogOpen && currentUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit {userType === 'student' ? 'Student' : 'Lecturer'}</h2>
              <div className="space-y-4">
                <Input placeholder="Name" defaultValue={currentUser.name} />
                <Input placeholder="Email" type="email" defaultValue={currentUser.email} />
                <Input 
                  placeholder={userType === 'student' ? 'Student ID' : 'Department'} 
                  defaultValue={userType === 'student' ? currentUser.enrolledCourses : currentUser.department} 
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    setCurrentUser(null);
                  }}>Cancel</Button>
                  <Button onClick={() => {
                    // This would actually save the form data
                    handleEditUser({
                      ...currentUser,
                      name: currentUser.name + ' (Edited)',
                    });
                  }}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
