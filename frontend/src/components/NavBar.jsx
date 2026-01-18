import { useEffect, useState, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Button } from './ui/button';
import { State, City } from 'country-state-city';
import { FilterContext } from '../context/FilterContext';
import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';

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
  const { user, isLoaded } = useUser();
  const MotionLink = motion(Link);

  const underlineVariants = {
    initial: { scaleX: 0 },
    hover: { scaleX: 1 }
  };

  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  // ✅ Check if user is an organizer
  const isOrganizer = isLoaded && user?.publicMetadata?.role === 'ORGANIZER';

  useEffect(() => {
    return () => clearTimeout(syncTimeoutRef.current);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sts = State.getStatesOfCountry('IN') || [];
    const list = [{ name: 'All', isoCode: null }, ...sts.map(s => ({ name: s.name, isoCode: s.isoCode }))];
    setStates(list);

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

  useEffect(() => {
    if (!stateSelection || stateSelection === 'All') {
      setCities(['All']);
      setSelectedStateCode(null);
      setCity('All');
      return;
    }

    const s = states.find(x => x.name === stateSelection);
    const iso = s?.isoCode;

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

  useEffect(() => {
    const { pathname, search } = location;

    isSyncingRef.current = true;

    if (pathname === '/') {
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

  useEffect(() => {
    const shouldNavigate = q || (city && city !== 'All') || (stateSelection && stateSelection !== 'All');

    if (location.pathname === '/' && !shouldNavigate) return;
    if (!shouldNavigate) return;

    if (isSyncingRef.current) return;

    const t = setTimeout(() => {
      if (isSyncingRef.current) return;

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city && city !== 'All') params.set('city', city);
      if (stateSelection && stateSelection !== 'All') params.set('state', stateSelection);
      const query = params.toString();
      const target = `/explore${query ? `?${query}` : ''}`;

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

  const handleLogoClick = (e) => {
    e.preventDefault();
    isSyncingRef.current = true;
    try {
      setStateSelection('All');
    } catch (err) { console.error('reset stateSelection', err); }
    setCity('All');
    setQ('');
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => { isSyncingRef.current = false; }, 0);
    navigate('/');
  };

  return (
    <motion.nav
      initial={false}
      animate={scrolled ? { y: -6 } : { y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`fixed inset-x-0 ${scrolled ? 'top-4' : 'top-0'} z-50 pointer-events-auto`}
    >
      <motion.div
        initial={false}
        animate={scrolled ? { padding: '6px 1rem' } : { padding: '12px 1rem' }}
        transition={{ duration: 0.18 }}
        className={`mx-auto ${scrolled ? 'max-w-6xl rounded-full' : 'w-full'} glass glass-border border-b border-primary/20 transition-all`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 relative shrink-0">
            <img src="/logo.png" alt="AI Events" className="h-8 w-auto" />
          </Link>

          {/* Search Form - Hidden on small screens when scrolled */}
          <form 
            onSubmit={onSubmit} 
            className={`${scrolled ? 'hidden lg:flex' : 'flex'} flex-1 max-w-3xl mx-6 items-center gap-3`}
          >
            <Input 
              placeholder="Search events..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              className="flex-1 focus:ring-2 focus:ring-neon-violet/40 transition-shadow" 
            />

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

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            {/* Explore */}
            <MotionLink 
              to="/explore" 
              whileHover="hover" 
              className="hidden md:block px-3 py-1 rounded text-sm transition"
            >
              <div className="relative inline-block">
                <span>Explore</span>
                <motion.div 
                  variants={underlineVariants} 
                  initial="initial" 
                  className="absolute left-0 -bottom-1 h-[2px] w-full bg-primary" 
                  style={{ transformOrigin: 'center' }} 
                  transition={{ duration: 0.3, ease: 'easeInOut' }} 
                />
              </div>
            </MotionLink>

            {/* Create Event */}
            <MotionLink 
              to="/create" 
              whileHover="hover" 
              className="hidden md:inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow-md hover:from-brand-500 hover:to-brand-600 transition items-center justify-center"
            >
              <div className="relative inline-block">
                <span>Create</span>
              </div>
            </MotionLink>

            {/* My Tickets */}
            <MotionLink 
              to="/tickets" 
              whileHover="hover" 
              className="hidden md:block px-3 py-1 rounded text-sm transition"
            >
              <div className="relative inline-block">
                <span>My Tickets</span>
                <motion.div 
                  variants={underlineVariants} 
                  initial="initial" 
                  className="absolute left-0 -bottom-1 h-[2px] w-full bg-primary" 
                  style={{ transformOrigin: 'center' }} 
                  transition={{ duration: 0.3, ease: 'easeInOut' }} 
                />
              </div>
            </MotionLink>

            {/* ✅ Organizer Dashboard - Only visible to ORGANIZER role */}
            {isOrganizer && (
              <MotionLink 
                to="/dashboard" 
                whileHover="hover" 
                className="hidden md:inline-flex px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 border border-primary/40 text-primary transition items-center gap-2 shadow-lg shadow-primary/20"
              >
                <LayoutDashboard className="h-4 w-4" />
                <div className="relative inline-block">
                  <span className="font-semibold">Dashboard</span>
                </div>
              </MotionLink>
            )}

            {/* Auth Links */}
            <SignedOut>
              <MotionLink 
                to="/login" 
                whileHover="hover" 
                className="hidden md:block px-3 py-1 rounded text-sm transition"
              >
                <div className="relative inline-block">
                  <span>Login</span>
                  <motion.div 
                    variants={underlineVariants} 
                    initial="initial" 
                    className="absolute left-0 -bottom-1 h-[2px] w-full bg-primary" 
                    style={{ transformOrigin: 'center' }} 
                    transition={{ duration: 0.3, ease: 'easeInOut' }} 
                  />
                </div>
              </MotionLink>
              <MotionLink 
                to="/register" 
                whileHover="hover" 
                className="px-3 py-1 rounded text-sm transition"
              >
                <div className="relative inline-block">
                  <span>Register</span>
                  <motion.div 
                    variants={underlineVariants} 
                    initial="initial" 
                    className="absolute left-0 -bottom-1 h-[2px] w-full bg-primary" 
                    style={{ transformOrigin: 'center' }} 
                    transition={{ duration: 0.3, ease: 'easeInOut' }} 
                  />
                </div>
              </MotionLink>
            </SignedOut>

            {/* User Button */}
            <SignedIn>
              <div className="ml-2">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 ring-2 ring-primary/30 hover:ring-primary/50 transition"
                    }
                  }}
                >
                  {/* Custom menu items in UserButton */}
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="My Tickets"
                      labelIcon={<span>🎫</span>}
                      href="/tickets"
                    />
                    {isOrganizer && (
                      <UserButton.Link
                        label="Dashboard"
                        labelIcon={<LayoutDashboard className="h-4 w-4" />}
                        href="/dashboard"
                      />
                    )}
                    <UserButton.Action label="manageAccount" />
                    <UserButton.Action label="signOut" />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            </SignedIn>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
}