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
      return navigate('/login');
    }
    if (event.seatsBooked >= event.totalSeats) return toast.error('Event is full');
    if (alreadyRegistered) return toast.info('You are already registered');

    setLoadingRegister(true);
    try {
      await API.post(`/events/${id}/register`, { userId: user.id });
      toast.success('Registration successful! Redirecting to tickets...');
      navigate('/tickets');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoadingRegister(false);
    }
  };

  if (!event) return <div className="p-10 text-center">Loading event details...</div>;

  const cover = event.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(event.title || event.category || 'event')}`;
  const seatsPercent = event.totalSeats > 0 ? Math.round((event.seatsBooked / event.totalSeats) * 100) : 0;

  // Robust check: matches string IDs regardless of object type
  const isOrganizerOwner = 
    isSignedIn && 
    user?.id && 
    event?.organizer && 
    String(user.id) === String(event.organizer);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800 py-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top banner */}
        <div className="rounded-2xl overflow-hidden mb-8 relative shadow-lg group">
          <div className="w-full h-[36vh] md:h-[48vh] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${cover})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-black/40 to-transparent z-10" />

          <div className="absolute bottom-8 left-8 z-20 text-white max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">{event.title}</h1>
            <p className="mt-3 text-gray-200 line-clamp-2 md:text-lg">{event.description}</p>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-purple-900/40 glass-border rounded-2xl p-6 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white mb-4">About This Event</h2>
              <p className="text-gray-200 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            <div className="bg-purple-900/40 glass-border rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-xl font-semibold text-white mb-4">Location & Venue</h3>
              <div className="flex items-start gap-4 text-gray-200">
                <div className="bg-white/10 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <div className="font-semibold text-lg">{event.venue}</div>
                  <div className="text-gray-300">{event.location?.city || 'Online'}{event.location?.state ? `, ${event.location.state}` : ''}</div>
                  {event.mapLink && !event.isOnline && (
                    <Button variant="link" className="px-0 text-brand-300 mt-1" onClick={() => window.open(event.mapLink, '_blank')}>View on Google Maps &rarr;</Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - sticky */}
          <div className="lg:col-span-1">
            <div className="bg-purple-950/80 glass-border p-6 rounded-2xl sticky top-24 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-bold text-white">{event.price > 0 ? `₹${event.price}` : 'Free'}</div>
                <Badge variant={event.totalSeats - event.seatsBooked > 10 ? "secondary" : "destructive"}>
                  {event.totalSeats > 0 ? `${event.totalSeats - event.seatsBooked} seats left` : 'Unlimited'}
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-200">
                  <svg className="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-200">
                  <svg className="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>{event.time || 'Time TBD'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={register} 
                  disabled={loadingRegister || event.seatsBooked >= event.totalSeats || alreadyRegistered} 
                  className="w-full text-lg font-semibold py-6"
                >
                  {loadingRegister ? 'Processing...' : alreadyRegistered ? 'Already Registered' : event.seatsBooked >= event.totalSeats ? 'Sold Out' : 'Register Now'}
                </Button>

                {/* Edit Button for Organizer */}
                {isOrganizerOwner && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/events/edit/${id}`)} 
                    className="w-full border-brand-500 text-brand-300 hover:bg-brand-500/10"
                  >
                    Edit Event Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}