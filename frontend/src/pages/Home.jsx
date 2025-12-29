import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import API from '../services/api';
import EventCard from '../components/EventCard';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('All');
  const [cities, setCities] = useState(['All']);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await API.get('/events?page=1&limit=20');
      setEvents(data.events);
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await API.get('/events/featured');
        setFeatured(data.events || []);
      } catch (err) {
        console.error('featured', err);
      }
    };
    const fetchCities = async () => {
      try {
        const { data } = await API.get('/events/cities');
        setCities(['All', ...data.cities]);
      } catch (err) {
        console.error('cities', err);
      }
    };
    fetchFeatured();
    fetchCities();
  }, []);

  const filtered = events.filter((e) => {
    if (category !== 'All' && e.category !== category) return false;
    if (city !== 'All' && e.location?.city !== city) return false;
    if (query && !(`${e.title} ${e.description} ${e.category}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  const nearYou = filtered.slice(0, 6);
  const recommended = filtered.slice(6, 14);

  return (
    <div className="p-6">
      {/* Hero */}
      <div className="relative rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-black via-gray-900 to-[#0b1020] p-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">Events Near You</h1>
            <p className="text-muted mb-4">Discover curated events happening in your area.</p>
            <div className="flex gap-2 items-center">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events" className="p-3 bg-input rounded flex-1 text-white" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-3 bg-input rounded text-white">
                <option>All</option>
                {Array.from(new Set(events.map(e => e.category))).map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="p-3 bg-input rounded text-white">
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="rounded-lg overflow-hidden h-40 bg-cover bg-center" style={{ backgroundImage: `url('/hero.jpg')` }} />
          </div>
        </div>
      </div>

      {/* Featured */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">Featured</h2>
          <a href="/explore" className="text-sm text-primary">View All →</a>
        </div>
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="flex gap-4">
            {featured.map((e) => (
              <motion.div key={e._id} whileHover={{ y: -6 }} className="min-w-[320px]">
                <EventCard event={e} />
              </motion.div>
            ))}
            {featured.length === 0 && <div className="text-muted">No featured events.</div>}
          </div>
        </div>
      </div>

      {/* Events near you - horizontal carousel */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">Events Near You</h2>
          <a href="/explore" className="text-sm text-primary">View All →</a>
        </div>
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="flex gap-4">
            {nearYou.map((e) => (
              <motion.div key={e._id} whileHover={{ y: -6 }} className="min-w-[300px]">
                <EventCard event={e} />
              </motion.div>
            ))}
            {nearYou.length === 0 && <div className="text-muted">No nearby events.</div>}
          </div>
        </div>
      </div>

      {/* Recommended */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">Recommended for You</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recommended.map((e) => <EventCard key={e._id} event={e} />)}
        </div>
      </div>
    </div>
  );
}
