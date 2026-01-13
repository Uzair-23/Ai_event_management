import { useEffect, useState } from 'react';
import API from '../services/api';
import { socket, joinOrganizerRoom } from '../services/socket';
import { useUser } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNavigate } from 'react-router-dom';

export default function OrganizerDashboardDetailed() {
  const { user, isSignedIn } = useUser();
  const [events, setEvents] = useState([]);
  const [liveRegs, setLiveRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true);
        // Using a high limit to ensure all organizer events are captured
        const { data } = await API.get('/events?limit=100');
        // Filter events strictly owned by the current Clerk user
        const myEvents = data.events.filter((e) => e.organizer === user?.id);
        setEvents(myEvents);
      } catch (err) {
        console.error('Error fetching organizer events:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn && user?.id) fetchMyEvents();
  }, [user, isSignedIn]);

  useEffect(() => {
    if (!user?.id) return;
    socket.connect();
    joinOrganizerRoom(user.id);

    socket.on('registration', (payload) => {
      setLiveRegs((s) => [payload, ...s].slice(0, 15));
    });

    return () => {
      socket.off('registration');
      socket.disconnect();
    };
  }, [user]);

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-background p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Organizer Control Center</h1>
            <p className="text-muted-foreground mt-2">Manage your events, track registrations, and view live analytics.</p>
          </div>
          <Button onClick={() => navigate('/create')} className="bg-primary hover:bg-primary/90">
            Create New Event
          </Button>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="events">Your Events ({events.length})</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {events.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">You haven't organized any events yet.</p>
                <Button variant="link" onClick={() => navigate('/create')}>Create your first event</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.map((event) => {
                  const percent = Math.round((event.seatsBooked / event.totalSeats) * 100) || 0;
                  return (
                    <div key={event._id} className="glass glass-border p-6 rounded-xl flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={event.isOnline ? "secondary" : "outline"}>
                          {event.isOnline ? 'Virtual' : event.location?.city}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Capacity Usage</span>
                            <span className="font-medium">{event.seatsBooked} / {event.totalSeats} seats</span>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/events/${event._id}`)}>
                            View Public Page
                          </Button>
                          <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/events/edit/${event._id}`)}>
                            Edit Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <div className="glass glass-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Live Registration Stream</h3>
              <div className="space-y-3">
                {liveRegs.map((reg, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div>
                      <span className="font-medium">New attendee registered!</span>
                      <p className="text-sm text-muted-foreground">Ticket ID: {reg.ticketId}</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20 border-green-500/50">
                      Success
                    </Badge>
                  </div>
                ))}
                {liveRegs.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    No recent registrations detected.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}