import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ContentList.css";
import { FaSearch } from "react-icons/fa";


export default function ContentList() {
  const [contents, setContents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // 한 페이지당 3행×5열 = 15개
  const itemsPerPage = 25;

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

  // 최신 등록순 정렬
  const sorted = [...contents].sort((a, b) => b.id - a.id);

  // 검색 필터링
  const filtered = sorted.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 페이지 분할
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentContents = filtered.slice(startIdx, startIdx + itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);

  return (
    <div className="content-list-container">

      <div className="search-and-button">
        <input
          type="text"
          placeholder="제목으로 검색..."
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

      <div
        className="grid-container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
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

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
            «
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
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
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
