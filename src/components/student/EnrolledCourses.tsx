
import React from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

interface Course {
  id: number;
  title: string;
  lecturer: string;
  recordings: number;
}

interface EnrolledCoursesProps {
  courses: Course[];
}

const EnrolledCourses: React.FC<EnrolledCoursesProps> = ({ courses }) => {
  const viewRecordings = (courseId: number) => {
    // In a real app, this would navigate to a recordings page
    toast({
      title: "View Recordings",
      description: `Viewing recordings for course #${courseId}`,
    });
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Course</TableHead>
          <TableHead>Lecturer</TableHead>
          <TableHead>Recordings</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map(course => (
          <TableRow key={course.id}>
            <TableCell>{course.title}</TableCell>
            <TableCell>{course.lecturer}</TableCell>
            <TableCell>{course.recordings}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" onClick={() => viewRecordings(course.id)}>
                View Recordings
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {courses.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              You are not enrolled in any courses.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default EnrolledCourses;
