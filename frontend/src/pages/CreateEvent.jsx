import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import API from "../services/api";
import { useUser, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { State, City } from 'country-state-city';

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
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState(['All']);

  const [aiOutput, setAiOutput] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          Create Event (AI Assisted)
        </h2>

        <SignedOut>
          <p className="text-muted-foreground">
            Please sign in to create an event.
          </p>
        </SignedOut>

        <SignedIn>
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              placeholder="Event title"
              className="w-full p-3 bg-input rounded text-white"
            />

            <textarea
              value={form.idea}
              onChange={(e) =>
                setForm({ ...form, idea: e.target.value })
              }
              placeholder="Short idea (used by AI)"
              className="w-full p-3 bg-input rounded text-white"
            />

            <input
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              placeholder="Category"
              className="w-full p-3 bg-input rounded text-white"
            />

            {/* Online/Offline toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-brand-500" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} />
                <span className="text-sm">Online event</span>
              </label>
            </div>

            {!form.isOnline && (
              <>
                <input
                  value={form.venue}
                  onChange={(e) =>
                    setForm({ ...form, venue: e.target.value })
                  }
                  placeholder="Venue"
                  className="w-full p-3 bg-input rounded text-white"
                />

                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="City (e.g. Bengaluru)"
                  className="w-full p-3 bg-input rounded text-white"
                />

                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full p-3 bg-input rounded text-white"
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <input
                  value={form.mapLink}
                  onChange={(e) => setForm({ ...form, mapLink: e.target.value })}
                  placeholder="Google Maps Link"
                  className="w-full p-3 bg-input rounded text-white"
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Popover>
                  <PopoverTrigger className="w-full p-2 bg-input rounded text-left text-white">{selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select date'}</PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate ? new Date(selectedDate) : undefined}
                      onSelect={(d) => {
                        const iso = d ? new Date(d).toISOString() : '';
                        setSelectedDate(iso);
                        setForm({ ...form, date: iso });
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm({ ...form, time: e.target.value })
                }
                className="p-2 bg-input rounded text-white"
              />
            </div>

            <input
              type="number"
              value={form.totalSeats}
              onChange={(e) =>
                setForm({
                  ...form,
                  totalSeats: Number(e.target.value),
                })
              }
              placeholder="Total seats"
              className="w-full p-3 bg-input rounded text-white"
            />

            <div className="flex gap-2">
              <button
                onClick={handleAI}
                disabled={loadingAI}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
              >
                {loadingAI ? "Generating…" : "Generate with AI"}
              </button>

              <button
                onClick={publish}
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                {submitting ? "Creating…" : "Publish Event"}
              </button>
            </div>

            {aiOutput && (
              <div className="mt-4 p-4 bg-card rounded">
                <h3 className="font-semibold mb-2">AI Output</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(aiOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
