
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface Course {
  id: number;
  title: string;
  lecturer: string;
  students: number;
}

const CourseManagement: React.FC = () => {
  // Mock data - In a real app, this would come from a database
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, title: 'Introduction to Programming', lecturer: 'Dr. Smith', students: 23 },
    { id: 2, title: 'Advanced Mathematics', lecturer: 'Prof. Johnson', students: 18 },
    { id: 3, title: 'Database Systems', lecturer: 'Dr. Smith', students: 15 },
  ]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  
  const handleAddCourse = (course: Omit<Course, 'id'>) => {
    const newCourse = {
      ...course,
      id: courses.length + 1,
    };
    setCourses([...courses, newCourse]);
    toast({
      title: "Course Added",
      description: `${course.title} has been successfully added.`,
    });
    setIsAddDialogOpen(false);
  };
  
  const handleEditCourse = (updatedCourse: Course) => {
    setCourses(courses.map(course => (course.id === updatedCourse.id ? updatedCourse : course)));
    toast({
      title: "Course Updated",
      description: `${updatedCourse.title} has been successfully updated.`,
    });
    setIsEditDialogOpen(false);
    setCurrentCourse(null);
  };
  
  const handleDeleteCourse = (id: number) => {
    setCourses(courses.filter(course => course.id !== id));
    toast({
      title: "Course Deleted",
      description: "Course has been successfully removed.",
    });
  };
  
  const openEditDialog = (course: Course) => {
    setCurrentCourse(course);
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input
          placeholder="Search courses..."
          className="w-64"
        />
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add Course
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Lecturer</TableHead>
            <TableHead>Students</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map(course => (
            <TableRow key={course.id}>
              <TableCell>{course.title}</TableCell>
              <TableCell>{course.lecturer}</TableCell>
              <TableCell>{course.students}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" className="mr-2" onClick={() => openEditDialog(course)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteCourse(course.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Add Course</h2>
              <div className="space-y-4">
                <Input placeholder="Course Title" />
                <Input placeholder="Lecturer" />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    // This would actually save the form data
                    handleAddCourse({
                      title: 'New Course',
                      lecturer: 'Dr. Smith',
                      students: 0
                    });
                  }}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isEditDialogOpen && currentCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Course</h2>
              <div className="space-y-4">
                <Input placeholder="Course Title" defaultValue={currentCourse.title} />
                <Input placeholder="Lecturer" defaultValue={currentCourse.lecturer} />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    setCurrentCourse(null);
                  }}>Cancel</Button>
                  <Button onClick={() => {
                    // This would actually save the form data
                    handleEditCourse({
                      ...currentCourse,
                      title: currentCourse.title + ' (Edited)',
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

export default CourseManagement;
