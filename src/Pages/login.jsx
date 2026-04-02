import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../apiClient.js';
import { Card, InputField, Button, MobileContainer } from '../Components';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { setStoredToken } from '../utils/authStorage';

const BACKEND_BASE =
  import.meta.env.VITE_API_SERVER || 'https://misbackend-e078.onrender.com';

export default function Login() {
  const navigate = useNavigate();
  const [User_name, setUser_Name] = useState('');
  const [Password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuthData, userName, userGroup } = useAuth();

  useEffect(() => {
    if (!userName) return;

    const target = userGroup === 'Vendor' ? '/vendorHome' : '/home';
    navigate(target, { replace: true });
  }, [navigate, userGroup, userName]);

  async function checkGoogleDriveAndRedirect(userGroupValue) {
    try {
      const statusRes = await axios.get('/google-drive/status');
      const connected = !!statusRes?.data?.connected;

      if (!connected) {
        const returnTo =
          userGroupValue === 'Vendor'
            ? `${window.location.origin}/vendorHome`
            : `${window.location.origin}/home`;

        window.location.href = `${BACKEND_BASE}/api/google-drive/connect?returnTo=${encodeURIComponent(returnTo)}`;
        return;
      }

      const target = userGroupValue === 'Vendor' ? '/vendorHome' : '/home';
      navigate(target, { replace: true });
    } catch (error) {
      console.error('Google Drive status check failed:', error);
      const target = userGroupValue === 'Vendor' ? '/vendorHome' : '/home';
      navigate(target, { replace: true });
    }
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/user/login', {
        User_name,
        Password,
      });

      const data = response.data;

      if (data.status === 'notexist') {
        alert('User has not signed up');
        setLoading(false);
        return;
      }

      if (data.status === 'invalid') {
        alert('Invalid credentials. Please check your username and password.');
        setLoading(false);
        return;
      }

      if (!data.token) {
        alert('Login successful but token not received from server.');
        console.error('Token missing in response:', data);
        setLoading(false);
        return;
      }

      setStoredToken(data.token);

      setAuthData({
        userName: User_name,
        userGroup: data.userGroup,
        mobileNumber: data.userMobile || data.userMob || '',
      });

      await checkGoogleDriveAndRedirect(data.userGroup);
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <MobileContainer>
        <Card>
          <h1 className="text-xl font-semibold mb-4 text-center flex items-center justify-center">
            <FiUser className="mr-2" />
            Login
          </h1>

          <form onSubmit={submit}>
            <InputField
              label="User Name"
              autoComplete="off"
              value={User_name}
              onChange={(e) => setUser_Name(e.target.value)}
              placeholder="User Name"
              icon={FiUser}
              required
            />

            <InputField
              label="Password"
              type="password"
              autoComplete="off"
              value={Password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              icon={FiLock}
              required
            />

            <Button
              type="submit"
              className="mt-2"
              rightIcon={FiLogIn}
              fullWidth
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'Submit'}
            </Button>
          </form>
        </Card>
      </MobileContainer>
    </div>
  );
}