import { useEffect, useState } from 'react';
import { getMice } from '../services/api.js';
import MouseCard from '../components/MouseCard.jsx';
import Skeleton from '../components/Skeleton.jsx';

export default function Home() {
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getMice({ limit: 6, sort: 'rating' });
      setData(res);
      setLoading(false);
    })();
  }, []);

  return (
    <section>
      <div className="hero">
        <h1>GGClicks</h1>
        <p>Discover and compare the best gaming mice.</p>
      </div>
      <h2>Featured</h2>
      <div className="grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
          : data.items.map((m) => <MouseCard key={m.slug} mouse={m} />)}
      </div>
    </section>
  );
}


