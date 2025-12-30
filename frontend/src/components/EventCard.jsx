import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';

export default function EventCard({ event }) {
  const seatsInfo = `${event.seatsBooked || 0}/${event.totalSeats || 0}`;
  const cover = event.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(event.title || event.category || 'event')}`;
  const isPaid = event.price && event.price > 0;

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
      className="bg-card/50 glass rounded-xl overflow-hidden transition-transform duration-200 h-full flex flex-col min-w-[260px]"
    >
      <Link to={`/events/${event._id}`} className="flex-1" aria-label={`View event ${event.title}`}>
        {/* Top image area - no overlay, image fully visible */}
        <div className="relative h-72 md:h-80 overflow-hidden rounded-t-xl">
          <img src={cover} alt={event.title} className="w-full h-full object-cover" />

          {/* gradient overlay: black at bottom -> transparent at center */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent z-10 pointer-events-none" />

          {/* Category badge (top-left) */}
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-black/90 text-white text-sm px-3 py-1 rounded-full shadow-sm">{event.category}</Badge>
          </div>

          {/* Free / Paid badge (top-right) */}
          <div className="absolute top-3 right-3 z-20">
            <span className="inline-block bg-white text-black text-xs px-3 py-1 rounded-full font-medium">{isPaid ? 'Paid' : 'Free'}</span>
          </div>
        </div>

        {/* Text content moved below the image to ensure readability */}
        <div className="p-4 text-white bg-transparent">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-white">{event.title}</h3>

          <div className="mt-2 flex flex-col gap-1 text-gray-300 text-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
              <span className="text-muted-foreground">{new Date(event.date).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21c4.418 0 8-3.582 8-8 0-3.866-4-7-8-7s-8 3.134-8 7c0 4.418 3.582 8 8 8z"/></svg>
              <span className="text-muted-foreground">{event.location?.city || 'Online'}{event.location?.state ? `, ${event.location.state}` : ''}</span>
            </div>

            {event.totalSeats ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m0-5a4 4 0 1 1 8 0"/></svg>
                <span>{event.seatsBooked || 0} / {event.totalSeats} registered</span>
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
