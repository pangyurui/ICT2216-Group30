import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./productPage.css";
import Cookies from 'js-cookie';
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
  const [loggedInUser, setLoggedInUser] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await axios.get('https://ict2216group30.store/api/get_csrf_token/');
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
      }
    };

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
          console.error('Error fetching reviews:', error);
        });
    };

    const checkLoginStatus = () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        setIsLoggedIn(true);
        const user = localStorage.getItem('username'); 
        console.log('Username from localStorage:', user);
        setLoggedInUser(user);
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
    setIsSubmitting(true);
    const token = localStorage.getItem('access_token'); 
    const formData = {
        title: reviewForm.title,
        desc: reviewForm.desc,
        rating: parseInt(reviewForm.rating), 
        product: id, 
    };

    const axiosMethod = editingReviewId ? 'put' : 'post';
    const axiosUrl = editingReviewId ? `https://ict2216group30.store/api/reviews/${editingReviewId}/` : `https://ict2216group30.store/api/products/${id}/reviews/`;

    axios[axiosMethod](axiosUrl, formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => {
        // Handle successful submission
        if (editingReviewId) {
          setReviews(reviews.map(review => review.id === editingReviewId ? response.data : review));
      } else {
          setReviews([...reviews, response.data]);
      }
      setIsSubmitting(false);
      setShowReviewForm(false);
      setEditingReviewId(null); // Reset editingReviewId after submission
  })
  .catch(error => {
      // Handle errors
      setIsSubmitting(false);
      alert('Failed to submit review: ' + error.message);
  });
};

const handleReviewDelete = (reviewId) => {
  const token = localStorage.getItem('access_token');
  axios.delete(`http://127.0.0.1:8000/api/reviews/${reviewId}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-CSRFToken': csrfToken
    }
  })
  .then(response => {
    setReviews(reviews.filter(review => review.id !== reviewId));
  })
  .catch(error => {
    console.error('Error deleting review:', error);
    });
  };

  const handleReviewEdit = (review) => {
    setReviewForm({
      title: review.title,
      desc: review.desc,
      rating: review.rating
    });
    setEditingReviewId(review.id);
    setShowReviewForm(true);
  };

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
      </div>

      <div className="productReviews">
        <h2>Reviews</h2>
        {reviews.length > 0 ? (
          <ul>
            {reviews.map(review => (
              <li key={review.id}>
                <strong>{review.title}</strong>
                <p>{review.desc}</p>
                <p>Reviewed by: {review.username}</p>
                <StarRating rating={review.rating} onRatingChange={null} /> 
                {console.log(`loggedInUser: ${loggedInUser}, review.username: ${review.username.trim().toLowerCase()}`)}
                {loggedInUser === review.username.trim().toLowerCase() && (
                  <div>
                    <button className="editButton" onClick={() => handleReviewEdit(review)}>Edit</button>
                    <button className="deleteButton" onClick={() => handleReviewDelete(review.id)}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : <p>No reviews yet.</p>}
        {isLoggedIn && (
          <button className="leaveReviewButton" onClick={() => setShowReviewForm(!showReviewForm)}>Leave a review</button>
        )}
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
                <StarRating rating={reviewForm.rating} onRatingChange={handleRatingChange} />
              </label>
              <button type="submit" disabled={isSubmitting}>Submit Review</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
