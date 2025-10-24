import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

import {
  FaSmileBeam,   // 😊 밝은 미소 (채워진)
  FaSadTear,     // 😢 눈물 슬픔 (채워진)
  FaAngry,       // 😡 화남
  FaMeh,         // 😐 중립
  FaSurprise,    // 😲 놀람
} from "react-icons/fa";

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
    happy: <FaSmileBeam size={28} color="#FFD43B" />,    // 노란색, 행복
    sad: <FaSadTear size={28} color="#4A90E2" />,        // 파란색, 슬픔
    angry: <FaAngry size={28} color="#E03131" />,        // 빨강, 화남
    neutral: <FaMeh size={28} color="#999" />,           // 회색, 중립
    surprise: <FaSurprise size={28} color="#FF9F1C" />,  // 주황, 놀람
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
          <button onClick={() => navigate('/')} className="action-button">목록으로</button>
          <h2 style={{ margin: 0 }}>{content.name}</h2>
          <button onClick={handleDelete} className="action-button">콘텐츠 삭제</button>
        </div>

        {/* 콘텐츠 정보 + 감정 분석 정보 */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
          {/* 왼쪽: 정보 */}
          <div style={{ flex: 2 }}>

          {/* 콘텐츠 이미지 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',   // 세로 배치
              alignItems: 'center',      // 가로 중앙 정렬
              marginBottom: '16px',
            }}
          >
            <img
              src={`http://localhost:5000/${content.poster_url}`}
              alt={content.name}
              style={{
                width: '100%',
                maxWidth: '300px',
                borderRadius: '8px',
                marginBottom: '12px',    // 이미지와 텍스트 간격
              }}
            />

            {/* 텍스트 가운데 정렬 */}
            <div
              style={{
                width: '100%',
                maxWidth: '300px',
                textAlign: 'center',     // 텍스트 가운데 정렬
              }}
            >
              <p><strong>공개 연도:</strong> {content.release_year}</p>
              <p><strong>플랫폼:</strong> {content.distributor}</p>
              <p><strong>장르:</strong> {content.genre}</p>
            </div>
          </div>

            <div style={{ border: '1px solid #ccc', borderRadius: '12px', padding: '16px', marginTop: '24px' }}>
              <h4 style={{ marginTop: 0 }}>감정 분석 결과</h4>
              {topEmotion && topEmotion.emotion ? (
                <>
                  <p><strong>최다 누적 감정:</strong> {topEmotion.emotion}</p>
                  <p><strong>비율:</strong> {topEmotion.percentage}% &nbsp;&nbsp;</p>
                  <p><strong>시청자 수:</strong> {content.viewer_count}명</p>
                  <p><strong>가장 많은 성별:</strong> {genderMap[mostGender] || '정보 없음'}</p>
                  <p><strong>가장 많은 연령대:</strong> {ageGroupMap[mostAgeGroup] || '정보 없음'}</p>
                </>
              ) : (
                <p>아직 감정 분석 결과가 없습니다.</p>
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
              <div style={{ maxHeight: '770px', overflowY: 'auto', paddingLeft: '16px' }}>
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

        <div style={{ border: '1px solid #ccc', borderRadius: '12px', padding: '16px', marginTop: '24px' }}>
          <h4 style={{ margin: '16px 0 8px' }}>감정 타임라인</h4>
          <p> </p>
        
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
                            <span className="tooltip-text">{e.timestamp} {e.emotion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <br />          
        </div>
        {/* 감정 분석 버튼 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '40px'
          
        }}>
          <button 
            onClick={handleStartSurvey} 
            className="flex-button"
            style={{ flex: 1, maxWidth: '200px' }}
          >
            감정 분석
          </button>
          
        </div>

      </div>
    </div>
  );
}

