import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import NavBar from './components/NavBar';

import Home from './pages/Home';
import Explore from './pages/Explore';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import OrganizerDashboard from './pages/OrganizerDashboard';
import MyTickets from './pages/MyTickets';
import Login from './pages/Login';
import Register from './pages/Register';
import { RequireAuth, RequireOrganizer } from './components/RequireAuth';
import { ClerkProvider } from '@clerk/clerk-react';


export default function App() {
  function RouteLogger() {
    const location = useLocation();
    const { isSignedIn, isLoaded } = useAuth();
    useEffect(() => {
      console.log('[NAV DEBUG] path=', location.pathname + location.search, 'signedIn=', isLoaded ? isSignedIn : 'loading');
    }, [location, isSignedIn, isLoaded]);
    return null;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <RouteLogger />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/events/:id" element={<EventDetails />} />

          {/* Protected: signed-in users */}
          <Route
            path="/create"
            element={<RequireAuth><CreateEvent /></RequireAuth>}
          />
          <Route
            path="/tickets"
            element={<RequireAuth><MyTickets /></RequireAuth>}
          />

          {/* Organizer-only */}
          <Route
            path="/dashboard"
            element={<RequireAuth><RequireOrganizer><OrganizerDashboard /></RequireOrganizer></RequireAuth>}
          />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
