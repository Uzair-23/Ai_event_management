import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import API from "../services/api";
import { useUser } from "@clerk/clerk-react";
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { State, City } from 'country-state-city';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from "sonner";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function EditEvent() {
  const { id } = useParams();
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    venue: "",
    date: "",
    time: "",
    location: "",
    state: "",
    totalSeats: 100,
    isOnline: false,
    mapLink: "",
  });

  const [selectedDate, setSelectedDate] = useState(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load event data
  useEffect(() => {
    if (!isSignedIn) {
      toast.error('Please sign in to edit events');
      navigate('/');
      return;
    }
    
    fetchEvent();
  }, [id, isSignedIn]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      console.log('[EDIT EVENT] Fetching event:', id);
      
      const { data } = await API.get(`/events/${id}`);
      const event = data.event || data; // Handle both response formats
      
      console.log('[EDIT EVENT] Event data:', event);
      
      // Check if user is the organizer
      const eventOrganizerId = event.organizerId || event.organizer?._id || event.organizer;
      console.log('[EDIT EVENT] User ID:', user.id);
      console.log('[EDIT EVENT] Event Organizer ID:', eventOrganizerId);
      
      if (String(eventOrganizerId) !== String(user.id)) {
        toast.error('You are not authorized to edit this event');
        navigate('/explore');
        return;
      }
      
      setForm({
        title: event.title || "",
        description: event.description || "",
        category: event.category || "",
        venue: event.venue || "",
        date: event.date || "",
        time: event.time || "",
        location: event.location || "",
        state: event.state || "",
        totalSeats: event.totalSeats || 100,
        isOnline: event.isOnline || false,
        mapLink: event.mapLink || "",
      });
      
      if (event.date) {
        setSelectedDate(new Date(event.date));
      }
      
      toast.success('Event loaded successfully');
    } catch (err) {
      console.error('[EDIT EVENT] Error fetching event:', err);
      toast.error(err.response?.data?.message || 'Failed to load event');
      navigate('/organizer-dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Load states
  useEffect(() => {
    const sts = State.getStatesOfCountry('IN') || [];
    setStates(sts.map(s => s.name));
  }, []);

  const handleDateSelect = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setForm(prev => ({ ...prev, date: date.toISOString() }));
    setIsCalendarOpen(false);
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    
    if (!isSignedIn || !user) {
      toast.error("Please sign in first");
      return;
    }

    // Validation
    if (!form.title) {
      toast.error("Please enter event title");
      return;
    }
    if (!form.category) {
      toast.error("Please enter event category");
      return;
    }
    if (!form.date) {
      toast.error("Please select event date");
      return;
    }
    if (!form.time) {
      toast.error("Please select event time");
      return;
    }
    if (!form.isOnline) {
      if (!form.venue) {
        toast.error("Please enter venue name");
        return;
      }
      if (!form.location) {
        toast.error("Please enter city");
        return;
      }
      if (!form.state) {
        toast.error("Please select state");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        date: form.date,
        time: form.time,
        venue: form.isOnline ? 'Online' : form.venue,
        location: form.isOnline ? 'Virtual' : form.location,
        state: form.isOnline ? 'N/A' : form.state,
        totalSeats: form.totalSeats,
        isOnline: form.isOnline,
        mapLink: form.isOnline ? undefined : (form.mapLink || undefined),
      };

      console.log('[EDIT EVENT] Updating with payload:', payload);

      await API.put(`/events/${id}`, payload);

      toast.success("Event updated successfully! 🎉");
      
      setTimeout(() => {
        navigate('/organizer-dashboard');
      }, 1500);
    } catch (err) {
      console.error('[EDIT EVENT] Update error:', err);
      toast.error(err.response?.data?.message || "Error updating event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading event...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center py-12">
      <div className="w-full max-w-6xl p-6 glass-strong glass-border neon-border rounded-lg">
        <motion.h2 
          className="text-3xl font-bold mb-6 text-foreground" 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          Edit Event
        </motion.h2>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: primary info */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                className="w-full bg-background/20 border-white/5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                className="w-full bg-background/20 border-white/5 p-3 rounded text-white" 
                rows={6} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <Input 
                value={form.category} 
                onChange={(e) => setForm({ ...form, category: e.target.value })} 
                className="w-full bg-background/20 border-white/5"
                required
              />
            </div>
          </div>

          {/* Right: logistics */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-white/10 pb-2">
              Location & Time
            </h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left bg-background/20 border border-white/5 rounded-md hover:bg-background/30 transition-colors text-white"
                  >
                    <span className={selectedDate ? "text-white" : "text-gray-400"}>
                      {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="rounded-md border-0"
                  />
                </PopoverContent>
              </Popover>
              
              {form.date && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ Selected: {format(new Date(form.date), 'PPP')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input 
                type="time" 
                value={form.time} 
                onChange={(e) => setForm({ ...form, time: e.target.value })} 
                className="p-2 bg-background/20 border-white/5 rounded w-full text-white"
                required
              />
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input 
                type="checkbox" 
                id="online-edit"
                className="h-4 w-4 rounded border-white/10 bg-background/20 accent-primary" 
                checked={form.isOnline} 
                onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} 
              />
              <label htmlFor="online-edit" className="text-sm font-medium">
                Online event
              </label>
            </div>

            <AnimatePresence>
              {!form.isOnline && (
                <motion.div 
                  key="offline" 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="space-y-3 overflow-hidden"
                >
                  <Input 
                    placeholder="Venue Name" 
                    value={form.venue} 
                    onChange={(e) => setForm({ ...form, venue: e.target.value })} 
                    className="bg-background/20 border-white/5"
                    required={!form.isOnline}
                  />
                  <Input 
                    placeholder="City" 
                    value={form.location} 
                    onChange={(e) => setForm({ ...form, location: e.target.value })} 
                    className="bg-background/20 border-white/5"
                    required={!form.isOnline}
                  />
                  <select 
                    value={form.state} 
                    onChange={(e) => setForm({ ...form, state: e.target.value })} 
                    className="w-full p-2 bg-background/20 border-white/5 rounded text-white text-sm"
                    required={!form.isOnline}
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Input 
                    placeholder="Google Maps Link" 
                    value={form.mapLink} 
                    onChange={(e) => setForm({ ...form, mapLink: e.target.value })} 
                    className="bg-background/20 border-white/5"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Total Seats</label>
              <Input 
                type="number" 
                value={form.totalSeats} 
                onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })} 
                className="w-full bg-background/20 border-white/5"
                min="1"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                type="submit"
                disabled={submitting} 
                className="flex-1 bg-accent hover:bg-accent/90 text-black font-bold"
              >
                {submitting ? 'Updating…' : 'Update Event'}
              </Button>
              <Button 
                type="button"
                onClick={() => navigate('/organizer-dashboard')} 
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}