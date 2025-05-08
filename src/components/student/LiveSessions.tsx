
import React from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

interface Session {
  id: number;
  title: string;
  lecturer: string;
  startTime: string;
  active: boolean;
}

interface LiveSessionsProps {
  sessions: Session[];
}

const LiveSessions: React.FC<LiveSessionsProps> = ({ sessions }) => {
  const joinSession = (sessionId: number) => {
    // In a real app, this would join the WebRTC session
    toast({
      title: "Joining Session",
      description: `Connecting to live session #${sessionId}...`,
    });
    
    // Then would redirect to a live session page
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Lecturer</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map(session => (
          <TableRow key={session.id}>
            <TableCell>{session.title}</TableCell>
            <TableCell>{session.lecturer}</TableCell>
            <TableCell>{session.startTime}</TableCell>
            <TableCell>
              {session.active ? (
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Live</span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Scheduled</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant={session.active ? "default" : "outline"} 
                onClick={() => joinSession(session.id)}
                disabled={!session.active}
              >
                {session.active ? "Join Now" : "Not Started"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {sessions.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No live sessions available.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default LiveSessions;
