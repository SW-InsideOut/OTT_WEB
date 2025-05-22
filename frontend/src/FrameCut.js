import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function FrameCut() {
  const { id } = useParams(); // URL에서 콘텐츠 ID 추출
  const contentId = parseInt(id); // 숫자로 변환
  const videoRef = useRef(null);

  const captureAndSend = async () => {
    if (!videoRef.current || isNaN(contentId)) return;

    // 캔버스 생성 및 프레임 캡처
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0); // 좌우 반전
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg');

    // 서버로 전송
    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, content_id: contentId }) // 올바른 ID 전송
      });

      const data = await res.json();
      console.log('감정:', data.emotion);
    } catch (err) {
      console.error('전송 실패:', err);
    }
  };

  useEffect(() => {
    // 웹캠 시작
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    // 3초마다 프레임 캡처 및 전송
    const interval = setInterval(captureAndSend, 3000);
    return () => clearInterval(interval);
  }, [contentId]);

  return (
    <div>
      <h2>감정 분석</h2>
      <video
        ref={videoRef}
        autoPlay
        width="224"
        height="224"
        style={{ transform: 'scaleX(-1)' }} // 웹캠 좌우 반전
      />
    </div>
  );
}
