import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from 'react-router-dom';
import './adminorganisation.css'; // Import the CSS file
import Swal from 'sweetalert2';

export const ManageOrganisation = () => {
  const [formData, setFormData] = useState({
    name: '',
    desc: '',
    image: null,
  });
  const navigate = useNavigate();
  const { id } = useParams(); // Get the ID from the URL

  useEffect(() => {
    if (id) {
      axios.get(`http://127.0.0.1:8000/api/organisations/${id}/`)
        .then(response => {
          setFormData({
            name: response.data.name,
            desc: response.data.desc,
            image: null,
          });
        })
        .catch(error => {
          console.error("There was an error fetching the organisation data!", error);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('desc', formData.desc);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    const url = id 
      ? `http://127.0.0.1:8000/api/organisations/${id}/`
      : "http://127.0.0.1:8000/api/manage-organisations/";

    const method = id ? 'put' : 'post';
    const token = localStorage.getItem('access_token');

    axios({
      method: id ? 'put' : 'post',
      url: url,
      data: formDataToSend,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        Swal.fire({
          title: 'Success!',
          text: `The organisation was successfully ${id ? 'updated' : 'created'}!`,
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
        navigate('/adminorganisation');
      });
    })
      .catch(error => {
        Swal.fire({
          title: 'Error!',
          text: `There was an error ${id ? 'updating' : 'creating'} the organisation.`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        console.error(`There was an error ${id ? 'updating' : 'creating'} the organisation!`, error);
      });
  };

  return (
    <div className="form-container">
      <h1>{id ? 'Edit Organisation' : 'Create Organisation'}</h1>
      <form className="organisation-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <input type="text" name="desc" value={formData.desc} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Image:</label>
          <input type="file" name="image" accept="image/*" onChange={handleChange} />
        </div>
        <button type="submit" className="submit-button">{id ? 'Update' : 'Submit'}</button>
      </form>
    </div>
  );
};
