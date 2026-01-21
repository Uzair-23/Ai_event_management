// C:\Users\uzair\Downloads\ai-event-management\frontend\src\pages\MyTickets.jsx
import { useEffect, useState } from 'react';
import API from '../services/api';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Calendar, MapPin, Download, Ticket, QrCode } from 'lucide-react';
import { format } from 'date-fns';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    console.log('[MY TICKETS] Mount - isSignedIn=', isSignedIn, 'user=', user?.id);
    
    const fetchTickets = async () => {
      setLoading(true);
      
      if (!isSignedIn || !user) {
        setTickets([]);
        setLoading(false);
        return;
      }

      try {
        // ✅ SECURE: No userId in query - backend gets it from auth token
        const { data } = await API.get('/tickets/me');
        console.log('[MY TICKETS] Fetched tickets:', data.tickets?.length || 0);
        setTickets(data.tickets || []);
      } catch (err) {
        console.error('[MY TICKETS] Error fetching tickets:', err);
        toast.error('Failed to load tickets');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user, isSignedIn]);

  // Helper function to safely get location
  const getLocationString = (event) => {
    if (!event) return 'Online';
    
    if (event.isOnline) return 'Online Event';
    
    if (typeof event.location === 'object' && event.location !== null) {
      return event.location.city || event.location.name || 'Venue TBD';
    }
    
    return event.location || 'Venue TBD';
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Ticket className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">My Tickets</h2>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <span className="ml-4 text-gray-400">Loading tickets…</span>
          </div>
        )}

        {!loading && !isSignedIn && (
          <div className="p-8 glass glass-border rounded-xl text-center">
            <p className="text-gray-400 text-lg">Please sign in to view your tickets.</p>
          </div>
        )}

        {!loading && isSignedIn && tickets.length === 0 && (
          <div className="p-8 glass glass-border rounded-xl text-center">
            <QrCode className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No tickets yet</p>
            <p className="text-gray-500">
              Explore events and register to get your tickets here.
            </p>
            <motion.a
              href="/explore"
              whileHover={{ scale: 1.02 }}
              className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg"
            >
              Explore Events
            </motion.a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {tickets.map((ticket) => {
            // Handle case where event might not be populated
            const event = ticket.event || {};
            const eventDate = event.date ? new Date(event.date) : null;
            const isPast = eventDate && eventDate < new Date();

            return (
              <motion.div
                key={ticket._id}
                whileHover={{ y: -4, boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className={`glass glass-border rounded-xl overflow-hidden ${isPast ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left side - Event info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {event.title || 'Event'}
                        </h3>
                        {isPast && (
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded mt-1 inline-block">
                            Past Event
                          </span>
                        )}
                      </div>
                      {event.category && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          {event.category}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {eventDate ? format(eventDate, 'PPP') : 'Date TBD'}
                          {event.time && ` at ${event.time}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{getLocationString(event)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-500">
                        Ticket ID: <span className="text-gray-400 font-mono">{ticket.ticketId}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Registered: {ticket.createdAt ? format(new Date(ticket.createdAt), 'PPP') : 'N/A'}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <a
                        href={ticket.qrData}
                        download={`ticket-${ticket.ticketId}.png`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download QR
                      </a>
                      {event._id && (
                        <a
                          href={`/events/${event._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                          View Event
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right side - QR Code */}
                  <div className="md:w-48 p-6 bg-white/5 flex items-center justify-center">
                    {ticket.qrData ? (
                      <img
                        src={ticket.qrData}
                        alt="Ticket QR Code"
                        className="w-36 h-36 bg-white p-2 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-gray-800 rounded-lg flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}