import { createContext, useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';

export const ShopContext = createContext(null);

const getDefaultCart = (products) => {
  let cart = {};
  products.forEach(product => {
    cart[product.id] = 0;
  });
  return cart;
};

export const ShopContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/products/')
      .then(response => {
        console.log('Products fetched in ShopContextProvider:', response.data);  // Debug log
        setProducts(response.data);
        setCartItems(getDefaultCart(response.data));
      })
      .catch(error => {
        console.error('There was an error fetching the products!', error);
      });
  }, []);

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = products.find((product) => product.id === Number(item));
        totalAmount += cartItems[item] * itemInfo.price;
      }
    }
    return totalAmount;
  };

  const addToCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    const itemInfo = products.find((product) => product.id === itemId);
    Swal.fire({
      position: "top-end",
      title: 'Added ' + itemInfo.name + " to cart",
      timer: 1500,
      icon: 'success',
      showConfirmButton: false,
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    const itemInfo = products.find((product) => product.id === itemId);
    Swal.fire({
      position: "top-end",
      title: 'Removed ' + itemInfo.name + " from cart",
      timer: 1500,
      icon: 'success',
      showConfirmButton: false,
    });
  };

  const removeAllCartItemsByName = (productName) => {
    Swal.fire({
      title: "Remove all " + productName + "'s from cart?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        setCartItems((prev) => {
          const updatedCart = { ...prev };
          products.forEach((product) => {
            if (product.name === productName) {
              updatedCart[product.id] = 0;
            }
          });
          return updatedCart;
        });
        Swal.fire({
          title: `All ${productName}'s removed from cart`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const updateCartItemCount = (newAmount, itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: newAmount }));
  };

  const checkout = () => {
    setCartItems(getDefaultCart(products));
  };

  const contextValue = {
    cartItems,
    products,
    addToCart,
    updateCartItemCount,
    removeFromCart,
    getTotalCartAmount,
    checkout,
    removeAllCartItemsByName
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};
