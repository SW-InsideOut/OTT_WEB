import React from 'react';
import { useNavigate } from 'react-router-dom';

const dummyMovies = [
  { id: 1, title: "기생충", image: "https://via.placeholder.com/200x300?text=기생충" },
  { id: 2, title: "인셉션", image: "https://via.placeholder.com/200x300?text=인셉션" },
];

export default function ContentList() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px' }}>
      <h1>🎬 콘텐츠 목록</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px'
      }}>
        {dummyMovies.map((content) => (
          <div
            key={content.id}
            onClick={() => navigate(`/content/${content.id}`)}
            style={{
              textAlign: 'center',
              border: '1px solid #ddd',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            <img src={content.image} alt={content.title} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
            <p style={{ padding: '8px', fontWeight: 'bold' }}>{content.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
