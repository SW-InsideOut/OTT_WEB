import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ContentList.css";
import { FaSearch } from "react-icons/fa";

export default function ContentList() {
  const [contents, setContents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("title"); // 🔸 검색 기준
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const itemsPerPage = 30;

  useEffect(() => {
    axios
      .get("http://localhost:5000/contents")
      .then((res) => setContents(res.data))
      .catch(() => alert("콘텐츠를 불러올 수 없습니다."));
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // 🔸 검색 기준에 따라 필터링
  const filtered = contents.filter((content) => {
    const value =
      searchType === "title"
        ? content.name
        : searchType === "platform"
        ? content.distributor
        : content.genre;

    return value?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentContents = sorted.slice(startIdx, startIdx + itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);

  return (
    <div className="content-list-container">

      {/* 🔍 검색 영역 */}
      <div className="search-and-button">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="search-select"
        >
          <option value="title">제목으로 검색</option>
          <option value="platform">플랫폼으로 검색</option>
          <option value="genre">장르로 검색</option>
        </select>

        <input
          type="text"
          placeholder="검색어를 입력하세요..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button className="action-button"><FaSearch /></button>

        <button
          className="action-button"
          onClick={() => navigate("/add")}
        >
          콘텐츠 등록
        </button>
      </div>

      {/* 콘텐츠 목록 */}
      <div
        className="grid-container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "16px",
        }}
      >
        {currentContents.map((content) => (
          <div
            key={content.id}
            className="content-card"
            onClick={() => navigate(`/content/${content.id}`)}
          >
            <img
              src={`http://localhost:5000/${content.poster_url}`}
              alt={content.name}
            />
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1}>«</button>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                className={page === currentPage ? "active" : ""}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            );
          })}

          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      )}
    </div>
  );
}
