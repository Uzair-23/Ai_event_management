import { useEffect, useState } from 'react';
import API from '../services/api';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Calendar, MapPin, Download, Ticket, QrCode, ExternalLink } from 'lucide-react';
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

  const getLocationString = (event) => {
    if (!event) return 'Online';
    if (event.isOnline) return 'Online Event';
    if (typeof event.location === 'object' && event.location !== null) {
      return event.location.city || event.location.name || 'Venue TBD';
    }
    return event.location || 'Venue TBD';
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 pt-20 sm:pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <Ticket className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h2 className="text-2xl sm:text-3xl font-bold">My Tickets</h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary"></div>
            <span className="ml-3 sm:ml-4 text-gray-400 text-sm sm:text-base">Loading tickets…</span>
          </div>
        )}

        {/* Not Signed In */}
        {!loading && !isSignedIn && (
          <div className="p-6 sm:p-8 glass glass-border rounded-xl text-center">
            <p className="text-gray-400 text-base sm:text-lg">Please sign in to view your tickets.</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && isSignedIn && tickets.length === 0 && (
          <div className="p-6 sm:p-8 glass glass-border rounded-xl text-center">
            <QrCode className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-400 text-base sm:text-lg mb-2">No tickets yet</p>
            <p className="text-gray-500 text-sm sm:text-base">
              Explore events and register to get your tickets here.
            </p>
            <motion.a
              href="/explore"
              whileHover={{ scale: 1.02 }}
              className="inline-block mt-4 px-5 sm:px-6 py-2 bg-primary text-white rounded-lg text-sm sm:text-base"
            >
              Explore Events
            </motion.a>
          </div>
        )}

        {/* Tickets List */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {tickets.map((ticket) => {
            const event = ticket.event || {};
            const eventDate = event.date ? new Date(event.date) : null;
            const isPast = eventDate && eventDate < new Date();

            return (
              <motion.div
                key={ticket._id}
                whileHover={{ y: -2, boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className={`glass glass-border rounded-xl overflow-hidden ${isPast ? 'opacity-60' : ''}`}
              >
                {/* Mobile: Stacked layout, Desktop: Side by side */}
                <div className="flex flex-col sm:flex-row">
                  {/* Event Info */}
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                          {event.title || 'Event'}
                        </h3>
                        {isPast && (
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded mt-1 inline-block">
                            Past Event
                          </span>
                        )}
                      </div>
                      {event.category && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded shrink-0">
                          {event.category}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">
                          {eventDate ? format(eventDate, 'PPP') : 'Date TBD'}
                          {event.time && ` at ${event.time}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{getLocationString(event)}</span>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-500 truncate">
                        Ticket ID: <span className="text-gray-400 font-mono">{ticket.ticketId}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Registered: {ticket.createdAt ? format(new Date(ticket.createdAt), 'PP') : 'N/A'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                      <a
                        href={ticket.qrData}
                        download={`ticket-${ticket.ticketId}.png`}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Download QR
                      </a>
                      {event._id && (
                        <a
                          href={`/events/${event._id}`}
                          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs sm:text-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          View Event
                        </a>
                      )}
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="p-4 sm:p-6 sm:w-44 md:w-48 bg-white/5 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-white/10">
                    {ticket.qrData ? (
                      <img
                        src={ticket.qrData}
                        alt="Ticket QR Code"
                        className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-white p-1.5 sm:p-2 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-gray-800 rounded-lg flex items-center justify-center">
                        <QrCode className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600" />
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