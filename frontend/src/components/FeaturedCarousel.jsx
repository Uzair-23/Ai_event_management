import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel';
import { FilterContext } from '../context/FilterContext';

export default function FeaturedCarousel() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const { stateSelection } = useContext(FilterContext);

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = { page: 1, limit: 20 };
        if (stateSelection && stateSelection !== 'All') params.state = stateSelection;
        const { data } = await API.get('/events/search', { params });
        setItems(data.events || []);
      } catch (err) {
        console.error('carousel events', err);
      }
    };
    fetch();
  }, [stateSelection]);

  if (!items.length) return null;

  return (
    <div className="mt-6 mb-8 md:mt-8">
      <Carousel className="w-full rounded-xl overflow-hidden">
        <CarouselContent>
          {items.map((e) => (
            <CarouselItem key={e._id} className="w-full h-[35vh] md:h-[44vh] cursor-pointer" onClick={() => navigate(`/events/${e._id}`)}>
              <div role="button" tabIndex={0} className="relative w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${e.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(e.title || e.category)}`})` }}>
                {/* bottom-heavy gradient overlay (black/80 -> black/40 -> transparent) */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* top-left category pill */}
                <div className="absolute top-5 left-6 z-20">
                  <span className="inline-block bg-black/60 text-xs text-white px-3 py-1 rounded-full">{e.category}</span>
                </div>

                {/* bottom-left overlay content */}
                <div className="absolute bottom-6 left-6 z-20 text-white max-w-3xl pr-6">
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">{e.title}</h2>
                  <p className="mt-2 text-base md:text-lg text-gray-200 max-w-2xl line-clamp-2">{e.description || ''}</p>

                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
                      <span>{new Date(e.date).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21c4.418 0 8-3.582 8-8 0-3.866-4-7-8-7s-8 3.134-8 7c0 4.418 3.582 8 8 8z"/></svg>
                      <span>{e.location?.city || 'Online'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m0-5a4 4 0 1 1 8 0"/></svg>
                      <span>{(e.seatsBooked || 0)} registered</span>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* arrow controls - visible and styled for contrast */}
        <CarouselPrevious className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 text-white hover:bg-black/60" />
        <CarouselNext className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 text-white hover:bg-black/60" />
      </Carousel>
    </div>
  );
}
