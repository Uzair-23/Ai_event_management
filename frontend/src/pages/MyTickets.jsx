import { useEffect, useState } from 'react';
import API from '../services/api';
import { useUser } from '@clerk/clerk-react';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    console.log('[NAV DEBUG] MyTickets mount - isSignedIn=', isSignedIn, 'user=', user?.id);
    const fetch = async () => {
      setLoading(true);
      if (!isSignedIn || !user) {
        setTickets([]);
        setLoading(false);
        return;
      }
      const { data } = await API.get(`/tickets/me?userId=${user.id}`);
      setTickets(data.tickets || []);
      setLoading(false);
    };
    fetch();
  }, [user, isSignedIn]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Tickets</h2>

      {loading && <div className="text-muted">Loading tickets…</div>}

      {!loading && tickets.length === 0 && (
        <div className="p-6 bg-card rounded text-center">
          <p className="text-muted">No tickets yet. Explore events and register to get your tickets here.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tickets.map((t) => (
          <div key={t._id} className="p-4 bg-card rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.event.title}</div>
                <div className="text-sm text-muted">{new Date(t.event.date).toLocaleDateString()} • {t.event.location?.city || 'Online'}</div>
              </div>
              <div>
                <img src={t.qrData} alt="qr" className="w-32 h-32" />
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <a href={t.qrData} download={`ticket-${t.ticketId}.png`} className="px-3 py-1 bg-primary text-primary-foreground rounded">Download</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
