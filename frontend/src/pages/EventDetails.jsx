import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useUser } from '@clerk/clerk-react';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();

  const [loadingRegister, setLoadingRegister] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await API.get(`/events/${id}`);
      setEvent(data.event);
    };
    fetch();
  }, [id]);

  useEffect(() => {
    // check if current user already has a ticket for this event
    if (!isSignedIn || !user) return;
    const check = async () => {
      try {
        const { data } = await API.get(`/tickets/me?userId=${user.id}`);
        const found = (data.tickets || []).some((t) => String(t.event._id) === String(id));
        setAlreadyRegistered(found);
      } catch (err) {
        console.error('check ticket', err);
      }
    };
    check();
  }, [user, isSignedIn, id]);

  const register = async () => {
    if (!isSignedIn || !user) {
      console.log('[NAV DEBUG] EventDetails register -> redirect to /login (not signed in)');
      return navigate('/login');
    }
    if (event.seatsBooked >= event.totalSeats) return alert('Event is full');
    if (alreadyRegistered) return alert('You are already registered');

    setLoadingRegister(true);
    try {
      const { data } = await API.post(`/events/${id}/register`, { userId: user.id });
      // success - navigate to My Tickets to show the ticket
      console.log('[NAV DEBUG] EventDetails registration success, navigating to /tickets');
      navigate('/tickets');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoadingRegister(false);
    }
  };

  if (!event) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="rounded overflow-hidden">
        <img src={event.coverImage} alt="cover" className="w-full h-80 object-cover" />
        <div className="p-4 bg-card">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="mt-2 text-muted">{event.category} • {new Date(event.date).toLocaleString()}</p>
          <p className="mt-4">{event.description}</p>
          <div className="mt-4 flex gap-2">
            <div>Seats: {event.seatsBooked}/{event.totalSeats}</div>
            <div>Venue: {event.venue}</div>
            <div>Organizer: {event.organizer?.name}</div>
          </div>
          <div className="mt-6">
            <button
              onClick={register}
              disabled={loadingRegister || event.seatsBooked >= event.totalSeats || alreadyRegistered}
              className={`px-4 py-2 rounded ${loadingRegister ? 'opacity-60' : 'bg-primary text-primary-foreground'}`}
            >
              {loadingRegister ? 'Registering…' : alreadyRegistered ? 'Registered' : event.seatsBooked >= event.totalSeats ? 'Sold out' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
