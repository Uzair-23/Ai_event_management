import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../services/api';
import EventCard from '../components/EventCard';

export default function Explore() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const city = params.get('city') || '';

    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/events/search', { params: { q, city, page: 1, limit: 24 } });
        setEvents(data.events);
      } catch (err) {
        console.error('search', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [location.search]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Explore events</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {events.length ? events.map((e) => <EventCard key={e._id} event={e} />) : (
            <div className="col-span-full text-center text-muted-foreground">No events found.</div>
          )}
        </div>
      )}
    </div>
  );
}
