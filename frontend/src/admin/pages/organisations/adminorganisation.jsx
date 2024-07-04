import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import './adminorganisation.css'; // Import the CSS file
import Swal from 'sweetalert2';

export const AdminOrganisation = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get("http://127.0.0.1:8000/api/organisations?format=json")
      .then(response => {
        if (Array.isArray(response.data)) {
          setData(response.data);
        } else {
          console.error("Expected an array but got:", response.data);
          setData([]);
        }
      })
      .catch(error => {
        console.error("There was an error fetching the data!", error);
        setData([]);
      });
  };


  const handleDelete = (id) => {
    // Add a confirmation dialog
    if (window.confirm("Are you sure you want to delete this organisation? This process cannot be undone.")) {
      axios.delete(`http://127.0.0.1:8000/api/organisations/${id}/`)
        .then(() => {
          alert('Organisation deleted successfully');
          fetchData(); // Re-fetch data to update the list after deletion
        })
        .catch(error => {
          console.error("There was an error deleting the organisation!", error);
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
                <button className="edit-button" onClick={() => navigate(`/adminorganisation/${org.id}`)}>Edit</button>
                <button className="delete-button" onClick={() => handleDelete(org.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

