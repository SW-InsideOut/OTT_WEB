import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


export default function AddContent() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    release_year: new Date().getFullYear(),
    distributor: '',
    genre: '',
  });
  const [poster, setPoster] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setPoster(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) =>
      formData.append(key, value)
    );
    if (poster) formData.append('poster', poster);
  
    try {
      const res = await axios.post('http://localhost:5000/add_content', formData);
      alert('콘텐츠가 등록되었습니다.');
  
      // 등록된 콘텐츠 ID로 이동
      const contentId = res.data.content_id; // 이 값이 백엔드에서 반환되어야 함
      window.location.href = `/content/${contentId}`;
    } catch (err) {
      alert('등록 실패: ' + err.message);
    }
  };
  

  return (
    <div
      style={{
        height: '80vh',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '360px',
        }}
      >
        <h2 style={{ textAlign: 'center' }}>콘텐츠 등록</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ width: '80px' }}>표지 이미지</label>
          <input type="file" accept="image/*" onChange={handleFileChange} required />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ width: '80px' }}>제목</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ width: '80px' }}>공개 연도</label>
          <select
            name="release_year"
            value={form.release_year}
            onChange={handleChange}
            style={{ flex: 1 }}
          >
            {Array.from({ length: 40 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ width: '80px' }}>배급사</label>
          <input
            type="text"
            name="distributor"
            value={form.distributor}
            onChange={handleChange}
            required
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ width: '80px' }}>장르</label>
          <input
            type="text"
            name="genre"
            value={form.genre}
            onChange={handleChange}
            required
            style={{ flex: 1 }}
          />
        </div>

        <button type="submit" style={{ marginTop: '12px' }}>
          등록
        </button>
      </form>
    </div>
  );
}
