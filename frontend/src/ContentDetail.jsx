import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css'; 

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [history, setHistory] = useState([]);
  const [topEmotion, setTopEmotion] = useState(null);
  const [emotions, setEmotions] = useState([]);
  const [maxTime, setMaxTime] = useState(0);

  useEffect(() => {
    axios.get(`http://localhost:5000/content/${id}`)
      .then(res => setContent(res.data))
      .catch(() => alert('콘텐츠를 불러올 수 없습니다.'));

    axios.get(`http://localhost:5000/emotions/${id}`)
      .then(res => {
        const data = res.data.map(item => ({
          emotion: item.emotion,
          seconds: timeStringToSeconds(item.timestamp),
          timestamp: item.timestamp
        }));
        setEmotions(data);
        setMaxTime(Math.max(...data.map(e => e.seconds), 1)); // 0 방지
        setHistory(res.data);
      })
      .catch(() => setHistory([]));

    axios.get(`http://localhost:5000/top_emotion/${id}`)
      .then(res => setTopEmotion(res.data))
      .catch(() => setTopEmotion(null));
  }, [id]);

  const timeStringToSeconds = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    return parts.reduce((acc, val, idx) => acc + val * Math.pow(60, parts.length - idx - 1), 0);
  };

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

  const emotionColors = {
    happy: '#FFD700',
    sad: '#1E90FF',
    angry: '#FF6347',
    neutral: '#B0C4DE',
    surprize: '#32CD32'
  };

  const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😡',
    neutral: '😐',
    surprize: '😲'
  };

  if (!content) return <p style={{ padding: '24px' }}>불러오는 중...</p>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>{content.name}</h2>
      <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
        <div style={{ flex: 2 }}>
          <img src={`http://localhost:5000/${content.poster_url}`} alt={content.name} style={{ maxWidth: '300px' }} />
          <p><strong>공개 연도:</strong> {content.year}</p>
          <p><strong>배급사:</strong> {content.distributor}</p>
          <p><strong>장르:</strong> {content.genres}</p>
          <button onClick={handleDelete} style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px', border: 'none', borderRadius: '4px' }}>콘텐츠 삭제</button>
        </div>

        <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '12px', padding: '16px' }}>
          <h4>🔥 최다 누적 감정 분석</h4>
          {topEmotion && topEmotion.emotion ? (
            <>
              <p><strong>감정:</strong> {topEmotion.emotion}</p>
              <p><strong>비율:</strong> {topEmotion.percentage}%</p>
              <h5>🕓 감정 타임라인</h5>
              <div style={{ position: 'relative', height: '25px', backgroundColor: '#e0e0e0', borderRadius: '20px', marginTop: '12px' }}>
                {emotions.map((e, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${(e.seconds / maxTime) * 100}%`,
                      transform: 'translateX(-50%)',
                      top: '-8px',
                      fontSize: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="tooltip-container">
                      <span>{emotionEmojis[e.emotion] || ''}</span>
                      <span className="tooltip-text">{e.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>아직 Top 감정 기록이 없습니다.</p>
          )}
        </div>
      </div>

      <h4>📊 감정 분석 기록</h4>
      {history.length > 0 ? (
        <ul>
          {history.map((item, index) => (
            <li key={index}>{item.timestamp} - {item.emotion}</li>
          ))}
        </ul>
      ) : <p>아직 분석 기록이 없습니다.</p>}

      <button onClick={handleStartAnalysis} style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', marginTop: '24px' }}>감정 분석</button>
    </div>
  );
}
