import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../apiClient.js';
import { Card, InputField, Button, MobileContainer } from '../Components';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const [User_name, setUser_Name] = useState('');
    const [Password, setPassword] = useState('');
    const { setAuthData, userName, userGroup } = useAuth();

    useEffect(() => {
        if (!userName) return;

        const target = userGroup === "Vendor" ? "/vendorHome" : "/home";
        navigate(target, { replace: true });
    }, [navigate, userGroup, userName]);

    async function submit(e) {
        e.preventDefault();

        try {
            const response = await axios.post("/user/login", {
                User_name,
                Password
            });

            const data = response.data;

            if (data.status === "notexist") {
                alert("User has not signed up");
                return;
            }

            if (data.status === "invalid") {
                alert("Invalid credentials. Please check your username and password.");
                return;
            }

            // ✅ IMPORTANT: Store JWT Token
            if (!data.token) {
                alert("Login successful but token not received from server.");
                console.error("Token missing in response:", data);
                return;
            }

            localStorage.setItem("token", data.token);

            // ✅ Store user info in context
            setAuthData({
                userName: User_name,
                userGroup: data.userGroup,
                mobileNumber: data.userMob,
            });

            const target = data.userGroup === "Vendor" ? "/vendorHome" : "/home";
            navigate(target, { replace: true });

        } catch (error) {
            console.error("Login error:", error);
            alert("An error occurred during login. Please try again.");
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
                            onChange={(e) => setUser_Name(e.target.value)}
                            placeholder="User Name"
                            icon={FiUser}
                            required
                        />
                        <InputField
                            label="Password"
                            type="password"
                            autoComplete="off"
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            icon={FiLock}
                            required
                        />
                        <Button type="submit" className="mt-2" rightIcon={FiLogIn} fullWidth>
                            Submit
                        </Button>
                    </form>
                </Card>
            </MobileContainer>
        </div>
    );
}
