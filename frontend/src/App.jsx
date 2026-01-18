import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import NavBar from './components/NavBar';
import PageTransition from './components/PageTransition';

// Pages
import OrganizerDashboardDetailed from './pages/OrganizerDashboardDetailed';
import Home from './pages/Home';
import Explore from './pages/Explore';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent'; // ✅ ADD THIS IMPORT
import MyTickets from './pages/MyTickets';
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import { RequireAuth, RequireOrganizer } from './components/RequireAuth';
import { Toaster } from './components/ui/sonner';

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
        <main>
          <PageTransition>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected: signed-in users */}
              <Route
                path="/create"
                element={
                  <RequireAuth>
                    <CreateEvent />
                  </RequireAuth>
                }
              />
              
              {/* ✅ FIXED: Edit Event Route */}
              <Route
                path="/edit-event/:id"
                element={
                  <RequireAuth>
                    <EditEvent />
                  </RequireAuth>
                }
              />

              <Route
                path="/tickets"
                element={
                  <RequireAuth>
                    <MyTickets />
                  </RequireAuth>
                }
              />

              {/* ✅ FIXED: Organizer Dashboard - Added both routes */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <RequireOrganizer>
                      <OrganizerDashboardDetailed />
                    </RequireOrganizer>
                  </RequireAuth>
                }
              />
              
              <Route
                path="/organizer-dashboard"
                element={
                  <RequireAuth>
                    <RequireOrganizer>
                      <OrganizerDashboardDetailed />
                    </RequireOrganizer>
                  </RequireAuth>
                }
              />

              {/* 404 Catch-all route */}
              <Route path="*" element={
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-400 mb-4">The page you're looking for doesn't exist.</p>
                    <a href="/" className="text-primary hover:underline">Go back home</a>
                  </div>
                </div>
              } />
            </Routes>
          </PageTransition>
        </main>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}