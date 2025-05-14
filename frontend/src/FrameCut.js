// src/FrameCut.js
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export default function FrameCut() {
  const { id } = useParams(); // 콘텐츠 ID 추출
  const videoRef = useRef(null);

  useEffect(() => {
    // 웹캠 스트리밍 시작
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    // 3초마다 캡처 및 분석 요청
    const interval = setInterval(captureAndSend, 3000);
    return () => clearInterval(interval);
  }, []);

  const captureAndSend = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');

    // 좌우 반전 캡처
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL('image/jpeg');

    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          contentId: id  // 콘텐츠 ID도 함께 전송 (서버가 필요로 할 경우)
        }),
      });

      const data = await res.json();
      console.log(`[${id}] 서버 응답:`, data);
    } catch (err) {
      console.error('❌ 백엔드 전송 실패:', err);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <h1>🎥 콘텐츠 {id} 감정 분석 중...</h1>
      <video
        ref={videoRef}
        autoPlay
        width="224"
        height="224"
        style={{
          border: '1px solid #ccc',
          transform: 'scaleX(-1)',
          marginTop: '16px',
        }}
      />
      <p style={{ marginTop: '12px', color: '#555' }}>
        3초마다 자동으로 감정을 분석하고 있습니다.
      </p>
    </div>
  );
}
