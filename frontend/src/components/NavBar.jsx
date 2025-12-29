import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Button } from './ui/button';
import API from '../services/api';
import { FilterContext } from '../context/FilterContext';

export default function NavBar() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('All');
  const [cities, setCities] = useState(['All']);
  const { stateSelection, setStateSelection } = useContext(FilterContext);
  const navigate = useNavigate();

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

  // debounce navigation (only when user has interacted)
  useEffect(() => {
    const shouldNavigate = q || (city && city !== 'All') || (stateSelection && stateSelection !== 'All');
    if (!shouldNavigate) return; // don't auto-navigate on mount

    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city && city !== 'All') params.set('city', city);
      if (stateSelection && stateSelection !== 'All') params.set('state', stateSelection);
      const target = `/explore${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('[NAV DEBUG] NavBar auto-navigate to', target);
      navigate(target);
    }, 500);
    return () => clearTimeout(t);
  }, [q, city, stateSelection, navigate]);

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city && city !== 'All') params.set('city', city);
    if (stateSelection && stateSelection !== 'All') params.set('state', stateSelection);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <nav className="p-4 flex items-center justify-between bg-card/60 backdrop-blur-sm">
      <Link to="/" className="text-xl font-semibold">
        AI Events
      </Link>

      <form onSubmit={onSubmit} className="flex flex-1 max-w-3xl mx-6 items-center gap-3">
        <Input placeholder="Search events..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />

        {/* State selector (shadcn Select) */}
        <Select
          value={stateSelection}
          onValueChange={(val) => setStateSelection(val)}
          className="w-40"
        >
          <SelectTrigger>
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All States</SelectItem>
            <SelectItem value="Karnataka">Karnataka</SelectItem>
            <SelectItem value="Maharashtra">Maharashtra</SelectItem>
            <SelectItem value="Delhi">Delhi</SelectItem>
          </SelectContent>
        </Select>

        {/* City selector (shadcn Select) */}
        <Select
          value={city}
          onValueChange={(val) => setCity(val)}
          className="w-40"
        >
          <SelectTrigger>
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </form>

      <div className="space-x-4 flex items-center">
        <Link to="/explore" className="px-3 py-1 rounded hover:bg-primary/10 transition">
          Explore
        </Link>
        <Link to="/create" className="px-3 py-1 rounded bg-primary text-primary-foreground">Create</Link>
        <Link to="/tickets" className="px-3 py-1 rounded hover:bg-primary/10 transition">My Tickets</Link>

        <SignedOut>
          <Link to="/login" className="px-3 py-1 rounded hover:bg-primary/10 transition">Login</Link>
          <Link to="/register" className="px-3 py-1 rounded hover:bg-primary/10 transition">Register</Link>
        </SignedOut>

        <SignedIn>
          <div className="ml-3">
            <UserButton />
          </div>
        </SignedIn>
      </div>
    </nav>
  );
}
