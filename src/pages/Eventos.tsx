import { useState } from "react";
import { Plus, Calendar, MapPin, Users, Clock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { EventCard } from "@/components/events/EventCard";
import { AttendanceControl } from "@/components/events/AttendanceControl";
import { useEvents } from "@/hooks/useEvents";
import { PageHeader } from "@/components/ui/page-header";

export function Eventos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  
  const { events, isLoading } = useEvents();

  const filteredEvents = events?.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const upcomingEvents = filteredEvents.filter(event => {
    const startDate = new Date(event.start_datetime || event.start_date);
    return startDate > new Date();
  });

  const ongoingEvents = filteredEvents.filter(event => {
    const now = new Date();
    const startDate = new Date(event.start_datetime || event.start_date);
    const endDate = new Date(event.end_datetime || event.end_date);
    return startDate <= now && now <= endDate;
  });

  const pastEvents = filteredEvents.filter(event => {
    const endDate = new Date(event.end_datetime || event.end_date);
    return endDate < new Date();
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Eventos"
        description="Gerencie eventos e controle de presença"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Próximos ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="ongoing">
            Em Andamento ({ongoingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Finalizados ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onAttendanceClick={() => setSelectedEvent(event.id)}
              />
            ))}
          </div>
          {upcomingEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum evento próximo encontrado
            </div>
          )}
        </TabsContent>

        <TabsContent value="ongoing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ongoingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onAttendanceClick={() => setSelectedEvent(event.id)}
                showAttendanceButton
              />
            ))}
          </div>
          {ongoingEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum evento em andamento
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isPast
              />
            ))}
          </div>
          {pastEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum evento finalizado encontrado
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedEvent && (
        <AttendanceControl
          eventId={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}