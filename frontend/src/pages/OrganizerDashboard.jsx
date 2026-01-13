import { useEffect, useState } from 'react';
import API from '../services/api';
import { socket, joinOrganizerRoom } from '../services/socket';
import { useUser } from '@clerk/clerk-react';
import EventCard from '../components/EventCard'; // Import the EventCard component
import SectionReveal from '../components/SectionReveal';

export default function OrganizerDashboard() {
  const { user, isSignedIn } = useUser();
  const [events, setEvents] = useState([]);
  const [liveRegs, setLiveRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Logic from your snippet: Fetching from the new organizer-specific endpoint
  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      try {
        setLoading(true);
        // Use the new backend route we just created
        const { data } = await API.get(`/events/organizer/${user.id}`);
        setEvents(data.events);
      } catch (err) {
        console.error("Error fetching organizer events:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn && user?.id) {
      fetchOrganizerEvents();
    }
  }, [user, isSignedIn]);

  // Socket logic for real-time registrations
  useEffect(() => {
    if (!user) return;
    socket.connect();
    joinOrganizerRoom(user.id);

    socket.on('registration', (payload) => {
      setLiveRegs((s) => [payload, ...s].slice(0, 10));
    });

    return () => {
      socket.off('registration');
      socket.disconnect();
    };
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading Dashboard...</div>;

  return (
    <div className="p-6 pt-28 min-h-screen bg-black text-white">
      <SectionReveal>
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Organizer Dashboard
            </h2>
            <p className="text-muted-foreground mt-2">Manage your events and track real-time registrations.</p>
          </header>

          {/* 2. Logic from your snippet: The EventCard Grid */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Your Events</h3>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            ) : (
              <div className="p-10 border border-dashed border-white/10 rounded-xl text-center text-muted-foreground">
                You haven't created any events yet.
              </div>
            )}
          </section>

          {/* Live Registrations Section */}
          <section>
            <div className="glass-strong p-6 rounded-2xl border border-primary/20">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Live Registrations
              </h3>
              <div className="space-y-3">
                {liveRegs.map((r, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-lg animate-in fade-in slide-in-from-left duration-500">
                    New registration for <span className="text-primary font-semibold">{r.eventId}</span> — Ticket ID: <span className="text-accent">{r.ticketId}</span>
                  </div>
                ))}
                {liveRegs.length === 0 && (
                  <p className="text-muted-foreground italic">No live activity at the moment.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </SectionReveal>
    </div>
  );
}