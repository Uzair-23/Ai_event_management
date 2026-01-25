import { useEffect, useState, useContext } from "react";
import { Link } from 'react-router-dom';
import API from "../services/api";
import EventCard from "../components/EventCard";
import FeaturedCarousel from "../components/FeaturedCarousel";
import SectionReveal from "../components/SectionReveal";
import { FilterContext } from "../context/FilterContext";
import { ChevronRight } from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState([]);
  const { stateSelection } = useContext(FilterContext);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params = { page: 1, limit: 24 };
        if (stateSelection && stateSelection !== "All") {
          params.state = stateSelection;
        }
        const { data } = await API.get("/events/search", { params });
        setEvents(data.events || []);
      } catch (err) {
        console.error("home events", err);
      }
    };

    fetchEvents();
  }, [stateSelection]);

  const [popular, setPopular] = useState([]);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data } = await API.get('/events/popular');
        setPopular(data.events || []);
      } catch (err) {
        console.error('home popular events', err);
      }
    };
    fetchPopular();
  }, []);

  const nearYou = events.slice(0, 4);
  const recommended = popular;

  // Categories with colors
  const categories = [
    { key: 'Tech', emoji: '💻', color: 'from-blue-500/20 to-cyan-500/20' },
    { key: 'Music', emoji: '🎵', color: 'from-purple-500/20 to-pink-500/20' },
    { key: 'Workshops', emoji: '🛠️', color: 'from-amber-500/20 to-orange-500/20' },
    { key: 'Health', emoji: '🧘', color: 'from-green-500/20 to-emerald-500/20' },
    { key: 'Sports', emoji: '🏅', color: 'from-red-500/20 to-rose-500/20' },
    { key: 'Business', emoji: '💼', color: 'from-gray-500/20 to-slate-500/20' },
  ];

  return (
    <main className="pt-20 sm:pt-24 md:pt-28">
      {/* Hero Carousel */}
      <FeaturedCarousel />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Events Near You */}
        <SectionReveal className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Events Near You</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                Happening in {stateSelection === "All" ? "your area" : stateSelection}
              </p>
            </div>
            <Link 
              to="/explore" 
              className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all self-start sm:self-auto"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {nearYou.map((e) => (
              <EventCard key={e._id} event={e} />
            ))}
          </div>
        </SectionReveal>

        {/* Browse by Category */}
        <SectionReveal className="mb-8 sm:mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Browse by Category</h2>
            <Link 
              to="/explore" 
              className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Horizontal scroll on mobile, grid on larger screens */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-6 sm:overflow-visible scrollbar-hide">
            {categories.map((c) => (
              <Link
                key={c.key}
                to={`/explore?category=${encodeURIComponent(c.key)}`}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-br ${c.color} hover:scale-105 rounded-lg sm:rounded-xl shadow-sm min-w-[120px] sm:min-w-0 flex-shrink-0 sm:flex-shrink transition-transform border border-white/5`}
              >
                <span className="text-xl sm:text-2xl">{c.emoji}</span>
                <span className="font-medium text-sm sm:text-base whitespace-nowrap">{c.key}</span>
              </Link>
            ))}
          </div>
        </SectionReveal>

        {/* Recommended */}
        <SectionReveal>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Recommended for You</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recommended.map((e) => (
              <EventCard key={e._id} event={e} />
            ))}
          </div>
        </SectionReveal>
      </div>
    </main>
  );
}