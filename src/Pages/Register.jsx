import { useState } from "react";
import axios from '../apiClient.js';
import { useNavigate } from "react-router-dom";
import { Card, InputField, Button, MobileContainer } from '../Components';
import { FiMail, FiShield, FiUserPlus } from 'react-icons/fi';

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/users/register", form);
      navigate("/");
    } catch {
      alert("Registration error");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/15 via-transparent to-secondary/20" aria-hidden />
      <div className="absolute left-1/4 top-12 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-[120px]" aria-hidden />
      <div className="absolute right-1/3 bottom-0 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-[120px]" aria-hidden />

      <MobileContainer className="relative z-10">
        <Card className="!bg-slate-900/80 !backdrop-blur-2xl !border !border-white/10 !rounded-[30px] !shadow-ambient !text-slate-100">
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="chip text-slate-300">Create account</span>
            <div>
              <h2 className="text-3xl font-semibold">Join Sanju MIS</h2>
              <p className="mt-2 text-sm text-slate-400">
                Build collaborative workflows for your operations team in minutes.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <InputField
              label="Full name"
              placeholder="Enter your name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              icon={FiUserPlus}
              required
            />
            <InputField
              label="Work email"
              placeholder="name@company.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              icon={FiMail}
              type="email"
              required
            />
            <InputField
              label="Password"
              placeholder="Create a secure password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              icon={FiShield}
              type="password"
              required
            />

            <Button type="submit" fullWidth rightIcon={FiUserPlus}>
              Create account
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Already have an account? Sign in
            </button>
          </form>
        </Card>
      </MobileContainer>
    </div>
  );
}
