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
import { toast } from "sonner"; // Assuming you use sonner for toasts

export default function CreateEvent() {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();

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
  const [isGenerating, setIsGenerating] = useState(false); // FIXED: Declared isGenerating
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);

  // Generate AI-assisted event content
  const handleAI = async (e) => {
    if (e) e.preventDefault(); // FIXED: Prevents page refresh
    
    if (!form.title || !form.idea || !form.category) {
      alert("Please fill title, idea and category first");
      return;
    }

    try {
      setIsGenerating(true); // FIXED: Uses isGenerating
      const { data } = await API.post("/ai/generate", {
        title: form.title,
        idea: form.idea,
        category: form.category,
        audience: "general",
      });
      setAiOutput(data);
      
      // Auto-fill description if AI provides it
      if (data.description) {
        setForm(prev => ({ ...prev, idea: data.description }));
      }
      toast.success("Content generated!");
    } catch (err) {
      console.error(err);
      alert("AI generation failed. Ensure you are logged in as an ORGANIZER and have an API key.");
    } finally {
      setIsGenerating(false); // FIXED: Ensures loading stops even on error
    }
  };

  const handleCoverChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
    setForm({ ...form, coverImage: f });
  };

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

  const publish = async (e) => {
    if (e) e.preventDefault();
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
        organizerId: user.id,
        isOnline: !!form.isOnline,
        mapLink: form.isOnline ? undefined : (form.mapLink || undefined),
      };

      await API.post("/events", payload);
      alert("Event created successfully 🎉");
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
        <motion.h2 className="text-3xl font-bold mb-6 text-foreground" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          Create Event (AI Assisted)
        </motion.h2>

        <SignedOut>
          <p className="text-muted-foreground">Please sign in to create an event.</p>
        </SignedOut>

        <SignedIn>
          <motion.form initial="hidden" animate="visible" variants={container} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: primary info */}
            <motion.div variants={item} className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Event Title</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-background/20 border-white/5" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description / Idea (used by AI)</label>
                <textarea value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} className="w-full bg-background/20 border-white/5 p-3 rounded text-white" rows={4} />
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-background/20 border-white/5" />
                </div>

                <div className="w-44">
                  {/* FIXED: type="button" added to prevent refresh, and uses isGenerating */}
                  <Button type="button" onClick={handleAI} disabled={isGenerating} className="w-full bg-primary hover:bg-primary/80 text-white">
                    {isGenerating ? 'Generating…' : 'Generate with AI'}
                  </Button>
                </div>
              </div>

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
                    <label htmlFor="coverFile" className="px-4 py-2 bg-white/10 text-white rounded cursor-pointer backdrop-blur-md border border-white/20">Click to upload</label>
                    <input id="coverFile" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: logistics */}
            <motion.div variants={item} className="md:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-white/10 pb-2">Location & Time</h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-background/20 border-white/5">
                      {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate ? new Date(selectedDate) : undefined} onSelect={(d) => { const iso = d ? new Date(d).toISOString() : ''; setSelectedDate(iso); setForm({ ...form, date: iso }); }} />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="p-2 bg-background/20 border-white/5 rounded w-full text-white" />
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input type="checkbox" id="online" className="h-4 w-4 rounded border-white/10 bg-background/20 accent-primary" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} />
                <label htmlFor="online" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Online event</label>
              </div>

              <AnimatePresence>
                {!form.isOnline && (
                  <motion.div key="offline" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                    <Input placeholder="Venue Name" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="bg-background/20 border-white/5" />
                    <Input placeholder="City" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-background/20 border-white/5" />
                    <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full p-2 bg-background/20 border-white/5 rounded text-white text-sm">
                      <option value="" className="bg-black text-white">Select State</option>
                      {states.map((s) => (<option key={s} value={s} className="bg-black text-white">{s}</option>))}
                    </select>
                    <Input placeholder="Google Maps Link" value={form.mapLink} onChange={(e) => setForm({ ...form, mapLink: e.target.value })} className="bg-background/20 border-white/5" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Total Seats</label>
                <Input type="number" value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })} className="bg-background/20 border-white/5" />
              </div>

              <div className="pt-4">
                <Button onClick={publish} disabled={submitting} className="w-full bg-accent hover:bg-accent/90 text-black font-bold btn-shimmer">
                  {submitting ? 'Creating…' : 'Publish Event'}
                </Button>
              </div>
            </motion.div>

            {/* AI Output Preview */}
            {aiOutput && (
              <motion.div variants={item} className="md:col-span-3 mt-4 p-4 bg-white/5 border border-primary/20 rounded-xl">
                <h3 className="text-primary font-bold mb-2 flex items-center gap-2">✨ AI Generated Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                   <div><span className="text-white font-medium">Venue Type:</span> {aiOutput.venueType}</div>
                   <div><span className="text-white font-medium">Duration:</span> {aiOutput.suggestedDuration} hours</div>
                </div>
                <div className="mt-3">
                   <p className="text-white font-medium mb-1">Highlights:</p>
                   <div className="flex flex-wrap gap-2">
                      {aiOutput.highlights?.map((h, i) => <span key={i} className="px-2 py-1 bg-primary/10 rounded-md border border-primary/20 text-xs">#{h}</span>)}
                   </div>
                </div>
              </motion.div>
            )}
          </motion.form>
        </SignedIn>
      </div>
    </div>
  );
}