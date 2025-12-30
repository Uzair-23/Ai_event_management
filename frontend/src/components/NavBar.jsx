import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Button } from './ui/button';
import { State, City } from 'country-state-city';
import { FilterContext } from '../context/FilterContext';

export default function NavBar() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('All');
  const [cities, setCities] = useState(['All']);
  const [states, setStates] = useState([]);
  const [selectedStateCode, setSelectedStateCode] = useState(null);
  const { stateSelection, setStateSelection } = useContext(FilterContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // load India states and initialize cities based on current stateSelection
  useEffect(() => {
    const sts = State.getStatesOfCountry('IN') || [];
    const list = [{ name: 'All', isoCode: null }, ...sts.map(s => ({ name: s.name, isoCode: s.isoCode }))];
    setStates(list);

    // if a state is already selected in context, populate cities for it
    if (stateSelection && stateSelection !== 'All') {
      const s = list.find(x => x.name === stateSelection);
      if (s && s.isoCode) {
        setSelectedStateCode(s.isoCode);
        const cityList = City.getCitiesOfState('IN', s.isoCode) || [];
        setCities(['All', ...cityList.map(c => c.name)]);
      } else {
        setCities(['All']);
      }
    } else {
      setCities(['All']);
    }
  }, []);

  // when the selected state (from context) changes, update cities and reset city selection
  useEffect(() => {
    if (!stateSelection || stateSelection === 'All') {
      setCities(['All']);
      setSelectedStateCode(null);
      setCity('All');
      return;
    }

    const s = states.find(x => x.name === stateSelection);
    const iso = s?.isoCode;
    setSelectedStateCode(iso || null);
    setCity('All');

    if (iso) {
      const cityList = City.getCitiesOfState('IN', iso) || [];
      setCities(['All', ...cityList.map(c => c.name)]);
    } else {
      setCities(['All']);
    }
  }, [stateSelection, states]);

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
            {states.map((s) => (
              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City selector (shadcn Select) */}
        <Select
          value={city}
          onValueChange={(val) => setCity(val)}
          className="w-40"
          disabled={!stateSelection || stateSelection === 'All'}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
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
