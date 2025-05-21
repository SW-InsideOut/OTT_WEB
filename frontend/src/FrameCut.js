import React, { useRef, useEffect } from 'react';

export default function FrameCut({ contentId }) {
  const videoRef = useRef(null);

  const captureAndSend = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg');

    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, content_id: contentId }) // ← 실제 전달받은 콘텐츠 ID
      });

      const data = await res.json();
      console.log('감정:', data.emotion);
    } catch (err) {
      console.error('전송 실패:', err);
    }
  };

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    const interval = setInterval(captureAndSend, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>감정 분석</h2>
      <video ref={videoRef} autoPlay width="224" height="224" style={{ transform: 'scaleX(-1)' }} />
    </div>
  );
}
