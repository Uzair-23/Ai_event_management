import { useEffect, useState } from 'react';
import API from '../services/api';
import { socket, joinOrganizerRoom } from '../services/socket';
import { useUser } from '@clerk/clerk-react';

export default function OrganizerDashboard() {
  const { user, isSignedIn } = useUser();
  const [events, setEvents] = useState([]);
  const [liveRegs, setLiveRegs] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await API.get('/events?limit=50');
      // filter events organized by current user (server stores organizer as Clerk id)
      const my = data.events.filter((e) => e.organizer === user?.id || e.organizer?._id === user?.id);
      setEvents(my);
    };
    if (isSignedIn) fetch();
  }, [user, isSignedIn]);

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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Organizer dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.map((e) => (
          <div key={e._id} className="p-4 bg-card rounded">
            <div className="font-semibold">{e.title}</div>
            <div className="text-sm text-muted">{e.seatsBooked}/{e.totalSeats} seats</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Live registrations</h3>
        <div className="mt-2 space-y-2">
          {liveRegs.map((r, i) => (
            <div key={i} className="p-2 bg-input rounded">New registration for event {r.eventId} — ticket {r.ticketId}</div>
          ))}
          {liveRegs.length === 0 && <div className="text-muted">No live registrations yet</div>}
        </div>
      </div>
    </div>
  );
}
