import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import API from "../services/api";
import { useUser, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { State, City } from 'country-state-city';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function CreateEvent() {
  const { user, isSignedIn } = useUser();

  const [form, setForm] = useState({
    title: "",
    idea: "",
    category: "",
    venue: "",
    date: "",
    time: "",
    location: "",
    state: "",
    totalSeats: 100,
    isOnline: false,
    mapLink: "",
    coverImage: null,
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState(['All']);

  const [aiOutput, setAiOutput] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);

  // Generate AI-assisted event content
  const handleAI = async () => {
    if (!form.title || !form.idea || !form.category) {
      alert("Please fill title, idea and category first");
      return;
    }

    try {
      setLoadingAI(true);
      const { data } = await API.post("/ai/generate", {
        title: form.title,
        idea: form.idea,
        category: form.category,
        audience: "general",
      });
      setAiOutput(data);
    } catch (err) {
      console.error(err);
      alert("AI generation failed");
    } finally {
      setLoadingAI(false);
    }
  };

  // Publish event
  const navigate = useNavigate();

  // image select handler
  const handleCoverChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
    setForm({ ...form, coverImage: f });
  };

  // load India states for state/city cascading
  useEffect(() => {
    const sts = State.getStatesOfCountry('IN') || [];
    setStates(sts.map(s => s.name));
  }, []);

  useEffect(() => {
    if (!form.state) {
      setCities(['All']);
      return;
    }
    const s = State.getStatesOfCountry('IN').find(x => x.name === form.state);
    const iso = s?.isoCode;
    if (iso) {
      const cityList = City.getCitiesOfState('IN', iso) || [];
      setCities(['All', ...cityList.map(c => c.name)]);
    } else {
      setCities(['All']);
    }
  }, [form.state]);

  const publish = async () => {
    if (!isSignedIn || !user) {
      alert("Please sign in first");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        description: aiOutput?.description || form.idea,
        category: form.category,
        date: form.date,
        time: form.time,
        venue: form.isOnline ? 'Online' : form.venue,
        location: form.isOnline ? 'Virtual' : form.location,
        state: form.isOnline ? 'N/A' : form.state,
        totalSeats: form.totalSeats,
        organizerId: user.id, // Clerk user ID
        isOnline: !!form.isOnline,
        mapLink: form.isOnline ? undefined : (form.mapLink || undefined),
      };

      await API.post("/events", payload);

      alert("Event created successfully 🎉");
      console.log('[NAV DEBUG] CreateEvent navigating to /explore');
      navigate('/explore');
    } catch (err) {
      console.error(err);
      alert("Error creating event");
    } finally {
      setSubmitting(false);
    }
  };

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } }
  };

  const item = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center py-12">
      <div className="w-full max-w-6xl p-6 glass-strong glass-border neon-border rounded-lg">
        <motion.h2 className="text-3xl font-bold mb-6 text-foreground" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>Create Event (AI Assisted)</motion.h2>

        <SignedOut>
          <p className="text-muted-foreground">Please sign in to create an event.</p>
        </SignedOut>

        <SignedIn>
          <motion.form initial="hidden" animate="visible" variants={container} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: primary info */}
            <motion.div variants={item} className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Event Title</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-background/20 border-white/5 focus-within:ring-primary/40" aria-label="Event title" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Short idea (used by AI)</label>
                <textarea value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} placeholder="Short idea (used by AI)" className="w-full bg-background/20 border-white/5 p-3 rounded text-white" rows={4} aria-label="Idea" />
              </div>

              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-background/20 border-white/5" aria-label="Category" />
                </div>

                <div className="w-44">
                  <label className="block text-sm font-medium text-foreground mb-2">AI</label>
                  <Button onClick={handleAI} disabled={loadingAI} className="w-full" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>{loadingAI ? 'Generating…' : 'Generate'}</Button>
                </div>
              </div>

              {/* Image preview */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
                <div className="relative group">
                  <div className="aspect-video bg-card/40 glass rounded overflow-hidden flex items-center justify-center">
                    {coverPreview ? (
                      <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-sm text-muted-foreground">No image selected</div>
                    )}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <label htmlFor="coverFile" className="px-4 py-2 bg-white/6 text-white rounded cursor-pointer">Click to upload</label>
                    <input id="coverFile" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: logistics */}
            <motion.div variants={item} className="md:col-span-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Location & Time</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                <Popover>
                  <PopoverTrigger className="w-full p-2 bg-background/20 border-white/5 rounded text-left text-white">{selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select date'}</PopoverTrigger>
                  <PopoverContent>
                    <Calendar mode="single" selected={selectedDate ? new Date(selectedDate) : undefined} onSelect={(d) => { const iso = d ? new Date(d).toISOString() : ''; setSelectedDate(iso); setForm({ ...form, date: iso }); }} />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="p-2 bg-background/20 border-white/5 rounded w-full text-white" aria-label="Time" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-brand-500" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} />
                  <span className="text-sm text-foreground">Online event</span>
                </label>
              </div>

              <AnimatePresence>
                {!form.isOnline && (
                  <motion.div key="offline" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Venue</label>
                      <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full bg-background/20 border-white/5" aria-label="Venue" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">City</label>
                      <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-background/20 border-white/5" aria-label="City" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">State</label>
                      <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full p-2 bg-background/20 border-white/5 rounded text-white">
                        <option value="">Select State</option>
                        {states.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Map Link</label>
                      <Input value={form.mapLink} onChange={(e) => setForm({ ...form, mapLink: e.target.value })} className="w-full bg-background/20 border-white/5" aria-label="Map link" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Total Seats</label>
                <Input type="number" value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })} className="w-full bg-background/20 border-white/5" aria-label="Total seats" />
              </div>

              <div className="mt-4">
                <Button onClick={publish} disabled={submitting} className="w-full btn-shimmer" style={{ backgroundColor: 'var(--accent)', color: 'black' }}>{submitting ? 'Creating…' : 'Publish Event'}</Button>
              </div>
            </motion.div>

            {/* AI Output */}
            {aiOutput && (
              <motion.div variants={item} className="md:col-span-3 mt-4 p-4 bg-card rounded">
                <h3 className="font-semibold mb-2">AI Output</h3>
                <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(aiOutput, null, 2)}</pre>
              </motion.div>
            )}
          </motion.form>
        </SignedIn>
      </div>
    </div>
  );
}
