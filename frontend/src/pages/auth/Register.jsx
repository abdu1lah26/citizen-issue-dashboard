import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(form);
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="page-header">
          <h1>Create Account</h1>
          <p>Register to report and track issues</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              placeholder="Enter your full name"
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              placeholder="Enter your phone number"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="Create a password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="submit">Create Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
