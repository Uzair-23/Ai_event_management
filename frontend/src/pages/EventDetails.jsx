import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useUser } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

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

  // determine if the current user is the organizer/owner of this event
  const isOrganizerOwner = !!(user && user.id && (user.id === (event.organizer || event.organizerId)) && user.publicMetadata?.role === 'ORGANIZER');

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800 py-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top banner */}
        <div className="rounded-2xl overflow-hidden mb-8 relative shadow-lg">
          <div className="w-full h-[36vh] md:h-[48vh] bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-black/40 to-transparent z-10" />

          <div className="absolute bottom-8 left-8 z-20 text-white max-w-3xl">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight">{event.title}</h1>
            <p className="mt-3 text-sm md:text-base text-gray-200 line-clamp-2">{event.description}</p>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21c4.418 0 8-3.582 8-8 0-3.866-4-7-8-7s-8 3.134-8 7c0 4.418 3.582 8 8 8z"/></svg>
                <span>{event.location?.city || 'Online'}</span>
              </div>

              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m0-5a4 4 0 1 1 8 0"/></svg>
                <span>{(event.seatsBooked || 0)} registered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-purple-900/60 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white">About This Event</h2>
              <p className="mt-3 text-gray-200 leading-relaxed">{event.description}</p>

              <Separator className="my-6" />

              <h3 className="text-lg font-semibold text-white mb-2">Highlights</h3>
              <ul className="list-disc pl-5 text-gray-300">
                <li>Duration: 3 hours</li>
                <li>Networking opportunity</li>
                <li>Q&A session</li>
              </ul>
            </div>

            <div className="bg-purple-900/60 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-3">Location</h3>
              <div className="text-gray-200 mb-4">{event.venue}</div>
              <div className="text-gray-300">{event.location?.city || 'Online'}{event.location?.state ? `, ${event.location.state}` : ''}</div>
              <div className="mt-4">
                <Button variant="outline" className="!w-auto" onClick={() => {
                  if (!event.isOnline && event.mapLink) {
                    window.open(event.mapLink, '_blank');
                  } else {
                    alert('Map link not available');
                  }
                }}>View on Map</Button>
              </div>
            </div>
          </div>

          {/* Right column - sticky */}
          <div className="lg:col-span-1">
            <div className="bg-purple-800/70 p-6 rounded-2xl sticky top-24 shadow-lg border border-white/6">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">{event.price > 0 ? `₹${event.price}` : 'Free'}</div>
                <Badge className="bg-white/6 text-sm text-gray-100">{event.totalSeats > 0 ? `${event.totalSeats - event.seatsBooked} seats left` : 'Unlimited'}</Badge>
              </div>

              <div className="mt-4">
                <Progress value={seatsPercent} className="h-2 rounded-full bg-white/10" />
                <div className="text-xs text-gray-300 mt-2">{event.seatsBooked}/{event.totalSeats} seats booked</div>
              </div>

              <div className="mt-4">
                <div className="font-semibold text-gray-200">{new Date(event.date).toLocaleDateString()}</div>
                <div className="text-gray-300">{event.time || ''}</div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-gray-300">Seats remaining</div>
                    <div className="text-2xl font-bold text-white">{event.totalSeats > 0 ? `${event.totalSeats - event.seatsBooked}` : 'Unlimited'}</div>
                  </div>
                  <Badge className="bg-white/6 text-sm text-gray-100">{event.totalSeats > 0 ? `${event.totalSeats - event.seatsBooked} left` : 'Unlimited'}</Badge>
                </div>

                <Button onClick={register} disabled={loadingRegister || event.seatsBooked >= event.totalSeats || alreadyRegistered} className="w-full bg-white text-black hover:bg-white/90">{loadingRegister ? 'Registering…' : alreadyRegistered ? 'Registered' : event.seatsBooked >= event.totalSeats ? 'Sold out' : 'Register for Event'}</Button>
                <Button variant="outline" onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    try { await navigator.share({ title: event.title, url }); }
                    catch (err) { console.error('share failed', err); }
                  } else {
                    try { await navigator.clipboard.writeText(url); toast.success('Link copied to clipboard'); }
                    catch (err) { console.error('copy failed', err); toast.error('Failed to copy link'); }
                  }
                }} className="mt-3 w-full">Share Event</Button>

                {isOrganizerOwner && (
                  <Button variant="secondary" onClick={() => navigate(`/events/edit/${id}`)} className="mt-3 w-full">Edit Event</Button>
                )}

              </div>

              <Separator className="my-4" />

              <div className="text-sm text-gray-300">Location</div>
              <div className="text-white font-semibold">{event.venue}</div>
              <div className="text-gray-300">{event.location?.city || 'Online'}{event.location?.state ? `, ${event.location.state}` : ''}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
