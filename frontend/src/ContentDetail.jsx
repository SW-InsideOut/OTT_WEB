// src/ContentDetail.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 더미 콘텐츠 데이터 (실제 앱에서는 props/context/API로 받아와야 함)
  const dummyContent = {
    id,
    title: "기생충",
    image: "https://via.placeholder.com/300x400?text=기생충",
    year: "2019",
    distributor: "CJ ENM",
    genre: "드라마",
    history: [
      { time: "13:01:05", emotion: "happy" },
      { time: "13:03:22", emotion: "sad" },
      { time: "13:06:41", emotion: "angry" },
    ],
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>{dummyContent.title}</h2>

      {/* 콘텐츠 정보: 이미지 + 정보 나란히 */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '32px' }}>
        <img
          src={dummyContent.image}
          alt={dummyContent.title}
          style={{ width: '240px', borderRadius: '8px' }}
        />

        <div>
          <p><strong>공개 연도:</strong> {dummyContent.year}</p>
          <p><strong>배급사:</strong> {dummyContent.distributor}</p>
          <p><strong>장르:</strong> {dummyContent.genre}</p>
        </div>
      </div>

      {/* 감정 분석 기록 */}
      <div style={{ marginBottom: '24px' }}>
        <h4>📊 감정 분석 기록</h4>
        {dummyContent.history.length > 0 ? (
          <ul>
            {dummyContent.history.map((item, index) => (
              <li key={index}>
                {item.time} - {item.emotion}
              </li>
            ))}
          </ul>
        ) : (
          <p>아직 분석 기록이 없습니다.</p>
        )}
      </div>

      {/* 분석 버튼 */}
      <div>
        <button
          onClick={() => navigate(`/capture/${id}`)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          감정 분석
        </button>
      </div>
    </div>
  );
}
