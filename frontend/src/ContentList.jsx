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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1>🎬 콘텐츠 목록</h1>
        <button
          onClick={() => navigate('/add')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          + 콘텐츠 등록
        </button>
      </div>

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
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            <img
              src={content.image}
              alt={content.title}
              style={{
                width: '100%',
                height: '250px',
                objectFit: 'cover',
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px',
              }}
            />
            <p style={{ padding: '8px', fontWeight: 'bold' }}>{content.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
