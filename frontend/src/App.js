import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "./user/components/navbar";
import AdminNavbar from "./admin/components/AdminNavbar";
import { Shop } from "./user/pages/shop/shop";
import { Contact } from "./user/pages/miscellaneous/contact";
import { AboutUs } from "./user/pages/miscellaneous/aboutus";
import { Cart } from "./user/pages/cart/cart";
import { TwoFALogin } from "./user/pages/register/2fa";
import { ProductPage } from "./user/pages/product/ProductPage";
import { Register } from "./user/pages/register/register";
import { Login } from "./user/pages/register/login";
import { Account } from "./user/pages/account/account";
import { Payments } from "./user/pages/payment/payments";
import { Addresses } from "./user/pages/address/addresses";
import { Checkout } from "./user/pages/checkout/checkout";
import { Orders } from "./user/pages/order/orders";
import { ShopContextProvider } from "./user/context/shop-context";
import { SearchProvider } from "./user/context/search-context";
import { getAccessToken, clearAuth } from "./utils/auth";
import { jwtDecode } from "jwt-decode";
import { AdminOrganisation } from "./admin/pages/organisations/adminorganisation";
import { ManageOrganisation } from "./admin/pages/organisations/manageorganisation";
import { Organisation } from './user/pages/organisation/organisation';
import axios from "axios";
import useAutoLogout from './utils/autoLogout';

// Admin Pages
import AdminDashboard from './admin/pages/dashboard/AdminDashboard';
import AddProduct from './admin/pages/product/AddProduct';
import EditProduct from './admin/pages/product/EditProduct';
import ManageUsers from "./admin/pages/users/ManageUsers";


const AppContent = ({ auth, logout, setAuth, hasLoggedOut, setHasLoggedOut }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  useAutoLogout(logout, 60000, hasLoggedOut, setHasLoggedOut);


  const userRoutes = (
    <>
      <Route path="/" element={<Shop />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={auth ? <Navigate to="/" /> : <Login setAuth={setAuth} setHasLoggedOut={setHasLoggedOut} />} />
      <Route path="/account" element={auth ? <Account setAuth={setAuth}/> : <Navigate to="/login" />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/addresses" element={<Addresses />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/organisations" element={<Organisation />} />
      <Route path="/2fa" element={<TwoFALogin />} />
      <Route path="/aboutus" element={<AboutUs />} />

      {/* Admin routes that redirect unauthorized users to the home page */}
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      <Route path="/adminorganisation" element={<Navigate to="/" replace />} />
      <Route path="/manageorganisation" element={<Navigate to="/" replace />} />
      <Route path="/manageorganisation/:id" element={<Navigate to="/" replace />} />
      
    </>
  );

  const adminRoutes = (
    <>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/product/add-product" element={<AddProduct />} />
      <Route path="/admin/product/edit-product/:id" element={<EditProduct />} />
      <Route path="/adminorganisation" element={<AdminOrganisation />} />
      <Route path="/manageorganisation" element={<ManageOrganisation />} />
      <Route path="/manageorganisation/:id" element={<ManageOrganisation />} />
      <Route path="/admin/manage-users" element={<ManageUsers />} />

    </>
  );

  return (
    <Routes>
      {auth?.is_superuser ? adminRoutes : userRoutes}
    </Routes>
  );
};

function App() {
  const [auth, setAuth] = useState(null);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = await getAccessToken();
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      if (token && isLoggedIn) {
        try {
          const user = jwtDecode(token);
          setAuth(user);
          setHasLoggedOut(false); // Reset the hasLoggedOut state when a user logs in
        } catch (error) {
          clearAuth(); // Clear authentication state on error
        }
      }
    };

    initializeAuth();
  }, []);

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await axios.post('/api/logout/', { refresh_token: refreshToken });
      } catch (error) {
        
      }
    }
    clearAuth();
    setAuth(null);
  };

  return (
    <div className="App">
      <Router>
        {auth?.is_superuser ? <AdminNavbar logout={logout} /> : <Navbar auth={auth} logout={logout} />}
        <ShopContextProvider>
          <SearchProvider>
            <AppContent auth={auth} logout={logout} setAuth={setAuth} hasLoggedOut={hasLoggedOut} setHasLoggedOut={setHasLoggedOut} />
          </SearchProvider>
        </ShopContextProvider>
      </Router>
    </div>
  );
}

export default App;
