import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../apiClient.js';
import { Card, InputField, Button, MobileContainer } from '../Components';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';

export default function Login() {
    const navigate = useNavigate();
    const [User_name, setUser_Name] = useState('');
    const [Password, setPassword] = useState('');

    useEffect(() => {
        const loggedInUser = localStorage.getItem('User_name');
        if (loggedInUser) {
            navigate("/home", { state: { id: loggedInUser } });
        }
    }, [navigate]);

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
            } else if (data.status === "invalid") {
                alert("Invalid credentials. Please check your username and password.");
                return;
            }
    
            const userGroup = data.userGroup; 
            const userMob =  data.userMob;
            if (!userGroup) {
                alert("User group not found in API response");
                return;
            }
    
            localStorage.setItem('User_name', User_name);
            localStorage.setItem('User_group', userGroup); 
            localStorage.setItem('Mobile_number', userMob); 
    console.log(userMob);
    console.log(userGroup);

            if (userGroup === "Office User") {
                navigate("/home", { state: { id: User_name } });
            } else if (userGroup === "Admin User") {
                navigate("/home", { state: { id: User_name } });
            } else if (userGroup === "Vendor") {
                navigate("/vendorHome", { state: { id: User_name } });
            } else {
                alert("Invalid user group");
            }
        } catch (e) {
            alert("An error occurred during login. Please try again.");
            console.log(e);
        }
    }
    
    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <MobileContainer>
                <Card>
                    <h1 className="text-xl font-semibold mb-4 text-center flex items-center justify-center"><FiUser className="mr-2" />Login</h1>
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
