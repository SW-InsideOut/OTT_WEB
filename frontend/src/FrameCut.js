import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function FrameCut() {
  const { id } = useParams(); // URL에서 콘텐츠 ID 추출
  const contentId = parseInt(id, 10); // 숫자로 변환
  const videoRef = useRef(null);
  const intervalRef = useRef(null); // 캡처 간격 ID 보관
  const navigate = useNavigate();
  const [records, setRecords] = useState([]); // 실시간 감정 기록

  const captureAndSend = async () => {
    if (!videoRef.current || isNaN(contentId)) return;

    // 캔버스 생성 및 프레임 캡처
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0); // 좌우 반전
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg");

    // 서버로 전송
    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, content_id: contentId }),
      });

      const data = await res.json();
      const emotion = data.emotion;
      const time = new Date().toLocaleTimeString();
      // 최근 15개만 유지
      setRecords((prev) => [{ emotion, time }, ...prev].slice(0, 15));
      console.log("감정:", emotion);
    } catch (err) {
      console.error("전송 실패:", err);
    }
  };

  useEffect(() => {
    // 웹캠 시작
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    // 3초마다 프레임 캡처 및 전송
    intervalRef.current = setInterval(captureAndSend, 3000);
    return () => clearInterval(intervalRef.current);
  }, [contentId]);

  const handleStop = () => {
    clearInterval(intervalRef.current);
    navigate(`/content/${contentId}`);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "24px",
        gap: "32px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2>감정 분석 중…</h2>
        <video
          ref={videoRef}
          autoPlay
          width="630"
          height="470"
          style={{
            transform: "scaleX(-1)",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
        <div style={{ marginTop: "16px" }}>
          <button
            onClick={handleStop}
            style={{
              padding: "10px 20px",
              backgroundColor: "#fff",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            분석 종료
          </button>
        </div>
      </div>

      {/* 실시간 감정 기록 */}
      <div style={{ width: "300px" }}>
        <h3>🕒 실시간 기록</h3>
        <ul
          style={{
            listStyle: "none",
            textAlign: "left",
            maxHeight: "800px",
            overflowY: "auto",
            borderRadius: "4px",
            padding: "8px",
          }}
        >
          {records.map((rec, idx) => (
            <li key={idx} style={{ marginBottom: "8px" }}>
              <strong>{rec.time}</strong>: {rec.emotion}
            </li>
          ))}
          {records.length === 0 && <li>아직 분석 중입니다.</li>}
        </ul>
      </div>
    </div>
  );
}
