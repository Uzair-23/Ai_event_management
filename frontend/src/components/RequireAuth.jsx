import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

export function RequireAuth({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log('[AUTH DEBUG] RequireAuth redirecting to /login - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
      navigate('/login');
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded || !isSignedIn) return null; // or a loader
  return children;
}

export function RequireOrganizer({ children }) {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    const role = user?.publicMetadata?.role || 'USER';
    if (role !== 'ORGANIZER') {
      console.log('[AUTH DEBUG] RequireOrganizer redirecting to / - role:', role);
      navigate('/');
    }
  }, [isLoaded, user, navigate]);

  if (!isLoaded) return null;
  const role = user?.publicMetadata?.role || 'USER';
  if (role !== 'ORGANIZER') return null;
  return children;
}
