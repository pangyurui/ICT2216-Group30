import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './register.css';
import Cookies from 'js-cookie'; // Import Cookies library

export const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: ''
    });

    const [commonPasswords, setCommonPasswords] = useState([]);
    const [csrfToken, setCsrfToken] = useState('');

    const { username, email, password, first_name, last_name } = formData;

    useEffect(() => {
        const fetchCommonPasswords = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/common-passwords/');
                setCommonPasswords(response.data);
            } catch (error) {
                console.error('Error fetching common passwords:', error);
            }
        };

        // Fetch the CSRF token from the backend
        const fetchCSRFToken = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/get_csrf_token/', {
                    withCredentials: true // Include credentials (cookies)
                });
                const token = Cookies.get('csrftoken'); // Retrieve CSRF token from cookies
                setCsrfToken(token);
            } catch (error) {
                console.error('Failed to fetch CSRF token:', error);
            }
        };

        fetchCommonPasswords();
        fetchCSRFToken();
    }, []);

    const disallowedChars = /[<>"'&]/;

    const sanitizeInput = (input) => {
        return input
            .replace(/<script.*?>.*?<\/script>/gi, '')  // Remove script tags
            .replace(/<.*?>/g, '')                      // Remove all HTML tags
            .replace(/"/g, '')                          // Remove double quotes
            .replace(/'/g, '')                          // Remove single quotes
            .trim();                                    // Remove whitespace from both ends
    };

    const onChange = e => {
        const { name, value } = e.target;
        if (!disallowedChars.test(value)) {
            setFormData({ ...formData, [name]: value });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Character',
                text: 'Special characters like <, >, ", \', and & are not allowed.',
            });
        }
    };

    const validateLength = (input, fieldName) => {
        if (input.length > 255) {
            return `${fieldName} must not exceed 255 characters.`;
        }
        return null;
    };

    const validateUsername = (username) => {
        if (username.trim().length === 0) {
            return "Username is required.";
        }
        if (username.length < 3) {
            return "Username must be at least 3 characters long.";
        }
        return validateLength(username, 'Username');
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.trim().length === 0) {
            return "Email is required.";
        }
        if (!emailRegex.test(email)) {
            return "Invalid email format.";
        }
        return validateLength(email, 'Email');
    };

    const validatePassword = (password) => {
        if (password.length < 8) {
            return "Password must be at least 8 characters long.";
        }
        if (commonPasswords.includes(password)) {
            return "Password is too common. Please choose a more secure password.";
        }
        return validateLength(password, 'Password');
    };

    const validateName = (name, fieldName) => {
        if (name.trim().length === 0) {
            return `${fieldName} is required.`;
        }
        if (name.length < 2) {
            return `${fieldName} must be at least 2 characters long.`;
        }
        return validateLength(name, fieldName);
    };

    const onSubmit = async e => {
        e.preventDefault();

        const usernameError = validateUsername(username);
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        const firstNameError = validateName(first_name, 'First Name');
        const lastNameError = validateName(last_name, 'Last Name');

        if (usernameError || emailError || passwordError || firstNameError || lastNameError) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Input',
                text: usernameError || emailError || passwordError || firstNameError || lastNameError,
            });
            return;
        }

        // Sanitize data before sending to the backend
        const sanitizedData = {
            username: sanitizeInput(username),
            email: sanitizeInput(email),
            password: sanitizeInput(password),
            first_name: sanitizeInput(first_name),
            last_name: sanitizeInput(last_name)
        };

        try {
            const res = await axios.post('http://127.0.0.1:8000/api/register/', sanitizedData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken // Include CSRF token in headers
                },
                withCredentials: true // Include credentials (cookies)
            });
            console.log(res.data);
            Swal.fire({
                icon: 'success',
                title: 'Registration Successful',
                text: 'Your account has been created successfully! Please setup 2 Factor Authentication to login.',
                confirmButtonText: 'Setup 2 Factor Authentication',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/2fa';
                }
            });
        } catch (err) {
            console.error(err.response.data);
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: 'There was an issue creating your account. Please try again.',
            });
        }
    };

    return (
        <div className="register-container">
            <form onSubmit={e => onSubmit(e)} className="register-form">
                <h2>Register</h2>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={username}
                        onChange={e => onChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={e => onChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={e => onChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>First Name</label>
                    <input
                        type="text"
                        name="first_name"
                        value={first_name}
                        onChange={e => onChange(e)}
                        required
                    />
                </div>
                <div>
                    <label>Last Name</label>
                    <input
                        type="text"
                        name="last_name"
                        value={last_name}
                        onChange={e => onChange(e)}
                        required
                    />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
};
