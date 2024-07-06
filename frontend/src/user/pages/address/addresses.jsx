import React, { useState, useEffect } from 'react';
import { axiosAuth } from '../../../utils/axiosAuth';
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
            console.error(err);
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
        } catch (err) {
            console.error(err);
        }
    };

    const onDelete = async id => {
        try {
            await axiosAuth.delete(`addresses/${id}/`);
            setAddresses(addresses.filter(address => address.id !== id));
        } catch (err) {
            console.error(err);
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
        } catch (err) {
            console.error(err);
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
                {formData.id && <button onClick={clearForm}>Add New Address</button>}
            </form>
            <h2> Saved Addresses</h2>
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
                                <button className="delete-button" onClick={() => onDelete(address.id)}>Delete</button>
                            </div>
                        </div>
                    )}
                </li>
                ))}
            </ul>
        </div>
    );
};
