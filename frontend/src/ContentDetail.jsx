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
  const [showDetails, setShowDetails] = useState(false);
  const [mostGender, setMostGender] = useState('');
  const [mostAgeGroup, setMostAgeGroup] = useState('');
  const [showSurveyStats, setShowSurveyStats] = useState(false);
  const [surveyStats, setSurveyStats] = useState(null);

/* 유저 설문 결과 한글-영어 매핑*/
  const genderMap = {
    male: '남성',
    female: '여성',
    other: '기타',
  };

  const ageGroupMap = {
    '10s': '10대',
    '20s': '20대',
    '30s': '30대',
    '40s': '40대',
    '50s': '50대 이상',
  };

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

    // 설문 요약 정보 가져오기
    axios.get(`http://localhost:5000/users/stats/${id}`)
      .then(res => {
        setMostGender(res.data.most_gender || '정보 없음');
        setMostAgeGroup(res.data.most_age_group || '정보 없음');
      })
      .catch(err => {
        console.error('설문 통계 불러오기 오류:', err);
        setMostGender('정보 없음');
        setMostAgeGroup('정보 없음');
      });

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

  const handleStartSurvey = () => {
    navigate(`/survey/${id}`);
  };

  const handleOpenViewerList = () => {
    navigate(`/viewers/${id}`);
  };

  const handleSurveyStatsClick = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/survey/stats/${id}`);
        setSurveyStats(res.data);
        setShowSurveyStats(!showSurveyStats);
    } catch (err) {
      console.error(err);
        alert('설문 통계를 불러오지 못했습니다.');
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '900px', width: '100%' }}>

        {/* 상단: 제목, 삭제, 목록 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <button onClick={() => navigate('/')} style={btnStyle}>목록으로</button>
          <h2 style={{ margin: 0 }}>{content.name}</h2>
          <button onClick={handleDelete} style={btnStyle}>콘텐츠 삭제</button>
        </div>

        {/* 콘텐츠 정보 + 감정 분석 정보 */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
          {/* 왼쪽: 정보 */}
          <div style={{ flex: 2 }}>
            <img src={`http://localhost:5000/${content.poster_url}`} alt={content.name} style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />
            <p><strong>공개 연도:</strong> {content.release_year}</p>
            <p><strong>배급사:</strong> {content.distributor}</p>
            <p><strong>장르:</strong> {content.genre}</p>

            <div style={{ border: '1px solid #ccc', borderRadius: '12px', padding: '16px', marginTop: '24px' }}>
              <h4 style={{ marginTop: 0 }}>최다 누적 감정 분석</h4>
              {topEmotion && topEmotion.emotion ? (
                <>
                  <p><strong>감정:</strong> {topEmotion.emotion}</p>
                  <p><strong>비율:</strong> {topEmotion.percentage}% &nbsp;&nbsp;
                    <strong>시청자 수:</strong> {content.viewer_count}명
                  </p>

                  {/* 상세 정보 토글 버튼 */}
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={() => setShowDetails(!showDetails)} style={btnStyle}>
                      {showDetails ? '간략히 보기' : '상세 정보 더보기'}
                    </button>
                  </div>

                  {/* 설문 상세 정보 */}
                  {showDetails && (
                    <div style={{ marginTop: '12px', paddingLeft: '4px' }}>
                      <p><strong>가장 많은 성별:</strong> {genderMap[mostGender] || '정보 없음'}</p>
                      <p><strong>가장 많은 연령대:</strong> {ageGroupMap[mostAgeGroup] || '정보 없음'}</p>
                    </div>
                  )}

                  <h5 style={{ margin: '16px 0 8px' }}>감정 타임라인</h5>
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

          {/* 오른쪽: 감정 분석 기록 */}
          <div style={{
            flex: 1,
            border: '1px solid #ccc',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h4 style={{ marginTop: 0 }}>감정 분석 기록</h4>
            {history.length > 0 ? (
              <div style={{ maxHeight: '650px', overflowY: 'auto', paddingLeft: '16px' }}>
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

        {/* 감정 분석 버튼 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '40px'
        }}>
          <button onClick={handleStartSurvey} style={btnStyle}>
            감정 분석
          </button>
          <button onClick={handleOpenViewerList} style={btnStyle}>
            시청자 목록
          </button>
        </div>

      </div>
    </div>
  );
}

// 버튼 스타일
const btnStyle = {
  backgroundColor: '#fff',
  color: '#333',
  padding: '10px 20px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  cursor: 'pointer'
};
