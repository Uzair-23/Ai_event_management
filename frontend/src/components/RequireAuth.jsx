import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

export function RequireAuth({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate('/login');
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
    if (role !== 'ORGANIZER') navigate('/');
  }, [isLoaded, user, navigate]);

  if (!isLoaded) return null;
  const role = user?.publicMetadata?.role || 'USER';
  if (role !== 'ORGANIZER') return null;
  return children;
}
