import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./App.css";

export default function SurveyForm() {
  const { id } = useParams();               // URL 파라미터(콘텐츠 ID)
  const navigate = useNavigate();
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gender || !ageGroup) {
      alert("성별과 연령대를 모두 선택해주세요.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/users", {
        content_id: id,
        gender,
        age_group: ageGroup,
      });

      // 서버 응답에서 user_id 추출
      const { user_id } = res.data;
      if (!user_id) {
        alert("user_id를 서버에서 받지 못했습니다.");
        return;
      }
      console.log("서버에서 받은 user_id:", user_id);

      // 분석 시작 (시청자 수 증가 + 시작 시각 기록)
      await axios.post(`http://localhost:5000/start_analysis/${id}`);

      // FrameCut 페이지로 이동 시 user_id를 state에 함께 전달
      navigate(`/capture/${id}`, { state: { userId: user_id } });
    } catch (err) {
      console.error("설문 저장 또는 감정 분석 시작 실패:", err);
      alert("설문 저장 또는 감정 분석 시작에 실패했습니다.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "60px auto",
        padding: 24,
        border: "1px solid #1D5385",
        borderRadius: "8px",
        background: "#F9F4EB",
        color: "#000000",
      }}
    >
      <h2 style={{ textAlign: "center" }}>감정 분석 전 설문조사</h2>
      <form onSubmit={handleSubmit}>
        {/* 성별 선택 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8 }}>성별</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">선택해주세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>
        </div>

        {/* 연령대 선택 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8 }}>연령대</label>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">선택해주세요</option>
            <option value="10s">10대</option>
            <option value="20s">20대</option>
            <option value="30s">30대</option>
            <option value="40s">40대</option>
            <option value="50s+">50대 이상</option>
          </select>
        </div>

        <button
          type="submit"
          className="flex-button"
        >
          제출
        </button>
      </form>
    </div>
  );
}
