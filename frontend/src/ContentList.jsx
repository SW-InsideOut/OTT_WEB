// src/ContentList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const dummyMovies = [
  { id: 1, title: "기생충", image: "https://via.placeholder.com/200x300?text=기생충" },
  { id: 2, title: "인셉션", image: "https://via.placeholder.com/200x300?text=인셉션" },
  { id: 3, title: "어벤져스", image: "https://via.placeholder.com/200x300?text=어벤져스" },
];

export default function ContentList() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1>🎬 콘텐츠 목록</h1>
        <button onClick={() => navigate('/add')}>콘텐츠 등록</button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px'
      }}>
        {dummyMovies.map((movie) => (
          <div key={movie.id} style={{ textAlign: 'center', border: '1px solid #ddd', borderRadius: '10px' }}>
            <img src={movie.image} alt={movie.title} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
            <p style={{ padding: '8px', fontWeight: 'bold' }}>{movie.title}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        <button onClick={() => navigate('/capture')}>감정 분석 시작</button>
      </div>
    </div>
  );
}
