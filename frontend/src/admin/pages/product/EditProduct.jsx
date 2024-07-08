import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './EditProduct.css';
import Swal from 'sweetalert2';

const EditProduct = () => {
    const [product, setProduct] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        organisationId: '',
        image: null,
        imageName: '',
        existingImageUrl: ''
    });
    const [organisations, setOrganisations] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`https://ict2216group30.store/api/products/${id}/`)
            .then(response => {
                const data = response.data;
                setProduct({
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    categoryId: data.categoryId,
                    organisationId: data.organisationId,
                    existingImageUrl: '',
                    imageName: data.image.split('/').pop()
                
                });
            })
            .catch(error =>{});

        axios.get(`https://ict2216group30.store/api/organisations/`)
            .then(res => setOrganisations(res.data))
            .catch(err => {});
    }, [id]);


    const handleChange = e => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = e => {
        const file = e.target.files[0];
        if (file) {
            setProduct(prev => ({
                ...prev,
                image: file,
                imageName: file.name,
                existingImageUrl: URL.createObjectURL(file)
            }));
        }
    };

    const handleSubmit = e => {

        e.preventDefault();
        const formData = new FormData();
        Object.keys(product).forEach(key => {
            if (key === 'image' && product[key]) {
                formData.append('image', product.image, product.image.name);
            } else if (key !== 'imageName' && key !== 'existingImageUrl') {
                formData.append(key, product[key]);
            }
        });

        if (product.image) {
            formData.append('image', product.image, product.image.name);
        }
        const token = localStorage.getItem('access_token');
            if (!token) {
                return;
            }
        axios.put(`https://ict2216group30.store/api/products/update/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
             }
        })
        .then(response => {
            Swal.fire({
                position: "top-end",
                title: 'Updated ' + product.name + " successfully",
                timer: 1500,
                icon: 'success',
                showConfirmButton: false,
              });
            navigate('/admin');
        })
        .catch(error => {
            Swal.fire({
                title: 'Error!',
                text: `Failed to update product: ${error.response ? error.response.data.detail : 'No detail'}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
    };


    return (
        <div className="edit-product-container">
            <h1>Edit Product</h1>
            <form onSubmit={handleSubmit} className="edit-product-form">
                <label>Name:<input type="text" name="name" value={product.name} onChange={handleChange} required /></label>
                <label>Description:<textarea name="description" value={product.description} onChange={handleChange} required /></label>
                <label>Price:<input type="number" name="price" value={product.price} onChange={handleChange} required /></label>
                <label>Organisation:<select name="organisationId" value={product.organisationId} onChange={handleChange} required>
                    <option value="">Select an Organisation</option>
                    {organisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select></label>
                
                <label>Image:<input type="file" name="image" onChange={handleFileChange} />
                    {product.imageName && <div><strong>Image Name:</strong> {product.imageName}</div>}
                </label>
                {product.existingImageUrl && <img src={product.existingImageUrl} alt="Current Product" style={{ width: '100px', height: '100px' }} />}
                <button type="submit">Update Product</button>
            </form>
        </div>
    );
};

export default EditProduct;
