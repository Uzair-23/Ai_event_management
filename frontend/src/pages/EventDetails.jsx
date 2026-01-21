// C:\Users\uzair\Downloads\ai-event-management\frontend\src\pages\EventDetails.jsx
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
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log('[EVENT DETAILS] Fetching event:', id);
        const { data } = await API.get(`/events/${id}`);
        console.log('[EVENT DETAILS] Event data:', data);
        setEvent(data.event || data);
      } catch (err) {
        console.error('[EVENT DETAILS] Fetch error:', err);
        toast.error('Failed to load event details');
      }
    };
    fetchEvent();
  }, [id]);

  // Check if user is already registered
  useEffect(() => {
    if (!isSignedIn || !user) {
      setCheckingRegistration(false);
      return;
    }
    
    const checkRegistration = async () => {
      try {
        setCheckingRegistration(true);
        // ✅ SECURE: No userId in query - backend gets it from auth token
        const { data } = await API.get('/tickets/me');
        const found = (data.tickets || []).some((t) => {
          const ticketEventId = t.event?._id || t.event;
          return String(ticketEventId) === String(id);
        });
        setAlreadyRegistered(found);
        console.log('[EVENT DETAILS] Already registered:', found);
      } catch (err) {
        console.error('[EVENT DETAILS] Check registration error:', err);
        // Don't show error toast - just assume not registered
        setAlreadyRegistered(false);
      } finally {
        setCheckingRegistration(false);
      }
    };
    
    checkRegistration();
  }, [user, isSignedIn, id]);

  // Handle registration
  const register = async () => {
    if (!isSignedIn || !user) {
      toast.error('Please sign in to register');
      return navigate('/login');
    }
    
    if (event.seatsBooked >= event.totalSeats) {
      return toast.error('Event is sold out');
    }
    
    if (alreadyRegistered) {
      return toast.info('You are already registered for this event');
    }

    setLoadingRegister(true);
    try {
      // ✅ SECURE: No userId in body - backend gets it from auth token
      const { data } = await API.post('/tickets/register', { 
        eventId: id 
      });
      
      console.log('[EVENT DETAILS] Registration successful:', data);
      toast.success('Registration successful! Redirecting to tickets...');
      
      // Update local state
      setAlreadyRegistered(true);
      if (event) {
        setEvent(prev => ({
          ...prev,
          seatsBooked: (prev.seatsBooked || 0) + 1
        }));
      }
      
      setTimeout(() => {
        navigate('/tickets');
      }, 1500);
    } catch (err) {
      console.error('[EVENT DETAILS] Registration error:', err);
      const message = err.response?.data?.message || 'Registration failed';
      toast.error(message);
      
      // If already registered error, update state
      if (message.toLowerCase().includes('already registered')) {
        setAlreadyRegistered(true);
      }
    } finally {
      setLoadingRegister(false);
    }
  };

  // Helper to get location string
  const getLocationString = (event) => {
    if (!event) return 'Venue TBD';
    
    if (event.isOnline) return 'Online Event';
    
    if (typeof event.location === 'object' && event.location !== null) {
      const city = event.location.city || '';
      const state = event.location.state || event.state || '';
      return `${city}${city && state ? ', ' : ''}${state}` || 'Venue TBD';
    }
    
    const location = event.location || '';
    const state = event.state || '';
    return `${location}${location && state ? ', ' : ''}${state}` || 'Venue TBD';
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading event details...</div>
        </div>
      </div>
    );
  }

  const cover = event.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(event.title || event.category || 'event')}`;
  const seatsPercent = event.totalSeats > 0 ? Math.round((event.seatsBooked / event.totalSeats) * 100) : 0;
  const seatsRemaining = event.totalSeats - (event.seatsBooked || 0);

  // Check if current user is the organizer
  const eventOrganizerId = event.organizerId || event.organizer?._id || event.organizer;
  const isOrganizerOwner = isSignedIn && user?.id && eventOrganizerId && String(user.id) === String(eventOrganizerId);

  console.log('[EVENT DETAILS] Organizer check:', {
    userId: user?.id,
    eventOrganizerId,
    isOrganizerOwner
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800 py-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top banner */}
        <div className="rounded-2xl overflow-hidden mb-8 relative shadow-lg group">
          <div 
            className="w-full h-[36vh] md:h-[48vh] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
            style={{ backgroundImage: `url(${cover})` }} 
          />
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-lg">{event.venue || 'Venue TBD'}</div>
                  <div className="text-gray-300">{getLocationString(event)}</div>
                  {event.mapLink && !event.isOnline && (
                    <Button 
                      variant="link" 
                      className="px-0 text-brand-300 mt-1" 
                      onClick={() => window.open(event.mapLink, '_blank')}
                    >
                      View on Google Maps &rarr;
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Event Category & Seats Info */}
            <div className="bg-purple-900/40 glass-border rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-xl font-semibold text-white mb-4">Event Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Category:</span>
                  <Badge variant="secondary" className="text-sm">{event.category}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Event Type:</span>
                  <Badge variant="outline" className="text-sm">
                    {event.isOnline ? 'Online' : 'In-Person'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Seats Available:</span>
                  <span className="text-white font-semibold">
                    {seatsRemaining} / {event.totalSeats}
                  </span>
                </div>
                <Progress value={seatsPercent} className="w-full" />
              </div>
            </div>
          </div>

          {/* Right column - sticky */}
          <div className="lg:col-span-1">
            <div className="bg-purple-950/80 glass-border p-6 rounded-2xl sticky top-24 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-bold text-white">
                  {event.price > 0 ? `₹${event.price}` : 'Free'}
                </div>
                <Badge variant={seatsRemaining > 10 ? "secondary" : "destructive"}>
                  {event.totalSeats > 0 ? `${seatsRemaining} seats left` : 'Unlimited'}
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-200">
                  <svg className="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
                  </svg>
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-200">
                  <svg className="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>{event.time || 'Time TBD'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Register Button */}
                <Button 
                  onClick={register} 
                  disabled={loadingRegister || checkingRegistration || seatsRemaining <= 0 || alreadyRegistered} 
                  className="w-full text-lg font-semibold py-6"
                >
                  {loadingRegister ? 'Processing...' : 
                   checkingRegistration ? 'Checking...' :
                   alreadyRegistered ? '✓ Already Registered' : 
                   seatsRemaining <= 0 ? 'Sold Out' : 
                   'Register Now'}
                </Button>

                {/* Show link to tickets if already registered */}
                {alreadyRegistered && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/tickets')}
                    className="w-full border-green-500 text-green-400 hover:bg-green-500/10"
                  >
                    🎫 View Your Ticket
                  </Button>
                )}

                {/* Edit Button for Organizer */}
                {isOrganizerOwner && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log('[EVENT DETAILS] Navigating to edit page:', `/edit-event/${id}`);
                      navigate(`/edit-event/${id}`);
                    }}
                    className="w-full border-amber-500 text-amber-300 hover:bg-amber-500/10"
                  >
                    ✏️ Edit Event Details
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