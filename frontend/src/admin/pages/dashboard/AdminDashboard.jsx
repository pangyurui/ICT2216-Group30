// In admin dashboard, will handle the products

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import DOMPurify from 'dompurify';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('https://ict2216group30.store/api/products/')
            .then(response => {
                const formattedData = response.data.map(product => ({
                    ...product,
                    price: typeof product.price === 'number' ? product.price : parseFloat(product.price),
                    name: DOMPurify.sanitize(product.name),
                    description: DOMPurify.sanitize(product.description)

                }));
                setProducts(formattedData);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                setError(error);
                setLoading(false);
            });
    }, []);

    const handleAddProductClick = () => {
        navigate('/admin/product/add-product');
    };

    const handleEditProduct = (id) => {
        navigate(`/admin/product/edit-product/${id}`);
    };

    const deleteProduct = (productId) => {
        if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            axios.delete(`https://ict2216group30.store/api/products/delete/${productId}/`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
              })
                .then(() => {
                    alert('Product deleted successfully');
                    setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
                })
                .catch(error => {
                    console.error('Error deleting the product:', error);
                    alert('Failed to delete the product');
                });
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error fetching products: {error.message}</div>;
    }

    return (
        <div className="admin-content">
            <div className="admin-header">
                <h1 className="admin-heading">Products Overview</h1>
                {/* <button onClick={() => navigate('/admin/product/add-product')}>Go to Add Product</button> */}

                <button onClick={handleAddProductClick} className="admin-add-btn">Add Product</button>
            </div>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>PRODUCT ID</th>
                        <th>NAME</th>
                        <th>DESCRIPTION</th>
                        <th>PRICE</th>
                        {/* <th>CATEGORY ID</th> */}
                        <th>ORGANISATION ID</th>
                        <th>IMAGE</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td>{product.id}</td>
                            <td>{product.name}</td>
                            <td>{product.description}</td>
                            <td>${parseFloat(product.price).toFixed(2)}</td>
                            {/* <td>{product.category_id || 'No Category'}</td>  */}
                            <td>{product.organisation_id || 'No Organisation'}</td>  
                            <td>
                                {/* <img src={product.image ? `http://localhost:8000${product.image}` : 'http://via.placeholder.com/150'}
                                     alt={product.name}
                                     style={{width: '50px', height: '50px', borderRadius: '50%'}} /> */}

                                <img src={product.image} alt={product.name} style={{ width: '100px', height: '100px' }} />

                            </td>

                            <td>
                                <button onClick={() => handleEditProduct(product.id)} className="edit-btn">Edit</button>
                                <button className="delete-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;
