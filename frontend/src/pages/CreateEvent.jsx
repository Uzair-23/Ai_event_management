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
import { toast } from "sonner";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

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
  });

  const [selectedDate, setSelectedDate] = useState(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState(['All']);
  const [aiOutput, setAiOutput] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const handleAI = async (e) => {
    if (e) e.preventDefault();
    
    if (!form.title || !form.idea || !form.category) {
      toast.error("Please fill title, idea and category first");
      return;
    }

    try {
      setIsGenerating(true);
      const { data } = await API.post("/ai/generate", {
        title: form.title,
        idea: form.idea,
        category: form.category,
        audience: "general",
      });
      setAiOutput(data);
      
      if (data.description) {
        setForm(prev => ({ ...prev, idea: data.description }));
      }
      toast.success("Content generated!");
    } catch (err) {
      console.error("AI generation error:", err);
      toast.error(err.response?.data?.message || "AI generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
    setCoverFile(file);
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

  const handleDateSelect = (date) => {
    console.log("Date selected:", date);
    if (!date) return;
    
    setSelectedDate(date);
    setForm(prev => ({ ...prev, date: date.toISOString() }));
    setIsCalendarOpen(false); // Close the popover after selection
    
    toast.success(`Date selected: ${format(date, 'PPP')}`);
  };

  const publish = async (e) => {
    if (e) e.preventDefault();
    
    console.log("=== PUBLISH EVENT DEBUG ===");
    console.log("Form data:", form);
    
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
        description: aiOutput?.description || form.idea,
        category: form.category,
        date: form.date,
        time: form.time,
        venue: form.isOnline ? 'Online' : form.venue,
        location: form.isOnline ? 'Virtual' : form.location,
        state: form.isOnline ? 'N/A' : form.state,
        totalSeats: form.totalSeats,
        organizerId: user.id,
        isOnline: form.isOnline,
        mapLink: form.isOnline ? undefined : (form.mapLink || undefined),
      };

      console.log("Payload:", payload);

      const response = await API.post("/events", payload);
      
      console.log("Response:", response.data);
      
      toast.success("Event created successfully! 🎉");
      
      setTimeout(() => {
        navigate('/explore');
      }, 1500);
      
    } catch (err) {
      console.error("=== ERROR CREATING EVENT ===");
      console.error("Full error:", err);
      console.error("Error response:", err.response);
      
      const errorMessage = err.response?.data?.message || err.message || "Failed to create event";
      toast.error(errorMessage);
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
        <motion.h2 
          className="text-3xl font-bold mb-6 text-foreground" 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          Create Event (AI Assisted)
        </motion.h2>

        <SignedOut>
          <p className="text-muted-foreground">Please sign in to create an event.</p>
        </SignedOut>

        <SignedIn>
          <motion.form 
            initial="hidden" 
            animate="visible" 
            variants={container} 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            onSubmit={publish}
          >
            {/* Left: primary info */}
            <motion.div variants={item} className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  className="w-full bg-background/20 border-white/5"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description / Idea (used by AI)
                </label>
                <textarea 
                  value={form.idea} 
                  onChange={(e) => setForm({ ...form, idea: e.target.value })} 
                  className="w-full bg-background/20 border-white/5 p-3 rounded text-white" 
                  rows={4}
                  placeholder="Describe your event idea..."
                />
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={form.category} 
                    onChange={(e) => setForm({ ...form, category: e.target.value })} 
                    className="w-full bg-background/20 border-white/5"
                    placeholder="e.g., Technology, Music, Sports"
                    required
                  />
                </div>

                <div className="w-44">
                  <Button 
                    type="button" 
                    onClick={handleAI} 
                    disabled={isGenerating} 
                    className="w-full bg-primary hover:bg-primary/80 text-white"
                  >
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
                    <label 
                      htmlFor="coverFile" 
                      className="px-4 py-2 bg-white/10 text-white rounded cursor-pointer backdrop-blur-md border border-white/20"
                    >
                      Click to upload
                    </label>
                    <input 
                      id="coverFile" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleCoverChange} 
                      className="hidden" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: logistics */}
            <motion.div variants={item} className="md:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-white/10 pb-2">
                Location & Time
              </h3>

              {/* DATE PICKER - COMPLETELY REWRITTEN */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("Calendar button clicked");
                        setIsCalendarOpen(!isCalendarOpen);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left bg-background/20 border border-white/5 rounded-md hover:bg-background/30 transition-colors text-white"
                    >
                      <span className={selectedDate ? "text-white" : "text-gray-400"}>
                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                      </span>
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 bg-gray-900 border-white/10" 
                    align="start"
                    side="bottom"
                  >
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
                  id="online" 
                  className="h-4 w-4 rounded border-white/10 bg-background/20 accent-primary" 
                  checked={form.isOnline} 
                  onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} 
                />
                <label 
                  htmlFor="online" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
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
                      placeholder="Venue Name *" 
                      value={form.venue} 
                      onChange={(e) => setForm({ ...form, venue: e.target.value })} 
                      className="bg-background/20 border-white/5"
                      required={!form.isOnline}
                    />
                    <Input 
                      placeholder="City *" 
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
                      <option value="" className="bg-black text-white">Select State *</option>
                      {states.map((s) => (
                        <option key={s} value={s} className="bg-black text-white">{s}</option>
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
                  className="bg-background/20 border-white/5"
                  min="1"
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit"
                  disabled={submitting} 
                  className="w-full bg-accent hover:bg-accent/90 text-black font-bold btn-shimmer"
                >
                  {submitting ? 'Creating…' : 'Publish Event'}
                </Button>
              </div>
            </motion.div>

            {/* AI Output Preview */}
            {aiOutput && (
              <motion.div 
                variants={item} 
                className="md:col-span-3 mt-4 p-4 bg-white/5 border border-primary/20 rounded-xl"
              >
                <h3 className="text-primary font-bold mb-2 flex items-center gap-2">
                  ✨ AI Generated Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="text-white font-medium">Venue Type:</span> {aiOutput.venueType}
                  </div>
                  <div>
                    <span className="text-white font-medium">Duration:</span> {aiOutput.suggestedDuration} hours
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-white font-medium mb-1">Highlights:</p>
                  <div className="flex flex-wrap gap-2">
                    {aiOutput.highlights?.map((h, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-1 bg-primary/10 rounded-md border border-primary/20 text-xs"
                      >
                        #{h}
                      </span>
                    ))}
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