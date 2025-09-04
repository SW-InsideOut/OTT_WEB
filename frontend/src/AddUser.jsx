import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddUser() {
  const navigate = useNavigate();
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");

  const handleStartAnalysis = async () => {
    try {
      await axios.post(`http://localhost:5000/start_analysis/${id}`);
      navigate(`/capture/${id}`);
    } catch {
      alert('분석 시작에 실패했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 24, textAlign: "center" }}>
      <h2>사용자 정보 등록</h2>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>성별</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">선택하세요</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
          <option value="other">기타</option>
        </select>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>연령대</label>
        <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
          <option value="">선택하세요</option>
          <option value="10s">10대</option>
          <option value="20s">20대</option>
          <option value="30s">30대</option>
          <option value="40s">40대</option>
          <option value="50s">50대 이상</option>
        </select>
      </div>

      <button
        onClick={handleStartAnalysis}
        style={{
          backgroundColor: "#2b2b2b",
          color: "#e0e0e0",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: 16
        }}
      >
        감정 분석 시작
      </button>
    </div>
  );
}
