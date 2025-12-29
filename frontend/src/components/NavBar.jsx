import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

export default function NavBar() {
  return (
    <nav className="p-4 flex items-center justify-between bg-card/60 backdrop-blur-sm">
      <Link to="/" className="text-xl font-semibold">
        AI Events
      </Link>
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
