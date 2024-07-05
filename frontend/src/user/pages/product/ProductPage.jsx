import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import "./productPage.css";
import Cookies from 'js-cookie'; // Import Cookies library

export const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // Fetch CSRF token
    const fetchCSRFToken = async () => {
      try {
        const response = await axios.get('https://ict2216group30.store/api/get_csrf_token/');
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };

    fetchCSRFToken();

    // Fetch product details
    axios.get(`https://ict2216group30.store/api/products/${id}/`, {
      headers: {
        'X-CSRFToken': csrfToken
      }
    })
      .then(response => {
        setProduct(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });

    // Fetch reviews for the product
    axios.get(`https://ict2216group30.store/api/products/${id}/reviews/`, {
      headers: {
        'X-CSRFToken': csrfToken
      }
    })
      .then(response => {
        setReviews(response.data);
      })
      .catch(error => {
        console.error('Error fetching reviews:', error);
      });
  }, [id, csrfToken]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching product: {error.message}</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="productPageContainer">
      <div className="productPage">
        <img src={product.image} alt={product.name} className="productImage" />
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p>Price: ${product.price}</p>
        {/* Add to cart button */}
      </div>

      <div className="productReviews">
        <h2>Product Reviews</h2>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <ul>
            {reviews.map(review => (
              <li key={review.id}>
                <h3>{review.title}</h3>
                <p>{review.desc}</p>
                <p>Rating: {review.rating}</p>
                {review.image && <img src={review.image} alt="Review Image" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
