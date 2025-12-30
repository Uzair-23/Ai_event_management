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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <nav className={`sticky top-0 z-50 p-3 flex items-center justify-between glass glass-border transition-shadow ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}>
      <Link to="/" className="text-xl font-semibold tracking-tight flex items-center gap-2">
        <span className="text-white">AI Events</span>
      </Link>

      <form onSubmit={onSubmit} className="flex flex-1 max-w-3xl mx-6 items-center gap-3">
        <Input placeholder="Search events..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 focus:ring-2 focus:ring-brand-600/40 transition-shadow" />

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
        <Link to="/explore" className="px-3 py-1 rounded hover:underline text-sm transition">Explore</Link>
        <Link to="/create" className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow-md hover:from-brand-500 hover:to-brand-600 transition">Create</Link>
        <Link to="/tickets" className="px-3 py-1 rounded hover:underline text-sm transition">My Tickets</Link>

        <SignedOut>
          <Link to="/login" className="px-3 py-1 rounded hover:underline text-sm transition">Login</Link>
          <Link to="/register" className="px-3 py-1 rounded hover:underline text-sm transition">Register</Link>
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
