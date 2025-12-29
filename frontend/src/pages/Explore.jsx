import { useEffect, useState } from 'react';
import API from '../services/api';
import EventCard from '../components/EventCard';

export default function Explore() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await API.get('/events?page=1&limit=20');
      setEvents(data.events);
    };
    fetch();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Explore events</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {events.map((e) => <EventCard key={e._id} event={e} />)}
      </div>
    </div>
  );
}
