import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddContent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    imageFile: null,
    title: '',
    year: '',
    distributor: '',
    genre: '',
  });

  const [preview, setPreview] = useState(null); // 이미지 미리보기

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setForm(prev => ({ ...prev, imageFile: file }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("✅ 등록된 콘텐츠 정보:", {
      title: form.title,
      year: form.year,
      distributor: form.distributor,
      genre: form.genre,
      imageFileName: form.imageFile ? form.imageFile.name : null,
    });

    alert('콘텐츠가 등록되었습니다!');
    navigate('/');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>🎥 콘텐츠 등록</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* 이미지 파일 */}
        <label>
          영화 이미지: 
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
        </label>

        {preview && (
          <img
            src={preview}
            alt="미리보기"
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'contain',
              marginTop: '8px',
              borderRadius: '8px'
            }}
          />
        )}

        {/* 제목 */}
        <input
          type="text"
          name="title"
          placeholder="제목"
          value={form.title}
          onChange={handleChange}
          required
        />

        {/* 연도 (드롭다운) */}
        <label>
          출시 연도:  
          <select
            name="year"
            value={form.year}
            onChange={handleChange}
            required
          >
            <option value="">연도를 선택하세요</option>
            {Array.from({ length: 30 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </label>

        {/* 배급사 */}
        <input
          type="text"
          name="distributor"
          placeholder="배급사"
          value={form.distributor}
          onChange={handleChange}
          required
        />

        {/* 장르 */}
        <input
          type="text"
          name="genre"
          placeholder="장르"
          value={form.genre}
          onChange={handleChange}
          required
        />

        <button type="submit" style={{
          marginTop: '16px',
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          등록
        </button>
      </form>
    </div>
  );
}
