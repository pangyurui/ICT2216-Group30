import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';
import './login.css';
import Cookies from 'js-cookie';

export const TwoFALogin = ({ setAuth }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        otpToken: ''
    });
    const [otpSecret, setOtpSecret] = useState('');
    const [otpProvisioningUri, setOtpProvisioningUri] = useState('');
    const [isOtpSetup, setIsOtpSetup] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const navigate = useNavigate();
    const { username, password, otpToken } = formData;

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

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('https://ict2216group30.store/api/two-factor-login/', { username, password }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                withCredentials: true
            });
            setOtpSecret(res.data.otp_secret);
            setOtpProvisioningUri(res.data.otp_provisioning_uri);
            setIsOtpSetup(true);
        } catch (err) {
            
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Invalid username or password.',
            });
        }
    };

    const onOtpSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('https://ict2216group30.store/api/two-factor-setup/', { username, password, otpToken }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                withCredentials: true
            });
            Swal.fire({
                icon: 'success',
                title: '2FA Setup Successful',
                text: 'Your 2FA setup is complete. You can now login',
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate("/login");
                }
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: '2FA Setup Failed',
                text: 'Invalid OTP token.',
            });
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={isOtpSetup ? onOtpSubmit : onSubmit}>
                <h2>{isOtpSetup ? 'Verify OTP' : 'Login to Setup OTP'}</h2>
                {!isOtpSetup && (
                    <>
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
                    </>
                )}
                {isOtpSetup && (
                    <>
                        <div>
                            <label>Use the QR Code below to set up your OTP on Google Authenticator</label>
                        </div>
                        <div>
                            <QRCode value={otpProvisioningUri} size={256} />
                        </div>
                        <div>
                            <label>OTP Token</label>
                            <input
                                type="text"
                                name="otpToken"
                                value={otpToken}
                                onChange={e => onChange(e)}
                                required
                            />
                        </div>
                    </>
                )}
                <button type="submit">{isOtpSetup ? 'Verify OTP' : 'Login'}</button>
            </form>
        </div>
    );
};
