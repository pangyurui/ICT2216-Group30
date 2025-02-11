import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './login.css';
import Cookies from 'js-cookie';

export const Login = ({ setAuth, setHasLoggedOut }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        otp: ''
    });
    const navigate = useNavigate();
    const { username, password, otp } = formData;
    const [csrfToken, setCsrfToken] = useState('');

    useEffect(() => {
        const fetchCSRFToken = async () => {
            try {
                const response = await axios.get('https://ict2216group30.store/api/get_csrf_token/', {
                    withCredentials: true
                });
                const token = Cookies.get('csrftoken');
                setCsrfToken(token);
            } catch (error) {
                
            }
        };

        fetchCSRFToken();
    }, []);

    const disallowedChars = /[<>"'&]/;

    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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

         const escapedData = {
            username: escapeHtml(username.trim()),
            password: escapeHtml(password.trim()),
            otp: escapeHtml(otp.trim())
        };

        try {
            const res = await axios.post('https://ict2216group30.store/api/login/', escapedData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                withCredentials: true
            });
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            localStorage.setItem('isLoggedIn', true);
            localStorage.setItem('username', escapedData.username);
            setAuth(res.data);
            setHasLoggedOut(false);

            if (res.data.is_superuser) {
                navigate("/admin");
            } else {
                navigate("/");
            }

            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: 'Welcome back ' + escapeHtml(username.trim()) + '.',
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
                        name="otp"
                        value={otp}
                        onChange={e => onChange(e)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};
