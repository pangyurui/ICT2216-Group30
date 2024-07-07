import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddProduct.css';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';

const AddProduct = () => {
    const [product, setProduct] = useState({
        name: '',
        description: '',
        image: null,
        price: '',
        deletedAt: '',
        // categoryId: '',
        organisationId: ''
    });
 
    const [organisations, setOrganisations] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {

        // Fetch organisations
        axios.get('https://ict2216group30.store/api/organisations/')
            .then(response => setOrganisations(response.data))
            .catch(error => {});
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = DOMPurify.sanitize(value); // Sanitize the value
        if (e.target.type === 'file') {
            setProduct(prev => ({ ...prev, [name]: e.target.files[0] }));
        } else {
            setProduct(prev => ({ ...prev, [name]: sanitizedValue })); // Use sanitizedValue
        }
    };
    

    const handleFileChange = (e) => {
        setProduct(prev => ({ ...prev, image: e.target.files[0] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const token = localStorage.getItem('access_token');
        if (!token) {
            Swal.fire('Authentication Error', 'No access token found. Please login again.', 'error');
            return;
        }

        // FormData to include file uploads
        const formData = new FormData();
        Object.entries(product).forEach(([key, value]) => {
            // if (key === 'categoryId') key = 'category_id';
            if (key === 'organisationId') key = 'organisation_id';
            const safeValue = typeof value === 'string' ? DOMPurify.sanitize(value) : value;
            formData.append(key, safeValue);
        
        });


         // Handle the post request
         axios.post('https://ict2216group30.store/api/products/add/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                 'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            Swal.fire({
                position: "top-end",
                title: 'Added ' + product.name + " successfully",
                timer: 1500,
                icon: 'success',
                showConfirmButton: false,
              });
            navigate('/admin'); // Redirect on successful add
        })
        .catch(error => {
            Swal.fire({
                position: "top-end",
                title: 'Failed to add product',
                timer: 1500,
                icon: 'error',
                showConfirmButton: false,
              });
        });
    };

    return (
        <div className="form-container">
            <h1>Add New Product</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input type="text" name="name" value={product.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Description:</label>
                    <textarea name="description" value={product.description} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Image:</label>
                    <input type="file" name="image" onChange={handleFileChange} />
                </div>
                <div className="form-group">
                    <label>Price:</label>
                    <input type="text" name="price" value={product.price} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                    <label>Organisation:</label>
                        <select name="organisationId" onChange={handleChange}>
                            <option value="">Select an Organisation</option>
                            {organisations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                </div>
                <div className="form-group">
                    <button type="submit">Submit</button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
