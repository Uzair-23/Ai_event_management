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
import { Calendar as CalendarIcon, Sparkles, MapPin, Clock, Users, Image } from 'lucide-react';

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
    setIsCalendarOpen(false);
    
    toast.success(`Date selected: ${format(date, 'PPP')}`);
  };

  const publish = async (e) => {
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

      await API.post("/events", payload);
      
      toast.success("Event created successfully! 🎉");
      
      setTimeout(() => {
        navigate('/explore');
      }, 1500);
      
    } catch (err) {
      console.error("Error creating event:", err);
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
    <div className="min-h-screen bg-black text-white flex justify-center py-6 sm:py-12 px-4 sm:px-6 pt-20 sm:pt-24">
      <div className="w-full max-w-6xl p-4 sm:p-6 glass-strong glass-border neon-border rounded-lg">
        <motion.h2 
          className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-foreground flex items-center gap-2" 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Create Event
        </motion.h2>

        <SignedOut>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Please sign in to create an event.</p>
          </div>
        </SignedOut>

        <SignedIn>
          <motion.form 
            initial="hidden" 
            animate="visible" 
            variants={container} 
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
            onSubmit={publish}
          >
            {/* Left: primary info - Full width on mobile, 2 cols on lg */}
            <motion.div variants={item} className="lg:col-span-2 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  className="w-full bg-background/20 border-white/5 h-10 sm:h-11"
                  placeholder="Enter event title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                  Description / Idea (used by AI)
                </label>
                <textarea 
                  value={form.idea} 
                  onChange={(e) => setForm({ ...form, idea: e.target.value })} 
                  className="w-full bg-background/20 border border-white/5 p-3 rounded text-white text-sm sm:text-base" 
                  rows={4}
                  placeholder="Describe your event idea..."
                />
              </div>

              {/* Category + AI Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={form.category} 
                    onChange={(e) => setForm({ ...form, category: e.target.value })} 
                    className="w-full bg-background/20 border-white/5 h-10 sm:h-11"
                    placeholder="e.g., Technology, Music, Sports"
                    required
                  />
                </div>

                <div className="sm:self-end">
                  <Button 
                    type="button" 
                    onClick={handleAI} 
                    disabled={isGenerating} 
                    className="w-full sm:w-auto bg-primary hover:bg-primary/80 text-white h-10 sm:h-11 px-4"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating…' : 'Generate with AI'}
                  </Button>
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Cover Image
                </label>
                <div className="relative group">
                  <div className="aspect-video sm:aspect-[16/8] bg-card/40 glass rounded overflow-hidden flex items-center justify-center">
                    {coverPreview ? (
                      <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-sm text-muted-foreground text-center px-4">
                        <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No image selected
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                    <label 
                      htmlFor="coverFile" 
                      className="px-4 py-2 bg-white/10 text-white rounded cursor-pointer backdrop-blur-md border border-white/20 text-sm"
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

            {/* Right: logistics - Full width on mobile, 1 col on lg */}
            <motion.div variants={item} className="lg:col-span-1 space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground border-b border-white/10 pb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                Location & Time
              </h3>

              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-background/20 border border-white/5 rounded-md hover:bg-background/30 transition-colors text-white text-sm sm:text-base"
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

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time <span className="text-red-500">*</span>
                </label>
                <input 
                  type="time" 
                  value={form.time} 
                  onChange={(e) => setForm({ ...form, time: e.target.value })} 
                  className="p-2.5 bg-background/20 border border-white/5 rounded w-full text-white text-sm sm:text-base"
                  required
                />
              </div>

              {/* Online Checkbox */}
              <div className="flex items-center space-x-2 py-2">
                <input 
                  type="checkbox" 
                  id="online" 
                  className="h-4 w-4 rounded border-white/10 bg-background/20 accent-primary cursor-pointer" 
                  checked={form.isOnline} 
                  onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} 
                />
                <label 
                  htmlFor="online" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Online event (virtual)
                </label>
              </div>

              {/* Offline Fields */}
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
                      className="bg-background/20 border-white/5 h-10"
                      required={!form.isOnline}
                    />
                    <Input 
                      placeholder="City *" 
                      value={form.location} 
                      onChange={(e) => setForm({ ...form, location: e.target.value })} 
                      className="bg-background/20 border-white/5 h-10"
                      required={!form.isOnline}
                    />
                    <select 
                      value={form.state} 
                      onChange={(e) => setForm({ ...form, state: e.target.value })} 
                      className="w-full p-2.5 bg-background/20 border border-white/5 rounded text-white text-sm"
                      required={!form.isOnline}
                    >
                      <option value="" className="bg-black text-white">Select State *</option>
                      {states.map((s) => (
                        <option key={s} value={s} className="bg-black text-white">{s}</option>
                      ))}
                    </select>
                    <Input 
                      placeholder="Google Maps Link (optional)" 
                      value={form.mapLink} 
                      onChange={(e) => setForm({ ...form, mapLink: e.target.value })} 
                      className="bg-background/20 border-white/5 h-10"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Total Seats */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Seats
                </label>
                <Input 
                  type="number" 
                  value={form.totalSeats} 
                  onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })} 
                  className="bg-background/20 border-white/5 h-10"
                  min="1"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit"
                  disabled={submitting} 
                  className="w-full bg-accent hover:bg-accent/90 text-black font-bold btn-shimmer h-11 sm:h-12 text-base"
                >
                  {submitting ? 'Creating…' : 'Publish Event'}
                </Button>
              </div>
            </motion.div>

            {/* AI Output Preview */}
            {aiOutput && (
              <motion.div 
                variants={item} 
                className="lg:col-span-3 mt-4 p-4 bg-white/5 border border-primary/20 rounded-xl"
              >
                <h3 className="text-primary font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Generated Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="text-white font-medium">Venue Type:</span> {aiOutput.venueType}
                  </div>
                  <div>
                    <span className="text-white font-medium">Duration:</span> {aiOutput.suggestedDuration} hours
                  </div>
                </div>
                {aiOutput.highlights?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-white font-medium mb-1 text-sm">Highlights:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiOutput.highlights.map((h, i) => (
                        <span 
                          key={i} 
                          className="px-2 py-1 bg-primary/10 rounded-md border border-primary/20 text-xs"
                        >
                          #{h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.form>
        </SignedIn>
      </div>
    </div>
  );
}