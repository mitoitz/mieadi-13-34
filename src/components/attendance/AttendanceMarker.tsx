import { UnifiedAttendanceControl } from "./UnifiedAttendanceControl";

interface AttendanceMarkerProps {
  eventId?: string;
  classId?: string;
  onAttendanceMarked?: (personId: string, method: string) => void;
}

export function AttendanceMarker({ eventId, classId, onAttendanceMarked }: AttendanceMarkerProps) {
  const handleAttendanceUpdate = (records: any[]) => {
    // Handle attendance updates
    if (onAttendanceMarked && records.length > 0) {
      const lastRecord = records[0];
      onAttendanceMarked(lastRecord.person.id, lastRecord.method);
    }
  };

  return (
    <UnifiedAttendanceControl
      eventId={eventId}
      classId={classId}
      onAttendanceUpdate={handleAttendanceUpdate}
    />
  );
}