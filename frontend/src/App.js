import React, { useEffect, useRef } from 'react';

export default function App() {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    const interval = setInterval(captureAndSend, 3000);
    return () => clearInterval(interval);
  }, []);

  const captureAndSend = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');

    // 좌우반전하여 캡처
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL('image/jpeg');

    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      const data = await res.json();
      console.log('서버 응답:', data);
    } catch (err) {
      console.error('백엔드 전송 실패:', err);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>감정 인식 (좌우반전)</h1>
      <video
        ref={videoRef}
        autoPlay
        width="224"
        height="224"
        style={{
          border: '1px solid #ccc',
          transform: 'scaleX(-1)', // 화면 출력도 좌우반전
        }}
      />
    </div>
  );
}
