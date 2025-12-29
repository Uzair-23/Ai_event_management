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
    <div className="p-4">
      <Carousel className="rounded-lg">
        <CarouselContent>
          {items.map((e) => (
            <CarouselItem key={e._id} className="w-[280px] md:w-[420px] cursor-pointer" onClick={() => navigate(`/events/${e._id}`)}>
              <div className="relative h-44 rounded overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${e.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(e.title || e.category)}`})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                <div className="absolute bottom-3 left-3 z-20 text-white">
                  <div className="font-semibold text-lg">{e.title}</div>
                  <div className="text-sm text-muted">{new Date(e.date).toLocaleDateString()} • {e.location?.city || 'Online'}</div>
                  <div className="mt-1"><span className="inline-block bg-black/50 px-2 py-1 rounded text-xs">{e.category}</span></div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
