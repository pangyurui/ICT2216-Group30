import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../context/shop-context";
import { CartItem } from "./cart-item";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import "./cart.css";

export const Cart = () => {
  const { cartItems, products, getTotalCartAmount, fetchCartItems  } = useContext(ShopContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartAndItems = async () => {
      try {
        const token = Cookies.get('access_token');
        
        if (!token) {
          Swal.fire({
            icon: 'error',
            title: 'No Access Token',
            text: 'Please log in to view your cart.',
          });
          
        }
        await fetchCartItems();
        setLoading(false);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Please log in to view your cart.',
        });
        navigate('/login');
      }
    };

    fetchCartAndItems();
  }, [fetchCartItems, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalAmount = getTotalCartAmount();

  return (
    <div className="cart">
      <div>
        <h1>Your Cart Items</h1>
      </div>
      <div className="cart-items">
        {Object.entries(cartItems).map(([itemId, itemData]) => {
          const productDetails = products.find(product => product.id === Number(itemId));
          if (itemData.quantity > 0 && productDetails) {
            return <CartItem key={itemId} data={{ id: itemId, quantity: itemData.quantity, productDetails }} />;
          }
          return null;
        })}
      </div>

      {totalAmount > 0 ? (
        <div className="checkout">
          <p>Subtotal: ${totalAmount.toFixed(2)}</p>
          <button onClick={() => navigate("/")}>Continue Shopping</button>
          <button onClick={() => navigate("/checkout")}>Checkout</button>
        </div>
      ) : (
        <h1>Your Shopping Cart is Empty</h1>
      )}
    </div>
  );
};
