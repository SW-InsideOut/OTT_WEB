import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/content/${id}`)
      .then(res => setContent(res.data))
      .catch(() => alert('콘텐츠를 불러올 수 없습니다.'));

    axios.get(`http://localhost:5000/emotions/${id}`)
      .then(res => setHistory(res.data))
      .catch(() => setHistory([]));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`http://localhost:5000/content/${id}`);
      alert('삭제되었습니다.');
      navigate('/');
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  const handleStartAnalysis = async () => {
    try {
      await axios.post(`http://localhost:5000/start_analysis/${id}`);
      navigate(`/capture/${id}`);
    } catch (err) {
      alert('분석 시작에 실패했습니다.');
    }
  };

  if (!content) return <p style={{ padding: '24px' }}>불러오는 중...</p>;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>{content.name}</h2>

      {/* 콘텐츠 정보: 이미지 + 정보 나란히 */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '32px' }}>
        <img
          src={`http://localhost:5000/${content.poster_url}`}
          alt={content.name}
          style={{ maxWidth: '300px', height: 'auto', border: '1px solid #ccc' }}
        />
        <div>
          <p><strong>공개 연도:</strong> {content.year}</p>
          <p><strong>배급사:</strong> {content.distributor}</p>
          <p><strong>장르:</strong> {content.genres}</p>
          <button
            onClick={handleDelete}
            style={{
              marginTop: '16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            콘텐츠 삭제
          </button>
        </div>
      </div>

      {/* 감정 분석 기록 */}
      <div style={{ marginBottom: '24px' }}>
        <h4>📊 감정 분석 기록</h4>
        {history.length > 0 ? (
          <ul>
            {history.map((item, index) => (
              <li key={index}>
                {item.timestamp} - {item.emotion}
              </li>
            ))}
          </ul>
        ) : (
          <p>아직 분석 기록이 없습니다.</p>
        )}
      </div>

      {/* 분석 시작 버튼 */}
      <div>
        <button
          onClick={handleStartAnalysis}
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
