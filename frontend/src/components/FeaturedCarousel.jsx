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
    <div className="mb-8">
      <Carousel className="w-full rounded-lg overflow-hidden">
        <CarouselContent>
          {items.map((e) => (
            <CarouselItem key={e._id} className="w-full h-[30vh] md:h-[38vh] cursor-pointer" onClick={() => navigate(`/events/${e._id}`)}>
              <div className="relative w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${e.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(e.title || e.category)}`})` }}>
                {/* gradient overlay for hero (bottom-heavy for readability) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

                {/* top-left category badge */}
                <div className="absolute top-5 left-6 z-20">
                  <span className="inline-block bg-black/60 text-xs text-white px-3 py-1 rounded">{e.category}</span>
                </div>

                {/* top-right paid/free */}
                <div className="absolute top-5 right-6 z-20">
                  <span className="inline-block bg-black/60 text-xs text-white px-3 py-1 rounded">{e.price && e.price > 0 ? 'Paid' : 'Free'}</span>
                </div>

                {/* bottom-left hero text */}
                <div className="absolute bottom-6 left-8 z-20 text-white max-w-3xl">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight">{e.title}</h2>
                  <p className="mt-2 text-sm md:text-base text-muted max-w-2xl line-clamp-1">{e.description || ''}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                    <div>{new Date(e.date).toLocaleDateString()}</div>
                    <div>•</div>
                    <div>{e.location?.city || 'Online'}</div>
                    <div>•</div>
                    <div>{(e.seatsBooked || 0)} registered</div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 z-30" />
        <CarouselNext className="right-4 top-1/2 -translate-y-1/2 z-30" />
      </Carousel>
    </div>
  );
}
