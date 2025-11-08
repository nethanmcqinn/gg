import { Link } from 'react-router-dom';

export default function MouseCard({ mouse }) {
  return (
    <div className="card">
      <Link to={`/product/${mouse.slug}`} className="card-media">
        <img src={mouse.images?.[0]} alt={mouse.name} loading="lazy" />
      </Link>
      <div className="card-body">
        <h3 className="card-title">{mouse.name}</h3>
        <p className="muted">{mouse.brand}</p>
        <div className="card-meta">
          <span>${mouse.price?.toFixed(2)}</span>
          <span>⭐ {mouse.rating?.toFixed?.(1) ?? mouse.rating}</span>
        </div>
      </div>
    </div>
  );
}


