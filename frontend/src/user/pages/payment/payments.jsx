import React, { useState, useEffect } from 'react';
import { axiosAuth } from '../../../utils/axiosAuth';
import Swal from 'sweetalert2';
import './payments.css';

export const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [expandedPayment, setExpandedPayment] = useState(null);
    const [formData, setFormData] = useState({
        payment_type: 'card',
        provider: 'visa',
        account_no: '',
        expiry: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await axiosAuth.get('payments/');
            setPayments(res.data);
        } catch (err) {
            
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const validateExpiryDate = (expiry) => {
        const regex = /^\d{2}\/\d{2}$/;
        if (!regex.test(expiry)) {
            return 'Expiry date must be in the format MM/YY';
        }
        
        const [month, year] = expiry.split('/').map(Number);
        const currentYear = new Date().getFullYear() % 100; // last two digits of the current year

        if (month < 1 || month > 12) {
            return 'Month must be between 1 and 12';
        }
        
        if (year < currentYear) {
            return 'Year must be greater than or equal to the current year';
        }

        return null;
    };

    const onSubmit = async e => {
        e.preventDefault();
        const expiryError = validateExpiryDate(formData.expiry);

        if (expiryError) {
            setErrors({ expiry: expiryError });
            return;
        }

        try {
            const res = await axiosAuth.post('payments/', formData);
            setPayments([...payments, res.data]);
            setFormData({
                payment_type: 'card',
                provider: 'visa',
                account_no: '',
                expiry: ''
            });
            setErrors({});
            Swal.fire({
                title: 'Success!',
                text: 'Payment method added successfully.',
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
                await axiosAuth.delete(`payments/${id}/`);
                setPayments(payments.filter(payment => payment.id !== id));
                Swal.fire(
                    'Deleted!',
                    'Your payment method has been deleted.',
                    'success'
                );
            } catch (err) {
                Swal.fire(
                    'Error!',
                    'There was an error deleting your payment method.',
                    'error'
                );
            }
        }
    };

    const onEdit = payment => {
        setFormData(payment);
    };

    const onUpdate = async e => {
        e.preventDefault();
        const expiryError = validateExpiryDate(formData.expiry);

        if (expiryError) {
            setErrors({ expiry: expiryError });
            return;
        }

        try {
            const res = await axiosAuth.put(`payments/${formData.id}/`, formData);
            setPayments(payments.map(payment => payment.id === res.data.id ? res.data : payment));
            setFormData({
                payment_type: 'card',
                provider: 'visa',
                account_no: '',
                expiry: ''
            });
            setErrors({});
            Swal.fire({
                title: 'Updated Successfully!',
                html: `
                    <p><strong>Provider:</strong> ${res.data.provider}</p>
                    <p><strong>Account Number:</strong> ${res.data.account_no}</p>
                    <p><strong>Expiry:</strong> ${res.data.expiry}</p>
                `,
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } catch (err) {
        }
    };

    const resetForm = () => {
        setFormData({
            payment_type: 'card',
            provider: 'visa',
            account_no: '',
            expiry: ''
        });
        setErrors({});
    };

    const toggleExpand = id => {
        setExpandedPayment(expandedPayment === id ? null : id);
    };

    return (
        <div className="payments-container">
            <h2>User Payments</h2>
            <form className="payments-form" onSubmit={formData.id ? onUpdate : onSubmit}>
                <div>
                    <label>Payment Type</label>
                    <select
                        name="payment_type"
                        value={formData.payment_type}
                        onChange={onChange}
                        required
                    >
                        <option value="card">Card</option>
                    </select>
                </div>
                <div>
                    <label>Provider</label>
                    <select
                        name="provider"
                        value={formData.provider}
                        onChange={onChange}
                        required
                    >
                        <option value="visa">VISA</option>
                        <option value="mastercard">MasterCard</option>
                    </select>
                </div>
                <div>
                    <label>Account Number</label>
                    <input
                        type="text"
                        name="account_no"
                        value={formData.account_no}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <label>Expiry Date</label>
                    <input
                        type="text"
                        name="expiry"
                        value={formData.expiry}
                        onChange={onChange}
                        required
                        placeholder="MM/YY"
                        pattern="\d{2}/\d{2}"
                    />
                    {errors.expiry && <span className="error">{errors.expiry}</span>}
                </div>
                <button type="submit">{formData.id ? 'Update Payment' : 'Add Payment'}</button>
                {formData.id && <button type="button" onClick={resetForm}>Add New Payment</button>}
            </form>
            <h2>Saved Payments</h2>
            <ul className="payments-list">
                {payments.map(payment => (
                    <li key={payment.id} onClick={() => toggleExpand(payment.id)}>
                        <div className="payment-summary">
                            <span>{payment.provider}</span> - <span>{payment.account_no}</span>
                        </div>
                        {expandedPayment === payment.id && (
                            <div className="payment-details">
                                <div className="payment-type">Payment type: {payment.payment_type}</div>
                                <div className="expiry">Expiry: {payment.expiry}</div>
                                <div className="payment-actions">
                                    <button className="edit-button" onClick={() => onEdit(payment)}>Edit</button>
                                    <button className="delete-button" onClick={() => onDelete(payment.id)}>Delete</button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};
