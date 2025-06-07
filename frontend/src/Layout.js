// src/Layout.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 🔼 헤더 */}
      <header style={{
        backgroundColor: '#24292f',
        color: 'white',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>InsideOut</h1>
        <nav style={{
          display: 'flex', 
          gap: '32px' 
        }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>홈</Link>
            <Link to="Mypage" style={{ color: 'white', textDecoration: 'none' }}>마이페이지</Link>
            <Link to="login" style={{ color: 'white', textDecoration: 'none' }}>로그아웃</Link>

        </nav>
      </header>

      {/* 📄 페이지 내용 */}
      <main style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </main>

      {/* 🔽 푸터 */}
      <footer style={{
        backgroundColor: '#f1f1f1',
        padding: '16px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#888'
      }}>
        © 2025 OTT 콘텐츠 감정 분석 시스템 - Inside Out Team
      </footer>
    </div>
  );
}
