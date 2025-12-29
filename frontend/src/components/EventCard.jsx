import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function EventCard({ event }) {
  const seatsInfo = `${event.seatsBooked || 0}/${event.totalSeats || 0}`;
  return (
    <motion.article
      layout
      whileHover={{ y: -6, scale: 1.02 }}
      className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200"
    >
      <Link to={`/events/${event._id}`}>
        <div className="relative h-44 bg-cover bg-center" style={{ backgroundImage: `url(${event.coverImage})` }}>
          <span className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-xs rounded text-white">{event.category}</span>
          <span className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">{event.totalSeats > 0 ? (event.totalSeats <= 20 ? 'Limited' : 'Open') : 'N/A'}</span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <p className="text-sm text-muted mt-1">{new Date(event.date).toLocaleDateString()} • {event.location?.city || 'Online'}</p>
          <div className="mt-2 text-xs text-muted">{seatsInfo} seats</div>
        </div>
      </Link>
    </motion.article>
  );
}
