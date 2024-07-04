import React, { useContext } from "react";
import { SearchContext } from "../../context/search-context";
import "./searchInput.css";

export const SearchInput = () => {
  const { searchQuery, handleSearch } = useContext(SearchContext);

  return (
    <div className="search-input-container">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search products..."
        className="search-input"
      />
    </div>
  );
};
