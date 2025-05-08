
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

interface Course {
  id: number;
  title: string;
  students: number;
  recordings: number;
}

interface CourseListProps {
  courses: Course[];
}

const CourseList: React.FC<CourseListProps> = ({ courses: initialCourses }) => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
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
  
  const viewCourseRecordings = (courseId: number) => {
    // In a real app, this would navigate to a recordings page
    toast({
      title: "View Recordings",
      description: `Viewing recordings for course #${courseId}`,
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Course</Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Enrolled Students</TableHead>
            <TableHead>Recordings</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map(course => (
            <TableRow key={course.id}>
              <TableCell>{course.title}</TableCell>
              <TableCell>{course.students}</TableCell>
              <TableCell>{course.recordings}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" className="mr-2" onClick={() => viewCourseRecordings(course.id)}>
                  View Recordings
                </Button>
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
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    // This would actually save the form data
                    handleAddCourse({
                      title: 'New Course',
                      students: 0,
                      recordings: 0
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

export default CourseList;
