import { useEffect, useState, useContext } from "react";
import { Link } from 'react-router-dom';
import API from "../services/api";
import EventCard from "../components/EventCard";
import FeaturedCarousel from "../components/FeaturedCarousel";
import SectionReveal from "../components/SectionReveal";
import { FilterContext } from "../context/FilterContext";

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

  return (
    <>
      {/* Hero Carousel */}
      <FeaturedCarousel />

      <div className="max-w-7xl mx-auto px-6 py-8 ">
        {/* Events Near You */}
      <SectionReveal className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold">Events Near You</h2>
            <p className="text-sm text-muted-foreground">Happening in{" "}{stateSelection === "All" ? "your area" : stateSelection}</p>
          </div>
          <Link to="/explore" className="text-sm text-primary">View All →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {nearYou.map((e) => (
            <EventCard key={e._id} event={e} />
          ))}
        </div>
      </SectionReveal>

      {/* Browse by Category */}
      <SectionReveal className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <Link to="/explore" className="text-sm text-primary">View All →</Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1">
          {[
            { key: 'Tech', emoji: '💻' },
            { key: 'Music', emoji: '🎵' },
            { key: 'Workshops', emoji: '🛠️' },
            { key: 'Health', emoji: '🧘' },
            { key: 'Sports', emoji: '🏅' },
            { key: 'Business', emoji: '💼' },
          ].map((c) => (
            <Link
              key={c.key}
              to={`/explore?category=${encodeURIComponent(c.key)}`}
              className="inline-flex items-center gap-3 px-4 py-3 bg-surface/60 hover:bg-surface/80 rounded-lg shadow-sm min-w-[140px] flex-shrink-0"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="font-medium">{c.key}</span>
            </Link>
          ))}
        </div>
      </SectionReveal>

        {/* Recommended */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recommended.map((e) => (
              <EventCard key={e._id} event={e} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
