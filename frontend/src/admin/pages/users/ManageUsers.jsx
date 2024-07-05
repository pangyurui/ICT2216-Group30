// src/admin/pages/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageUsers.css'; // Ensure the CSS file is correctly linked

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('https://ict2216group30.store/api/users/');
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setError('Failed to fetch users');
            setLoading(false);
        }
    };

    const handleDelete = (userId) => {
        // Add a confirmation dialog
        if (window.confirm("Are you sure you want to delete this User? This process cannot be undone.")) {
          axios.delete(`https://ict2216group30.store/api/users/${userId}/`)
            .then(() => {
              alert('Users deleted successfully');
              setUsers(users.filter(user => user.id !== userId));
            })
            .catch(error => {
              console.error("There was an error deleting the user!", error);
              alert('Failed to delete the user');
            });
        }
      };

    // const handleDelete = async (userId) => {
    //     try {
    //         await axios.delete(`https://ict2216group30.store/api/users/${userId}/`);
    //         // After deletion, fetch the list again to reflect changes or remove the user from the state
    //         setUsers(users.filter(user => user.id !== userId));
    //     } catch (error) {
    //         console.error('Failed to delete the user:', error);
    //         setError('Failed to delete the user');
    //     }
    // };


    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="manage-users-content">
            <div className="manage-users-header">
                <h1 className="manage-users-heading">Users Overview</h1>
            </div>
            <table className="manage-users-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>USERNAME</th>
                        <th>EMAIL</th>
                        <th>ROLE</th>
                        <th>ACTIONS</th> {/* Column for actions like delete */}
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.is_superuser ? 'Admin' : 'User'}</td>
                            <td>
                            <button className="button-delete" onClick={() => handleDelete(user.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageUsers;
