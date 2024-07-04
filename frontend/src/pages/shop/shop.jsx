import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import { Product } from "./product";
import { SearchInput } from "../../components/searchInput";
import { SearchContext } from "../../context/search-context";
import "./shop.css";

export const Shop = () => {
  const { searchResults, setProducts, setSearchResults } = useContext(SearchContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/products/')
      .then(response => {
        setProducts(response.data);
        setSearchResults(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, [setProducts, setSearchResults]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching products: {error.message}</div>;
  }

  return (
    <div className="shop">
      <div className="shopTitle">
        <h1>Charity Central</h1>
      </div>
      <SearchInput />
      <div className="products">
        {searchResults.length > 0 ? (
          searchResults.map((product) => (
            <Product key={product.id} data={product} />
          ))
        ) : (
          <p>No products available</p>
        )}
      </div>
    </div>
  );
};
