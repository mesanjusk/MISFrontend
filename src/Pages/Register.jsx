import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/users/register", form);
      navigate("/");
    } catch {
      alert("Registration error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <h2 className="mb-4 text-2xl font-bold">Register on BT Planner</h2>
      <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow w-80 flex flex-col gap-4">
        <input placeholder="Name" className="p-2 border rounded" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" className="p-2 border rounded" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" className="p-2 border rounded" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Register</button>
      </form>
    </div>
  );
}
