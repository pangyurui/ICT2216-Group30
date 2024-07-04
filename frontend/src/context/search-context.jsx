import React, { createContext, useState } from "react";

export const SearchContext = createContext(null);

export const SearchProvider = ({ children, initialProducts }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState(initialProducts || []);
  const [searchResults, setSearchResults] = useState(initialProducts || []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === "") {
      setSearchResults(products);
    } else {
      const results = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    }
  };

  const contextValue = {
    searchQuery,
    searchResults,
    handleSearch,
    setProducts,
    setSearchResults
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};
