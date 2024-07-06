import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";  // Import Link from react-router-dom
import { Product } from "./product";
import { SearchInput } from "./searchInput";
import { SearchContext } from "../../context/search-context";
import "./shop.css";
import Cookies from 'js-cookie'; // Import Cookies library

export const Shop = () => {
  const { searchResults, setProducts, setSearchResults } = useContext(SearchContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('https://ict2216group30.store/api/products/')
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
      <div className="shopTitle">Welcome to Charity Central</div>
      <div className="view-organisations">
        <Link to="/organisations">
          <button className="view-organisations-button">View Our Partner Organisations</button>
        </Link>
      </div>
      <SearchInput className="search-input" />
      <div className="products">
        {searchResults.length > 0 ? (
          searchResults.map(product => <Product key={product.id} data={product} />)
        ) : (
          <p>No products available</p>
        )}
      </div>
    </div>
  );
};
