import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const useAutoLogout = (logout, timeout = 60000, hasLoggedOut, setHasLoggedOut) => {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const resetTimer = () => setLastActivity(Date.now());

    const events = ['mousemove', 'keydown', 'click', 'scroll'];

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    const interval = setInterval(() => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (Date.now() - lastActivity >= timeout && !hasLoggedOut && isLoggedIn) {
        Swal.fire({
          title: 'Session Timeout',
          text: 'You have been logged out due to inactivity.',
          icon: 'warning',
          confirmButtonText: 'OK'
        }).then(() => {
          logout();
          navigate('/');
        });
        setHasLoggedOut(true);
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [lastActivity, timeout, logout, navigate, hasLoggedOut, setHasLoggedOut]);

  return;
};

export default useAutoLogout;
