import { useEffect, useState, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // flag to avoid navigation loops when syncing state from URL
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(syncTimeoutRef.current);
  }, []);

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

    // if we're syncing from URL changes, avoid triggering other navigation
    isSyncingRef.current = true;
    setSelectedStateCode(iso || null);
    setCity('All');

    if (iso) {
      const cityList = City.getCitiesOfState('IN', iso) || [];
      setCities(['All', ...cityList.map(c => c.name)]);
    } else {
      setCities(['All']);
    }

    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => { isSyncingRef.current = false; }, 0);
  }, [stateSelection, states]);

  // sync URL -> local state on location change (handles back/forward)
  useEffect(() => {
    const { pathname, search } = location;

    isSyncingRef.current = true;

    if (pathname === '/') {
      // reset filters when returning home
      try { setStateSelection('All'); } catch (err) { console.error('sync reset state', err); }
      setCity('All');
      setQ('');
    } else if (pathname === '/explore') {
      const params = new URLSearchParams(search);
      const urlQ = params.get('q') || '';
      const urlCity = params.get('city') || 'All';
      const urlState = params.get('state') || 'All';

      setQ((prev) => (prev === urlQ ? prev : urlQ));
      setCity((prev) => (prev === urlCity ? prev : urlCity));
      try { setStateSelection((prev) => (prev === urlState ? prev : urlState)); } catch (err) { console.error('sync set stateSelection', err); }
    }

    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => { isSyncingRef.current = false; }, 0);
  }, [location]);

  // debounce navigation (only when user has interacted)
  useEffect(() => {
    const shouldNavigate = q || (city && city !== 'All') || (stateSelection && stateSelection !== 'All');

    // Prevent the auto-navigation from hijacking the Home route when there is no active filter
    if (location.pathname === '/' && !shouldNavigate) return;
    if (!shouldNavigate) return; // don't auto-navigate on mount or when filters are cleared

    // do not run auto-navigation while syncing state from URL
    if (isSyncingRef.current) return;

    const t = setTimeout(() => {
      if (isSyncingRef.current) return; // double check inside timeout

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city && city !== 'All') params.set('city', city);
      if (stateSelection && stateSelection !== 'All') params.set('state', stateSelection);
      const query = params.toString();
      const target = `/explore${query ? `?${query}` : ''}`;

      // avoid navigating to the same path (prevents back/forward loops)
      const current = location.pathname + location.search;
      if (current === target) return;

      console.log('[NAV DEBUG] NavBar auto-navigate to', target);
      navigate(target);
    }, 500);
    return () => clearTimeout(t);
  }, [q, city, stateSelection, navigate, location.pathname, location.search]);

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city && city !== 'All') params.set('city', city);
    if (stateSelection && stateSelection !== 'All') params.set('state', stateSelection);
    navigate(`/explore?${params.toString()}`);
  };

  // Reset filters and navigate home when clicking the logo
  const handleLogoClick = (e) => {
    e.preventDefault();
    isSyncingRef.current = true; // avoid triggering auto-nav while we reset
    try {
      setStateSelection('All');
    } catch (err) { console.error('reset stateSelection', err); }
    setCity('All');
    setQ('');
    // small delay to ensure syncing flag prevents immediate auto-nav via effects
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => { isSyncingRef.current = false; }, 0);
    navigate('/');
  };

  return (
    <nav className={`sticky top-0 z-50 p-3 flex items-center justify-between glass glass-border transition-shadow ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}>
      <Link to="/" onClick={handleLogoClick} className="text-xl font-semibold tracking-tight flex items-center gap-2">
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
