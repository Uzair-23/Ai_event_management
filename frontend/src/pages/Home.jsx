import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import API from '../services/api';
import EventCard from '../components/EventCard';
import { FilterContext } from '../context/FilterContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('All');
  const [cities, setCities] = useState(['All']);
  const { stateSelection } = useContext(FilterContext);

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = { page: 1, limit: 24 };
        if (stateSelection && stateSelection !== 'All') params.state = stateSelection;
        const { data } = await API.get('/events/search', { params });
        setEvents(data.events || []);
      } catch (err) {
        console.error('home events', err);
      }
    };
    fetch();
  }, [stateSelection]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data } = await API.get('/events/cities');
        setCities(['All', ...data.cities]);
      } catch (err) {
        console.error('cities', err);
      }
    };
    fetchCities();
  }, []);

  const filtered = events.filter((e) => {
    if (category !== 'All' && e.category !== category) return false;
    if (city !== 'All' && e.location?.city !== city) return false;
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
              <Select value={category} onValueChange={(val) => setCategory(val)} className="w-48">
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {Array.from(new Set(events.map(e => e.category))).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={city} onValueChange={(val) => setCity(val)} className="w-48">
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="rounded-lg overflow-hidden h-40 bg-cover bg-center" style={{ backgroundImage: `url('https://source.unsplash.com/featured/?events')` }} />
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
