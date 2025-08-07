import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, Users, Clock, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/hooks/useEvents";

interface EventCardProps {
  event: Event;
  onAttendanceClick?: () => void;
  showAttendanceButton?: boolean;
  isPast?: boolean;
}

export function EventCard({ 
  event, 
  onAttendanceClick, 
  showAttendanceButton = false, 
  isPast = false 
}: EventCardProps) {
  const startDate = new Date(event.start_datetime || event.start_date);
  const endDate = new Date(event.end_datetime || event.end_date);
  const now = new Date();
  
  const getEventStatus = () => {
    if (isPast) return "Finalizado";
    if (startDate <= now && now <= endDate) return "Em Andamento";
    return "Próximo";
  };

  const getStatusColor = () => {
    if (isPast) return "secondary";
    if (startDate <= now && now <= endDate) return "default";
    return "outline";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <CardDescription className="mt-1">
              {event.description}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor()}>
            {getEventStatus()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {format(startDate, "PPP", { locale: ptBR })}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              {format(startDate, "HH:mm", { locale: ptBR })} - {format(endDate, "HH:mm", { locale: ptBR })}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{event.location}</span>
            </div>
          )}

          {event.max_attendees && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              <span>Máximo {event.max_attendees} participantes</span>
            </div>
          )}
        </div>

        {(showAttendanceButton || (startDate <= now && now <= endDate)) && onAttendanceClick && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={onAttendanceClick}
              className="w-full"
              variant={startDate <= now && now <= endDate ? "default" : "outline"}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Controlar Presença
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}