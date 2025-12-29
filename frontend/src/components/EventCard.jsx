import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';

export default function EventCard({ event }) {
  const seatsInfo = `${event.seatsBooked || 0}/${event.totalSeats || 0}`;
  const cover = event.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(event.title || event.category || 'event')}`;

  return (
    <motion.article
      layout
      whileHover={{ y: -6, scale: 1.02 }}
      className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200"
    >
      <Link to={`/events/${event._id}`}>
        <div className="relative h-44 bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }}>
          {/* gradient overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

          <div className="absolute top-2 left-2 z-20">
            <Badge>{event.category}</Badge>
          </div>

          <div className="absolute top-2 right-2 z-20">
            <Badge variant="secondary">{event.totalSeats > 0 ? (event.totalSeats <= 20 ? 'Limited' : 'Open') : 'N/A'}</Badge>
          </div>
        </div>

        <div className="p-4 text-white">
          <h3 className="font-bold text-lg z-30">{event.title}</h3>
          <p className="text-sm text-muted mt-1">{new Date(event.date).toLocaleDateString()} • {event.location?.city || 'Online'}</p>
          <div className="mt-2 text-xs text-muted">{seatsInfo} seats</div>
        </div>
      </Link>
    </motion.article>
  );
}
