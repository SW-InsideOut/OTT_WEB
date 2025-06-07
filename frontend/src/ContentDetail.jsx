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
        setMaxTime(Math.max(...data.map(e => e.seconds), 1));
        setHistory(res.data);
      })
      .catch(() => setHistory([]));

    axios.get(`http://localhost:5000/top_emotion/${id}`)
      .then(res => setTopEmotion(res.data))
      .catch(() => setTopEmotion(null));
  }, [id]);

  const timeStringToSeconds = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    return parts.reduce((acc, val, idx) =>
      acc + val * Math.pow(60, parts.length - idx - 1), 0
    , 0);
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
    } catch {
      alert('분석 시작에 실패했습니다.');
    }
  };

  const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😡',
    neutral: '😐',
    surprize: '😲'
  };

  if (!content) return <p style={{ textAlign: 'center', padding: '24px' }}>불러오는 중…</p>;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '900px', width: '100%' }}>
        {/* 상단: 목록 버튼 + 제목 + 삭제 버튼 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          {/* 목록 버튼 */}
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#fff',
              color: '#333',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            목록
          </button>
          
          <h2 style={{ margin: 0 }}>{content.name}</h2>
          <button
            onClick={handleDelete}
            style={{
              backgroundColor: '#fff',
              color: '#333',
              padding: '8px 12px',
              border: '1px solid #ccc',    // ← 여기 수정
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            삭제
          </button>
        </div>

        {/* 상단: 이미지+정보(좌) / 기록(우) */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
          {/* 좌측 컬럼 */}
          <div style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <img
              src={`http://localhost:5000/${content.poster_url}`}
              alt={content.name}
              style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }}
            />
            <p><strong>공개 연도:</strong> {content.release_year}</p>
            <p><strong>배급사:</strong> {content.distributor}</p>
            <p><strong>장르:</strong> {content.genre}</p>

            {/* 최다 누적 감정 분석 */}
            <div style={{
              border: '1px solid #ccc',     // ← 여기에도 동일하게
              borderRadius: '12px',
              padding: '16px',
              marginTop: '24px'
            }}>
              <h4 style={{ marginTop: 0 }}>🔥 최다 누적 감정 분석</h4>
              {topEmotion && topEmotion.emotion ? (
                <>
                  <p><strong>감정:</strong> {topEmotion.emotion}</p>
                  <p><strong>비율:</strong> {topEmotion.percentage}%</p>

                  <h5 style={{ margin: '16px 0 8px' }}>🕓 감정 타임라인</h5>
                  <div style={{
                    position: 'relative',
                    height: '20px',
                    width: '100%',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '20px'
                  }}>
                    {emotions.map((e, idx) => (
                      <div key={idx} style={{
                        position: 'absolute',
                        left: `${(e.seconds / maxTime) * 100}%`,
                        transform: 'translateX(-50%)',
                        top: '-8px',
                        fontSize: '24px',
                        cursor: 'pointer'
                      }}>
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

          {/* 우측 컬럼: 감정 분석 기록 */}
          <div style={{
            flex: 1,
            border: '1px solid #ccc',     // ← 역시 동일
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h4 style={{ marginTop: 0 }}>📊 감정 분석 기록</h4>
            {history.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingLeft: '16px' }}>
                <ul style={{ margin: 0 }}>
                  {history.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      {item.timestamp} – {item.emotion}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ margin: 0 }}>아직 분석 기록이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 분석 시작 버튼 */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleStartAnalysis}
            style={{
              backgroundColor: '#fff',
              color: '#333',
              padding: '10px 20px',
              border: '1px solid #ccc',   // ← 여기에도
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            감정 분석
          </button>
        </div>
      </div>
    </div>
  );
}
