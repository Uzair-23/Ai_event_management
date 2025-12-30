import { useEffect, useState } from 'react';
import API from '../services/api';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

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
        <div className="p-6 glass glass-border rounded text-center">
          <p className="text-muted">No tickets yet. Explore events and register to get your tickets here.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tickets.map((t) => (
          <motion.div key={t._id} whileHover={{ y: -4, boxShadow: '0 0 18px rgba(168,85,247,0.18)' }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="p-4 glass glass-border rounded">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold text-foreground">{t.event.title}</div>
                <div className="text-sm text-muted-foreground">{new Date(t.event.date).toLocaleDateString()} • {t.event.location?.city || 'Online'}</div>
              </div>
              <div className="flex-shrink-0">
                <img src={t.qrData} alt="qr" className="w-32 h-32 bg-white p-2 rounded-md object-contain" />
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <a href={t.qrData} download={`ticket-${t.ticketId}.png`} className="px-3 py-1 bg-primary text-primary-foreground rounded">Download</a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
