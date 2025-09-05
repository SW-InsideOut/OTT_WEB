import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./App.css";

export default function SurveyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gender || !ageGroup) {
      alert("성별과 연령대를 모두 선택해주세요.");
      return;
    }

    try {
      // 설문 저장
      await axios.post(`http://localhost:5000/survey`, {
        content_id: id,
        gender,
        age_group: ageGroup
      });

      // 분석 시작 시간 기록 + 시청자 수 증가
      await axios.post(`http://localhost:5000/start_analysis/${id}`);

      // 분석 페이지로 이동
      navigate(`/capture/${id}`);
    } catch (err) {
      console.error(err);
      alert("설문 저장 또는 감정 분석 시작에 실패했습니다.");
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "60px auto", padding: 24, border: "1px solid #ccc", borderRadius: "8px", background: "#2b2b2b", color: "#e0e0e0" }}>
      <h2 style={{ textAlign: "center" }}>감정 분석 전 설문조사</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8 }}>성별</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="">선택해주세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8 }}>연령대</label>
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="">선택해주세요</option>
            <option value="10s">10대</option>
            <option value="20s">20대</option>
            <option value="30s">30대</option>
            <option value="40s">40대</option>
            <option value="50s+">50대 이상</option>
          </select>
        </div>
        <button type="submit" style={{
          width: "100%",
          padding: "10px",
          border: "none",
          backgroundColor: "#e0e0e0",
          color: "#2b2b2b",
          fontWeight: "bold",
          borderRadius: "4px",
          cursor: "pointer"
        }}>
          제출
        </button>
      </form>
    </div>
  );
}
