import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, UserCircle } from "phosphor-react";
import Swal from "sweetalert2";
import "./navbar.css";

export const Navbar = ({ auth, logout }) => {
  const handleLogout = () => {
    logout();
    Swal.fire(
      'Logged Out',
      'You have been logged out successfully.',
      'success'
    );
  };

  return (
    <div className="navbar">
      <div className="links">
        <Link to="/"> Shop </Link>
        <Link to="/contact"> Contact </Link>
        <Link to="/aboutus"> About us </Link>
        <Link to="/cart">
          <ShoppingCart size={32} />
        </Link>
      </div>
      <div className="profile">
        <UserCircle size={36} /> 
        {auth ? (
          <div className="account-options">
            <Link to="/account">Account</Link>
            <Link to="/payments">Payment Methods</Link>
            <Link to="/addresses">Addresses</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/" onClick={handleLogout}>Logout</Link>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        )}
      </div>
    </div>
  );
};
