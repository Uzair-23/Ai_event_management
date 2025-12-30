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

  const nearYou = events.slice(0, 4);
  const recommended = events.slice(4, 12);

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
