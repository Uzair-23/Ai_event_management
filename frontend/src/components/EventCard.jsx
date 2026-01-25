import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';

export default function EventCard({ event }) {
  const seatsInfo = `${event.seatsBooked || 0}/${event.totalSeats || 0}`;
  const cover = event.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(event.title || event.category || 'event')}`;
  const isPaid = event.price && event.price > 0;

  // Get location string safely
  const getLocationString = () => {
    if (event.isOnline) return 'Online';
    if (typeof event.location === 'object' && event.location !== null) {
      const city = event.location.city || '';
      const state = event.location.state || '';
      return city + (state ? `, ${state}` : '') || 'Venue TBD';
    }
    return event.location || 'Venue TBD';
  };

  const variants = {
    initial: { scale: 1, boxShadow: 'none' },
    hover: { scale: 1.02, boxShadow: '0 0 20px rgba(168,85,247,0.4)' }
  };

  return (
    <motion.article
      layout
      initial="initial"
      whileHover="hover"
      variants={variants}
      transition={{ duration: 0.18 }}
      className="bg-card/50 glass rounded-xl overflow-hidden transition-transform duration-200 h-full flex flex-col"
    >
      <Link to={`/events/${event._id}`} className="flex-1 flex flex-col" aria-label={`View event ${event.title}`}>
        {/* Image area - Responsive height */}
        <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden">
          <img 
            src={cover} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 pointer-events-none" />

          {/* Category badge (top-left) */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
            <Badge className="bg-black/90 text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm">
              {event.category}
            </Badge>
          </div>

          {/* Free / Paid badge (top-right) */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20">
            <span className="inline-block bg-white text-black text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
              {isPaid ? `₹${event.price}` : 'Free'}
            </span>
          </div>

          {/* Online badge */}
          {event.isOnline && (
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-20">
              <Badge className="bg-blue-500/90 text-white text-xs px-2 py-0.5 rounded-full">
                Virtual Event
              </Badge>
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col text-white bg-transparent">
          <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 text-white">
            {event.title}
          </h3>

          <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 sm:gap-2 text-gray-300 text-xs sm:text-sm flex-1">
            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
              <span className="text-muted-foreground truncate">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
              <span className="text-muted-foreground truncate">
                {getLocationString()}
              </span>
            </div>

            {/* Seats */}
            {event.totalSeats > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
                <span className="text-muted-foreground">
                  {event.seatsBooked || 0} / {event.totalSeats} registered
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}