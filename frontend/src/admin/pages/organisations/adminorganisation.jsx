import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import './adminorganisation.css';
import Swal from 'sweetalert2';

export const AdminOrganisation = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get("https://ict2216group30.store/api/organisations?format=json")
      .then(response => {
        if (Array.isArray(response.data)) {
          setData(response.data);
        } else {
          setData([]);
        }
      })
      .catch(error => {
        
        setData([]);
      });
  };


  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this organisation? This process cannot be undone.")) {
      axios.delete(`https://ict2216group30.store/api/organisations/${id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
        .then(() => {
          alert('Organisation deleted successfully');
          fetchData();
        })
        .catch(error => {
          alert('Failed to delete the organisation');
        });
    }
  };

  function DeleteConfirmationModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Are you sure?</h2>
        <p>Do you really want to delete this organisation? This process cannot be undone.</p>
        <button onClick={onConfirm}>Yes, delete it!</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}


  return (
    <div className="admin-container">
      <div className="header-container">
        <h1 className="header-title">Organisations Overview</h1>
        <button className="add-organisation-button" onClick={() => navigate('/manageorganisation')}>Add Organisation</button>
      </div>
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>DESC</th>
            <th>IMAGE</th>
            <th>CREATED AT</th>
            <th>MODIFIED AT</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {data.map((org, index) => (
            <tr key={index}>
              <td>{org.name}</td>
              <td>{org.desc}</td>
              <td>
                {org.image ? (
                  <img src={`${org.image}`} alt={org.name} width="100" />
                ) : (
                  "No image"
                )}
              </td>
              <td>{org.created_at ? new Date(org.created_at).toLocaleString() : "Not available"}</td>
              <td>{org.modified_at ? new Date(org.modified_at).toLocaleString() : "Not available"}</td>
              <td>
                <button className="edit-button" onClick={() => navigate(`/manageorganisation/${org.id}`)}>Edit</button>
                <button className="delete-button" onClick={() => handleDelete(org.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

