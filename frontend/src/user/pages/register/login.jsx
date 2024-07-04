import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './login.css';
import Cookies from 'js-cookie'; // Import Cookies library

export const Login = ({ setAuth, setHasLoggedOut }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        otp: '' // Add OTP password to state
    });
    const navigate = useNavigate();
    const { username, password, otp } = formData; // Destructure otp
    const [csrfToken, setCsrfToken] = useState('');

    useEffect(() => {
        const fetchCSRFToken = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/get_csrf_token/', {
                    withCredentials: true // Important: include credentials (cookies)
                });
                const token = Cookies.get('csrftoken'); // Retrieve CSRF token from cookies
                setCsrfToken(token);
            } catch (error) {
                console.error('Failed to fetch CSRF token:', error);
            }
        };

        fetchCSRFToken();
    }, []); // Run once on component mount

    const disallowedChars = /[<>"'&]/;

    const sanitizeInput = (input) => {
        return input
            .replace(/<script.*?>.*?<\/script>/gi, '')  // Remove script tags
            .replace(/<[^>]+>/g, '')                    // Remove all HTML tags
            .replace(/"/g, '')                          // Remove double quotes
            .replace(/'/g, '')                          // Remove single quotes
            .trim();                                    // Remove whitespace from both ends
    };

    const validateLength = (input, fieldName, maxLength) => {
        if (input.length > maxLength) {
            return `${fieldName} must not exceed ${maxLength} characters.`;
        }
        return null;
    };

    const validateUsername = (username) => {
        if (username.trim().length === 0) {
            return "Username is required.";
        }
        return validateLength(username, 'Username', 255);
    };

    const validatePassword = (password) => {
        if (password.trim().length === 0) {
            return "Password is required.";
        }
        return validateLength(password, 'Password', 255);
    };

    const validateOtp = (otp) => {
        if (otp.trim().length === 0) {
            return "OTP Password is required.";
        }
        if (otp.length !== 6) {
            return "OTP Password must be exactly 6 characters long.";
        }
        return null;
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

    const onSubmit = async e => {
        e.preventDefault();

        const usernameError = validateUsername(username);
        const passwordError = validatePassword(password);
        const otpError = validateOtp(otp);

        if (usernameError || passwordError || otpError) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Input',
                text: usernameError || passwordError || otpError,
            });
            return;
        }

        // Sanitize data before sending to the backend
        const sanitizedData = {
            username: sanitizeInput(username),
            password: sanitizeInput(password),
            otp: sanitizeInput(otp)
        };

        try {
            const res = await axios.post('http://127.0.0.1:8000/api/login/', sanitizedData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken // Include CSRF token in headers
                },
                withCredentials: true // Important: include credentials (cookies)
            });
            // Save the JWT token to localStorage
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            localStorage.setItem('isLoggedIn', true);
            // axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
            setAuth(res.data);

            // Reset hasLoggedOut to false upon successful login
            setHasLoggedOut(false);

            // Check if user is admin and navigate accordingly
            if (res.data.is_superuser) {
                navigate("/admin");
            } else {
                navigate("/");
            }

            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: 'Welcome back ' + username + '.',
            });
        } catch (err) {
            if (err.response && err.response.status === 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Access Denied',
                    text: 'You do not have permission to perform this action.',
                });
                navigate("/");
            } else {
                console.error(err.response.data);
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: 'Invalid username, password, or OTP password.',
                });
            }
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={e => onSubmit(e)}>
                <h2>Login</h2>
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
                    <label>OTP Password</label>
                    <input
                        type="text"
                        name="otp" // Name should match the state key
                        value={otp} // Bind value to otp
                        onChange={e => onChange(e)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};
