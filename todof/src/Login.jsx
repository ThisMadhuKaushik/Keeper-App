import "./Login.css"
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
const API = import.meta.env.VITE_API_URL;
export default function Login() {
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const  handleSubmit = async (e) => {
    e.preventDefault();
     setError("");

    try {
     const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid credentials");
        return;
      }

      // ✅ Save JWT token to localStorage
      localStorage.setItem("token", data.token);
       localStorage.setItem("user_id", data.user_id);
       localStorage.setItem("username",data.username);
      alert("Login successful!");
      console.log("JWT:", data.token);
      console.log("user_id",data.user_id)
      // redirect to dashboard (example) 
      navigate('/home')
    } catch (err) {
      console.error(err);
      setError("Something went wrong, please try again!");
    }
    // Simple local check (you can replace with backend API call)
    // if (user === 'admin' && pass === '1234') {
    //   navigate('/home'); // Redirect after successful login
    // } else {
    //   alert('Invalid credentials!');
    // } 
    

  };

  return (
    <div id={"lg"} style={{ textAlign: 'center', paddingTop: '100px' }}>
      <h2>Login Page</h2>
      <form onSubmit={handleSubmit} >
        <input 
          type="email" 
          placeholder="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br /><br />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br /><br />
        <button type="submit">Login</button>
      </form>
      <p>
  Don’t have an account? <Link to="/signup">Sign up here</Link>
</p>
    </div>
  );
}