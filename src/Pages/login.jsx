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
            const userMob = data.userMob;
            if (!userGroup) {
                alert("User group not found in API response");
                return;
            }

            localStorage.setItem('User_name', User_name);
            localStorage.setItem('User_group', userGroup);
            localStorage.setItem('Mobile_number', userMob);

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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" aria-hidden />
            <div className="absolute -left-32 top-10 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden />
            <div className="absolute -right-32 bottom-10 -z-10 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" aria-hidden />

            <MobileContainer className="relative z-10">
                <Card className="!bg-slate-900/80 !backdrop-blur-2xl !border !border-white/10 !rounded-[30px] !shadow-ambient !text-slate-100">
                    <div className="flex flex-col items-center gap-6 text-center">
                        <span className="chip uppercase tracking-[0.35em] text-slate-300">Sanju MIS</span>
                        <div>
                            <h1 className="text-3xl font-semibold">Welcome back</h1>
                            <p className="mt-2 text-sm text-slate-400">Sign in to orchestrate your business from one modern workspace.</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="mt-8 space-y-5">
                        <InputField
                            label="User name"
                            autoComplete="off"
                            onChange={(e) => setUser_Name(e.target.value)}
                            placeholder="Enter your username"
                            icon={FiUser}
                            required
                        />
                        <InputField
                            label="Password"
                            type="password"
                            autoComplete="off"
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            icon={FiLock}
                            required
                        />
                        <Button type="submit" className="mt-3" rightIcon={FiLogIn} fullWidth>
                            Sign in
                        </Button>
                    </form>
                </Card>
            </MobileContainer>
        </div>
    );
}
