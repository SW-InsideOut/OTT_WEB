import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ContentList() {
  const [contents, setContents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/contents')
      .then(res => setContents(res.data))
      .catch(() => alert('콘텐츠를 불러올 수 없습니다.'));
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h1>🎬 콘텐츠 목록</h1>
      <button onClick={() => navigate('/add')} style={{ marginBottom: '16px' }}>
        콘텐츠 등록
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px'
      }}>
        {contents.map((content) => (
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
            <img
              src={`http://localhost:5000/static/images/${content.poster_url}`}
              alt={content.name}
              style={{ width: '100%', height: '250px', objectFit: 'cover' }}
            />
            <p style={{ padding: '8px', fontWeight: 'bold' }}>{content.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
