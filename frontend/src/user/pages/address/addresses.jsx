import React, { useState, useEffect } from 'react';
import { axiosAuth } from '../../../utils/axiosAuth';
import Swal from 'sweetalert2';
import './addresses.css';

export const Addresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [formData, setFormData] = useState({
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: ''
    });
    const [expandedAddressId, setExpandedAddressId] = useState(null);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await axiosAuth.get('addresses/');
            setAddresses(res.data);
        } catch (err) {
            
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axiosAuth.post('addresses/', formData);
            setAddresses([...addresses, res.data]);
            setFormData({
                address_line1: '',
                address_line2: '',
                city: '',
                postal_code: '',
                country: ''
            });

            Swal.fire({
                title: 'Success!',
                text: 'Address added successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } catch (err) {
            
        }
    };

    const onDelete = async id => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!'
        });

        if (result.isConfirmed) {
            try {
                await axiosAuth.delete(`addresses/${id}/`);
                setAddresses(addresses.filter(address => address.id !== id));
                Swal.fire(
                    'Deleted!',
                    'Your address has been deleted.',
                    'success'
                );
            } catch (err) {
                Swal.fire(
                    'Error!',
                    'There was an error deleting your address.',
                    'error'
                );
            }
        }
    };

    const onEdit = address => {
        setFormData(address);
    };

    const onUpdate = async e => {
        e.preventDefault();
        try {
            const res = await axiosAuth.put(`addresses/${formData.id}/`, formData);
            setAddresses(addresses.map(address => address.id === res.data.id ? res.data : address));
            setFormData({
                address_line1: '',
                address_line2: '',
                city: '',
                postal_code: '',
                country: ''
            });

            Swal.fire({
                title: 'Updated Successfully!',
                html: `
                    <p><strong>Address Line 1:</strong> ${res.data.address_line1}</p>
                    <p><strong>Address Line 2:</strong> ${res.data.address_line2}</p>
                    <p><strong>City:</strong> ${res.data.city}</p>
                    <p><strong>Postal Code:</strong> ${res.data.postal_code}</p>
                    <p><strong>Country:</strong> ${res.data.country}</p>
                `,
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } catch (err) {
            
        }
    };

    const toggleExpand = id => {
        setExpandedAddressId(expandedAddressId === id ? null : id);
    };

    const clearForm = () => {
        setFormData({
            address_line1: '',
            address_line2: '',
            city: '',
            postal_code: '',
            country: ''
        });
    };

    return (
        <div className="addresses-container">
            <h2>User Addresses</h2>
            <form className="addresses-form" onSubmit={formData.id ? onUpdate : onSubmit}>
                <div>
                    <label>Address Line 1</label>
                    <input
                        type="text"
                        name="address_line1"
                        value={formData.address_line1}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <label>Address Line 2</label>
                    <input
                        type="text"
                        name="address_line2"
                        value={formData.address_line2}
                        onChange={onChange}
                    />
                </div>
                <div>
                    <label>City</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <label>Postal Code</label>
                    <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <label>Country</label>
                    <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={onChange}
                        required
                    />
                </div>
                <button type="submit">{formData.id ? 'Update Address' : 'Add Address'}</button>
                {formData.id && <button type="button" onClick={clearForm}>Add New Address</button>}
            </form>
            <h2>Saved Addresses</h2>
            <ul className="addresses-list">
                {addresses.map(address => (
                    <li key={address.id} onClick={() => toggleExpand(address.id)} className={expandedAddressId === address.id ? 'expanded' : ''}>
                    <div className="address-summary">{address.address_line1}</div>
                    {expandedAddressId === address.id && (
                        <div className="address-details">
                            <div className="address-line1">{address.address_line1}</div>
                            <div className="address-line2">{address.address_line2}</div>
                            <div className="city">{address.city}</div>
                            <div className="postal-code">{address.postal_code}</div>
                            <div className="country">{address.country}</div>
                            <div className="address-actions">
                                <button className="edit-button" onClick={() => onEdit(address)}>Edit</button>
                                <button className="delete-button" onClick={(e) => {e.stopPropagation(); onDelete(address.id)}}>Delete</button>
                            </div>
                        </div>
                    )}
                </li>
                ))}
            </ul>
        </div>
    );
};
