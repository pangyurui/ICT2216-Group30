import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import Cookies from 'js-cookie'; // Import Cookies library


export const ShopContext = createContext(null);



const getDefaultCart = (products) => {
  let cart = {};
  products.forEach(product => {
    cart[product.id] = { quantity: 0, cartItemId: null };
  });
  return cart;

};


export const ShopContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [userCartId, setUserCartId] = useState(null);
  const [csrfToken, setCsrfToken] = useState('');


  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://ict2216group30.store/api/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error fetching products.',
      });
    }
  };

  const fetchCartItems = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const cartResponse = await axios.get('https://ict2216group30.store/api/cart/', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-CSRFToken': csrfToken
        }
      });

      setUserCartId(cartResponse.data.id);

      const itemsResponse = await axios.get(`https://ict2216group30.store/api/cart/cart-items/`, {
        headers: {
          Authorization: `Bearer ${token}`,
           'X-CSRFToken': csrfToken
        }
      });

      const initialCart = {};
      itemsResponse.data.forEach(item => {
        initialCart[item.product] = { quantity: item.quantity, cartItemId: item.id };
      });

      setCartItems(initialCart);

    } catch (error) {
      console.error('Error fetching cart items', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please log in to view your cart.',
      });
    }
  }, []);

  useEffect(() => {
// Fetch CSRF token
     const fetchCSRFToken = async () => {
     try {
                const response = await axios.get('https://ict2216group30.store/api/get_csrf_token/', {
                    withCredentials: true // Important: include credentials (cookies)
                });
                const token = Cookies.get('csrftoken'); // Retrieve CSRF token from cookies
                setCsrfToken(token);
            } catch (error) {
                console.error('Failed to fetch CSRF token:', error);
            }
        };

        fetchCSRFToken();

    fetchProducts();
  }, []);

  const addToCart = async (itemId) => {
    const itemInfo = products.find((product) => product.id === itemId);
    if (!itemInfo) {
      console.error('Product not found:', itemId);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('https://ict2216group30.store/api/cart/cart-items/', {
        quantity: 1,
        product: itemId,
        cart: userCartId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-CSRFToken': csrfToken
        }
      });

      setCartItems((prev) => ({
        ...prev,
        [itemId]: { quantity: (prev[itemId]?.quantity || 0) + 1, cartItemId: response.data.id }
      }));

      Swal.fire({
        position: "top-end",
        title: 'Added ' + itemInfo.name + " to cart",
        timer: 1500,
        icon: 'success',
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error adding item to cart', error);
      Swal.fire({
        position: "top-end",
        title: 'Failed to add ' + itemInfo.name + " to cart",
        timer: 1500,
        icon: 'error',
        showConfirmButton: false,
      });
    }
  };

  const removeFromCart = async (itemId) => {
    const itemInfo = products.find((product) => product.id === itemId);
    const currentQuantity = cartItems[itemId]?.quantity || 0;
    const cartItemId = cartItems[itemId]?.cartItemId;

    if (currentQuantity <= 0 || !cartItemId) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`https://ict2216group30.store/api/cart/cart-items/${cartItemId}/`, {
        quantity: currentQuantity - 1,
        product: itemId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-CSRFToken': csrfToken
        }
      });

      setCartItems((prev) => {
        const updatedCart = { ...prev };
        if (currentQuantity - 1 <= 0) {
          delete updatedCart[itemId];
        } else {
          updatedCart[itemId] = { quantity: currentQuantity - 1, cartItemId: cartItemId };
        }
        return updatedCart;
      });

      if (itemInfo) {
        Swal.fire({
          position: "top-end",
          title: 'Removed ' + itemInfo.name + " from cart",
          timer: 1500,
          icon: 'success',
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          position: "top-end",
          title: 'Removed item from cart',
          timer: 1500,
          icon: 'success',
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error removing item from cart', error);
      Swal.fire({
        position: "top-end",
        title: 'Failed to remove item from cart',
        timer: 1500,
        icon: 'error',
        showConfirmButton: false,
      });
    }
  };

  const addToCartQuantity = async (itemId) => {
    const itemInfo = products.find((product) => product.id === itemId);
    const currentQuantity = cartItems[itemId]?.quantity || 0;
    const cartItemId = cartItems[itemId]?.cartItemId;

    if (!cartItemId) {
      // If the item does not exist in the cart, you might want to add it instead of updating.
      await addToCart(itemId);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`https://ict2216group30.store/api/cart/cart-items/${cartItemId}/`, {
        quantity: currentQuantity + 1,
        product: itemId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-CSRFToken': csrfToken
        }
      });

      setCartItems((prev) => ({
        ...prev,
        [itemId]: { quantity: currentQuantity + 1, cartItemId: cartItemId }
      }));

      if (itemInfo) {
        Swal.fire({
          position: "top-end",
          title: 'Added one more ' + itemInfo.name + " to cart",
          timer: 1500,
          icon: 'success',
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          position: "top-end",
          title: 'Added item to cart',
          timer: 1500,
          icon: 'success',
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error adding item to cart', error);
      Swal.fire({
        position: "top-end",
        title: 'Failed to add item to cart',
        timer: 1500,
        icon: 'error',
        showConfirmButton: false,
      });
    }
  };

  const removeAllCartItemsByName = async (productName) => {
    const itemsToRemove = products.filter(product => product.name === productName);

    const result = await Swal.fire({
      title: `Are you sure you want to remove all ${productName}'s from the cart?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove all',
      cancelButtonText: 'No, keep them'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('access_token');
        await Promise.all(itemsToRemove.map(item =>
          axios.delete(`https://ict2216group30.store/api/cart/cart-items/${cartItems[item.id]?.cartItemId}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-CSRFToken': csrfToken
            }
          })
        ));

        setCartItems((prev) => {
          const updatedCart = { ...prev };
          itemsToRemove.forEach(item => {
            updatedCart[item.id] = { quantity: 0, cartItemId: null };
          });
          return updatedCart;
        });

        Swal.fire({
          position: "top-end",
          title: `All ${productName}'s removed from cart`,
          timer: 1500,
          icon: 'success',
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error removing items from cart', error);
        Swal.fire({
          position: "top-end",
          title: `Failed to remove ${productName} from cart`,
          timer: 1500,
          icon: 'error',
          showConfirmButton: false,
        });
      }
    }
  };

  const removeAllItemsFromCart = async () => {
      try {
        const token = localStorage.getItem('access_token');
        await Promise.all(Object.values(cartItems).map(cartItem =>
          axios.delete(`https://ict2216group30.store/api/cart/cart-items/${cartItem.cartItemId}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-CSRFToken': csrfToken
            }
          })
        ));

        setCartItems(getDefaultCart(products));
      } catch (error) {
        console.error('Error removing all items from cart', error);
        Swal.fire({
          position: "top-end",
          title: `Failed to remove all items from cart`,
          timer: 1500,
          icon: 'error',
          showConfirmButton: false,
        });
      }
  };


  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [itemId, itemData]) => {
      const itemInfo = products.find(product => product.id === Number(itemId));
      return total + (itemInfo ? itemInfo.price * itemData.quantity : 0);
    }, 0);
  };

  const updateCartItemCount = async (newAmount, itemId) => {
    const itemInfo = products.find((product) => product.id === itemId);
    const cartItemId = cartItems[itemId]?.cartItemId;

    if (!itemInfo || !cartItemId) {
      console.error('Product not found or not in cart:', itemId);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`https://ict2216group30.store/api/cart/cart-items/${cartItemId}/`, {
        quantity: newAmount,
        product: itemId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
           'X-CSRFToken': csrfToken
        }
      });

      setCartItems((prev) => ({
        ...prev,
        [itemId]: { quantity: newAmount, cartItemId: cartItemId }
      }));

      Swal.fire({
        position: "top-end",
        title: `Updated quantity of ${itemInfo.name} to ${newAmount}`,
        timer: 1500,
        icon: 'success',
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error updating item quantity in cart', error);
      Swal.fire({
        position: "top-end",
        title: 'Failed to update item quantity in cart',
        timer: 1500,
        icon: 'error',
        showConfirmButton: false,
      });
    }
  };

  const checkout = () => {
    setCartItems(getDefaultCart(products));
  };

  const contextValue = {
    cartItems,
    products,
    addToCart,
    addToCartQuantity,
    updateCartItemCount,
    removeFromCart,
    getTotalCartAmount,
    checkout,
    removeAllCartItemsByName,
    fetchCartItems,
    removeAllItemsFromCart
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};
