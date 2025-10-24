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
    const file = e.target.files[0];
    if (file) {
      setPoster(file);
    }
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
      const contentId = res.data.content_id;
      navigate(`/content/${contentId}`);
    } catch (err) {
      alert('등록 실패: ' + err.message);
    }
  };

  const handleCancel = () => {
    if (window.confirm('취소하시겠습니까? 입력한 내용은 저장되지 않습니다.')) {
      navigate('/');
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

        {/* 이미지 미리보기 */}
        {poster && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={URL.createObjectURL(poster)}
              alt="Poster Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '330px',
                objectFit: 'contain',
                marginBottom: '10px',
                borderRadius: '4px',
              }}
            />
          </div>
        )}

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
          <label style={{ width: '80px' }}>플랫폼</label>
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

        {/* 등록 / 취소 버튼 */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button
            type="submit"
            className="flex-button"
          >
            등록
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-button"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
