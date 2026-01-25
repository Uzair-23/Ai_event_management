import { useEffect, useState, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Button } from './ui/button';
import { State, City } from 'country-state-city';
import { FilterContext } from '../context/FilterContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Menu, 
  X, 
  Search, 
  Home, 
  Compass, 
  PlusCircle, 
  Ticket, 
  LogIn, 
  UserPlus,
  ChevronDown
} from 'lucide-react';

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

  // Mobile states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const underlineVariants = {
    initial: { scaleX: 0 },
    hover: { scaleX: 1 }
  };

  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  // Check if user is an organizer
  const isOrganizer = isLoaded && user?.publicMetadata?.role === 'ORGANIZER';

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
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

  // Navigation items for mobile menu
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/create', label: 'Create Event', icon: PlusCircle, highlight: true },
    { to: '/tickets', label: 'My Tickets', icon: Ticket },
  ];

  return (
    <>
      <motion.nav
        initial={false}
        animate={scrolled ? { y: -6 } : { y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className={`fixed inset-x-0 ${scrolled ? 'top-4 px-2 sm:px-4' : 'top-0'} z-50 pointer-events-auto`}
      >
        <motion.div
          initial={false}
          animate={scrolled ? { padding: '6px 12px' } : { padding: '12px 16px' }}
          transition={{ duration: 0.18 }}
          className={`mx-auto ${scrolled ? 'max-w-6xl rounded-full' : 'w-full'} glass glass-border border-b border-primary/20 transition-all`}
        >
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Logo */}
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 relative shrink-0">
              <img src="/logo.png" alt="AI Events" className="h-7 sm:h-8 w-auto" />
            </Link>

            {/* Desktop Search Form - Hidden on mobile */}
            <form 
              onSubmit={onSubmit} 
              className="hidden lg:flex flex-1 max-w-3xl mx-4 xl:mx-6 items-center gap-2 xl:gap-3"
            >
              <Input 
                placeholder="Search events..." 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                className="flex-1 h-9 text-sm focus:ring-2 focus:ring-neon-violet/40 transition-shadow" 
              />

              <Select
                value={stateSelection}
                onValueChange={(val) => setStateSelection(val)}
              >
                <SelectTrigger className="w-28 xl:w-36 h-9 text-sm">
                  <SelectValue placeholder="State" />
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
                disabled={!stateSelection || stateSelection === 'All'}
              >
                <SelectTrigger className="w-24 xl:w-32 h-9 text-sm">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </form>

            {/* Desktop Navigation Links - Hidden on mobile/tablet */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-3">
              <MotionLink 
                to="/explore" 
                whileHover="hover" 
                className="px-2 xl:px-3 py-1 rounded text-sm transition"
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

              <MotionLink 
                to="/create" 
                whileHover="hover" 
                className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow-md hover:from-brand-500 hover:to-brand-600 transition inline-flex items-center justify-center"
              >
                <span>Create</span>
              </MotionLink>

              <MotionLink 
                to="/tickets" 
                whileHover="hover" 
                className="px-2 xl:px-3 py-1 rounded text-sm transition"
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

              {isOrganizer && (
                <MotionLink 
                  to="/dashboard" 
                  whileHover="hover" 
                  className="px-2 xl:px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 border border-primary/40 text-primary transition inline-flex items-center gap-1 xl:gap-2 shadow-lg shadow-primary/20"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="font-semibold hidden xl:inline">Dashboard</span>
                </MotionLink>
              )}

              <SignedOut>
                <MotionLink 
                  to="/login" 
                  whileHover="hover" 
                  className="px-2 xl:px-3 py-1 rounded text-sm transition"
                >
                  <span>Login</span>
                </MotionLink>
                <MotionLink 
                  to="/register" 
                  whileHover="hover" 
                  className="px-3 py-1 rounded text-sm bg-white/10 hover:bg-white/20 transition"
                >
                  <span>Register</span>
                </MotionLink>
              </SignedOut>

              <SignedIn>
                <div className="ml-1 xl:ml-2">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8 xl:h-9 xl:w-9 ring-2 ring-primary/30 hover:ring-primary/50 transition"
                      }
                    }}
                  >
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

            {/* Mobile/Tablet Actions */}
            <div className="flex lg:hidden items-center gap-1 sm:gap-2">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* User Button (Mobile) */}
              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              </SignedIn>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar - Expandable */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={onSubmit}
                className="lg:hidden overflow-hidden"
              >
                <div className="pt-3 pb-1 space-y-2">
                  <Input 
                    placeholder="Search events..." 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)} 
                    className="w-full h-10" 
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Select value={stateSelection} onValueChange={setStateSelection}>
                      <SelectTrigger className="flex-1 h-10">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={city}
                      onValueChange={setCity}
                      disabled={!stateSelection || stateSelection === 'All'}
                    >
                      <SelectTrigger className="flex-1 h-10">
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full h-10">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] sm:w-[320px] bg-black/95 border-l border-white/10 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-4 sm:p-6 space-y-6">
                {/* Close Button */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Menu</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-primary/20 text-primary' 
                            : item.highlight 
                              ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white'
                              : 'hover:bg-white/10'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Dashboard - Only for Organizers */}
                  {isOrganizer && (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        location.pathname === '/dashboard'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-primary/10 border border-primary/30 text-primary'
                      }`}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  )}
                </nav>

                {/* Auth Section */}
                <div className="border-t border-white/10 pt-6">
                  <SignedOut>
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all"
                      >
                        <LogIn className="h-5 w-5" />
                        <span className="font-medium">Login</span>
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                      >
                        <UserPlus className="h-5 w-5" />
                        <span className="font-medium">Register</span>
                      </Link>
                    </div>
                  </SignedOut>

                  <SignedIn>
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                      <UserButton afterSignOutUrl="/" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.fullName || user?.firstName || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </div>
                  </SignedIn>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}