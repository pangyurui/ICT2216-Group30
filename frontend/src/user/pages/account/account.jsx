import React, { useState, useEffect } from 'react';
import { axiosAuth } from '../../../utils/axiosAuth';
import Swal from 'sweetalert2';
import './account.css';

export const Account = ({ setAuth }) => {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: ''
    });

    useEffect(() => {
        axiosAuth.get('account/')
            .then(res => {
                setUser(res.data);
                setFormData({
                    username: res.data.username,
                    email: res.data.email,
                    first_name: res.data.first_name,
                    last_name: res.data.last_name,
                    password: ''
                });
            })
            .catch(err => {});
    }, []);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();

        const updatedData = { ...formData };
        
        if (!updatedData.password) {
            delete updatedData.password;
        }

        try {
            const res = await axiosAuth.put('account/update/', updatedData);
            setUser(res.data);

            Swal.fire({
                title: 'Update Successful',
                html: `
                    <p>Username: ${res.data.username}</p>
                    <p>Email: ${res.data.email}</p>
                    <p>First Name: ${res.data.first_name}</p>
                    <p>Last Name: ${res.data.last_name}</p>
                `,
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } catch (err) {
            
        }
    };

    const onDelete = async () => {
    const csrfToken = localStorage.getItem('csrftoken');

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axiosAuth.delete('account/delete/', {
                    headers: {
                        'X-CSRFToken': csrfToken
                    }
                });

                    setAuth(null);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('isLoggedIn');

                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Your account has been deleted.',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.href = '/';
                    });
                } catch (err) {
                    
                }
            }
        });
    };

    return (
        <div className="account-container">
            <h2>Account Details</h2>
            {user && (
                <div className="account-container">
                    <form className="account-form" onSubmit={onSubmit}>
                        <div>
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div>
                            <label>First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div>
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div>
                            <label>Password (leave blank to keep current password)</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={onChange}
                            />
                        </div>
                        <button type="submit">Update</button>
                    </form>
                    <button className="delete-button" onClick={onDelete}>Delete Account</button>
                </div>
            )}
            
        </div>
    );
};
