import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CoatHanger, UsersThree, FolderNotchOpen } from "phosphor-react";
import "./AdminNavbar.css";
import Swal from "sweetalert2";

const AdminNavbar = ({ logout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // Redirect to login page after logout
      Swal.fire(
        'Logged Out',
        'You have been logged out successfully.',
        'success'
      );
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="navbar admin-navbar">
      <div className="links">
        <Link to="/admin">
          <CoatHanger size={30} />
          Manage Products
        </Link>
        <Link to="/admin/manage-users">
          <UsersThree size={30} />
          Manage Users
        </Link>
        <Link to="/adminorganisation">
          <FolderNotchOpen size={30} />
          Manage Organisations
        </Link>
        
      </div>
      <Link to="/" className="logout-link" onClick={handleLogout}>
        Logout
      </Link>


      {/* <div className="profile">
        <GearSix size={36} className="settings-icon" />
        <div className="admin-options">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default AdminNavbar;
