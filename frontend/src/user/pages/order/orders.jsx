import React, { useState, useEffect } from 'react';
import { axiosAuth } from '../../../utils/axiosAuth';
import './orders.css';

export const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [expandedOrders, setExpandedOrders] = useState({});

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axiosAuth.get('orders/');
            setOrders(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleOrderDetails = (orderId) => {
        setExpandedOrders(prevState => ({
            ...prevState,
            [orderId]: !prevState[orderId]
        }));
    };

    const formatDateTime = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="orders-container">
            <h2>Order History</h2>
            {orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <div className="order-list">
                    {orders.map(order => (
                        <div key={order.id} className={`order ${expandedOrders[order.id] ? 'expanded' : ''}`} onClick={() => toggleOrderDetails(order.id)}>
                            <h3>Order ID: {order.id}</h3>
                            {expandedOrders[order.id] && (
                                <>
                                    <p>Total: ${order.total}</p>
                                    <p>Date: {formatDateTime(order.created_at)}</p>
                                    <h4>Items:</h4>
                                    <ul>
                                        {order.items.map(item => (
                                            <li key={item.id}>
                                                <span className="order-item-name">{item.product.name}</span>
                                                <span className="order-item-quantity">Qty: {item.quantity}</span>
                                                <span className="order-item-price">${(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
