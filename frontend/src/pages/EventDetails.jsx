import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useUser } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();

  const [loadingRegister, setLoadingRegister] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get(`/events/${id}`);
        setEvent(data.event);
      } catch (err) {
        console.error('fetch event', err);
      }
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

  const cover = event.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(event.title || event.category || 'event')}`;
  const seatsPercent = event.totalSeats > 0 ? Math.round((event.seatsBooked / event.totalSeats) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="rounded overflow-hidden mb-6 relative">
        <div className="w-full h-[30vh] md:h-[40vh] bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
        <div className="absolute bottom-8 left-8 z-20 text-white max-w-3xl">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight">{event.title}</h1>
          <p className="mt-2 text-sm md:text-base text-muted line-clamp-2">{event.description}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-muted">
            <div>{new Date(event.date).toLocaleDateString()}</div>
            <div>•</div>
            <div>{event.location?.city || 'Online'}</div>
            <div>•</div>
            <div>{(event.seatsBooked || 0)} registered</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - main content */}
        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded">
            <h2 className="text-2xl font-bold text-white">About this event</h2>
            <Separator className="my-4" />
            <div className="text-muted">{event.description}</div>

            <Separator className="my-4" />

            <h3 className="font-semibold mb-2">Highlights</h3>
            <ul className="list-disc pl-5 text-muted">
              {/* sample highlights: can be extended later */}
              <li>Duration: 3 hours</li>
              <li>Networking opportunity</li>
              <li>Q&A session</li>
            </ul>

            <Separator className="my-4" />

            <h3 className="font-semibold mb-2">Location</h3>
            <div className="text-muted">{event.venue} • {event.location?.city || 'Online'}{event.location?.state ? `, ${event.location.state}` : ''}</div>
          </div>
        </div>

        {/* Right column - sticky card */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded sticky top-24">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">{event.price > 0 ? `₹${event.price}` : 'Free'}</div>
              <Badge>{event.totalSeats > 0 ? `${event.totalSeats - event.seatsBooked} seats left` : 'Unlimited'}</Badge>
            </div>

            <div className="mt-4">
              <Progress value={seatsPercent} />
              <div className="text-xs text-muted mt-2">{event.seatsBooked}/{event.totalSeats} seats booked</div>
            </div>

            <div className="mt-4">
              <div className="font-semibold">{new Date(event.date).toLocaleDateString()}</div>
              <div className="text-muted">{event.time || ''}</div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={register} disabled={loadingRegister || event.seatsBooked >= event.totalSeats || alreadyRegistered}>{loadingRegister ? 'Registering…' : alreadyRegistered ? 'Registered' : event.seatsBooked >= event.totalSeats ? 'Sold out' : 'Register'}</Button>
              <Button variant="outline" onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: event.title, url: window.location.href });
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Link copied to clipboard');
                }
              }}>Share</Button>
            </div>

            <Separator className="my-4" />

            <div className="text-sm text-muted">Location</div>
            <div className="text-white font-semibold">{event.venue}</div>
            <div className="text-muted">{event.location?.city || 'Online'}{event.location?.state ? `, ${event.location.state}` : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
