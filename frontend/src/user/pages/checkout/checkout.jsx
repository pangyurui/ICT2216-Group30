import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosAuth } from '../../../utils/axiosAuth';
import { ShopContext } from "../../context/shop-context";
import { CartItem } from "../cart/cart-item";
import Swal from 'sweetalert2';
import './checkout.css';

export const Checkout = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [orderCompleted, setOrderCompleted] = useState(false);
    const { cartItems, products, getTotalCartAmount, fetchCartItems } = useContext(ShopContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCartItems();
        fetchPaymentMethods();
        fetchAddresses();
    }, []);

    const totalAmount = getTotalCartAmount();

    const fetchPaymentMethods = async () => {
        try {
            const res = await axiosAuth.get('payments/');
            setPaymentMethods(res.data);
        } catch (err) {
            
        }
    };

    const fetchAddresses = async () => {
        try {
            const res = await axiosAuth.get('addresses/');
            setAddresses(res.data);
        } catch (err) {
            
        }
    };

    const maskAccountNumber = (accountNo) => {
        return accountNo.slice(0, -4).replace(/./g, '*') + accountNo.slice(-4);
    };

    const handleCheckout = async () => {
        if (!selectedPaymentMethod || !selectedAddress) {
            alert('Please select a payment method and delivery address.');
            return;
        }

        try {
            const items = Object.entries(cartItems).map(([itemId, itemData]) => ({
                product_id: itemId,
                quantity: itemData.quantity,
            }));

            const orderData = {
                items
            };
            await axiosAuth.post('checkout/', orderData);
            setOrderCompleted(true);

            Swal.fire({
                title: 'Thank you for your order!',
                text: 'Your order has been placed successfully.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                navigate('/');
            });
        } catch (err) {
            
            Swal.fire({
                title: 'Error',
                text: 'Failed to complete the order.',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    if (orderCompleted) {
        return null;
    }

    return (
        <div className="checkout-container">
            {totalAmount > 0 ? (
                <div className="checkout-container">
            <h2>Checkout</h2>
            <div className="cart-items">
                <h3>Cart Items</h3>
                {Object.entries(cartItems).map(([itemId, itemData]) => {
                    const productDetails = products.find(product => product.id === Number(itemId));
                    if (itemData.quantity > 0 && productDetails) {
                        return <CartItem key={itemId} data={{ id: itemId, quantity: itemData.quantity, productDetails }} />;
                    }
                    return null;
                })}
                <h3>Subtotal: ${totalAmount.toFixed(2)}</h3>
            </div>
            <div className="payment-methods">
                <h3>Select Payment Method</h3>
                <select
                    value={selectedPaymentMethod}
                    onChange={e => setSelectedPaymentMethod(e.target.value)}
                >
                    <option value="">Select Payment Method</option>
                    {paymentMethods.map(method => (
                        <option key={method.id} value={method.id}>
                            {method.payment_type} - {method.provider} - {maskAccountNumber(method.account_no)} - {method.expiry}
                        </option>
                    ))}
                </select>
                <button className="add-button" onClick={() => navigate('/payments')}>Add New Payment Method</button>
            </div>
            <div className="delivery-addresses">
                <h3>Select Delivery Address</h3>
                <select
                    value={selectedAddress}
                    onChange={e => setSelectedAddress(e.target.value)}
                >
                    <option value="">Select Address</option>
                    {addresses.map(address => (
                        <option key={address.id} value={address.id}>
                            {address.address_line1}, {address.city}, {address.country}, {address.postal_code}
                        </option>
                    ))}
                </select>
                <button className="add-button" onClick={() => navigate('/addresses')}>Add New Address</button>
            </div>
            <button className="complete-order-button" onClick={handleCheckout}>Complete Order</button>
        </div>
        ) : (
            <h1>Your Shopping Cart is Empty</h1>
        )}
    </div>
    );
};
