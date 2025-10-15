// src/Layout.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 🔼 헤더 */}
      <header style={{
        backgroundColor: '#F9F4EB',
        color: 'white',
        padding: '16px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          margin: 0, 
          color: '#1D5385', 
          fontSize: '38px',
          fontFamily: '"Mungyeong Gamhong Apple", sans-serif'
          }}>
            Feelm
          </h1>
        <nav style={{
          display: 'flex', 
          gap: '32px' 
        }}>
            <Link to="/" style={{ color: '#1D5385', textDecoration: 'none' }}>홈</Link>
            <Link to="Mypage" style={{ color: '#1D5385', textDecoration: 'none' }}>마이페이지</Link>
            <Link to="login" style={{ color: '#1D5385', textDecoration: 'none' }}>로그아웃</Link>

        </nav>
      </header>

      <hr style={{
            border: 'none',
            borderTop: '1px solid #1D5385',
            margin: 0
      }} />

      {/* 📄 페이지 내용 */}
      <main style={{ flex: 1, padding: '24px 24px 80px' }}>
        <Outlet />
      </main>

      {/* 🔽 푸터 */}
      <footer style={{
        backgroundColor: '#24292f',
        padding: '16px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#e0e0e0'
      }}>
        © 2025 OTT 콘텐츠 감정 분석 시스템 - Inside Out Team
      </footer>
    </div>
  );
}
