import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./productPage.css";
import Cookies from 'js-cookie'; // Import Cookies library if needed
import "./StarRating.css"; 
import StarRating from './StarRating'; 

export const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [csrfToken, setCsrfToken] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    title: '',
    desc: '',
    rating: 1,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Fetch CSRF token
    const fetchCSRFToken = async () => {
      try {
        const response = await axios.get('https://ict2216group30.store/api/get_csrf_token/');
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
      }
    };

    fetchCSRFToken();

    // Fetch product details
    const fetchProductDetails = () => {
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
    };

    // Fetch reviews for the product
    const fetchReviews = () => {
      axios.get(`https://ict2216group30.store/api/products/${id}/reviews/`, {
        headers: {
          'X-CSRFToken': csrfToken
        }
      })
        .then(response => {
          setReviews(response.data);
        })
        .catch(error => {
        });
    };

    const checkLoginStatus = () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        setIsLoggedIn(true);
      }
    };

    fetchCSRFToken();
    fetchProductDetails();
    fetchReviews();
    checkLoginStatus();
  }, [id, csrfToken]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (rating) => {
    setReviewForm(prev => ({ ...prev, rating }));
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable the submit button
    const token = localStorage.getItem('access_token'); 
    const formData = {
        title: reviewForm.title,
        desc: reviewForm.desc,
        rating: parseInt(reviewForm.rating), 
        product: id, 
    };

    axios.post(`http://127.0.0.1:8000/api/products/${id}/reviews/`, formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => {
        // Handle successful submission
        setReviews([...reviews, response.data]); // Update reviews state with new review
        setIsSubmitting(false); // Re-enable the button
        setShowReviewForm(false);
        
    })
    .catch(error => {
        // Handle errors
        setIsSubmitting(false); // Re-enable the button
        alert('Failed to submit review: ');
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching product</div>;
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
        <h2>Reviews</h2>
        {reviews.length > 0 ? (
          <ul>
            {reviews.map(review => (
              <li key={review.id}>
                <strong>{review.title}</strong>
                <p>{review.desc}</p>
                <StarRating rating={review.rating} onRatingChange={null} /> {/* Display star rating for each review */}
              </li>
            ))}
          </ul>
        ) : <p>No reviews yet.</p>}
        {isLoggedIn && (
          <button className="leaveReviewButton" onClick={() => setShowReviewForm(!showReviewForm)}>Leave a review</button>
        )}
        {/* <button className="leaveReviewButton" onClick={() => setShowReviewForm(!showReviewForm)}>Leave a review</button> */}
        {showReviewForm && (
          <div className="reviewFormContainer">
            <form className="reviewForm" onSubmit={handleReviewSubmit}>
              <label>Title:
                <input type="text" name="title" value={reviewForm.title} onChange={handleInputChange} required />
              </label>
              <label>Description:
                <textarea name="desc" value={reviewForm.desc} onChange={handleInputChange} required />
              </label>
              <label>Rating:
                <StarRating rating={reviewForm.rating} onRatingChange={handleRatingChange} /> {/* Add star rating input */}
              </label>
              {/* <label>Rating:
                <input type="number" name="rating" min="1" max="5" value={reviewForm.rating} onChange={handleInputChange} required />
              </label> */}
              <button type="submit" disabled={isSubmitting}>Submit Review</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
