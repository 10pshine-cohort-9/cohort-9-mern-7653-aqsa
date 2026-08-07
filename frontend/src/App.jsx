import { useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/auth";

function App() {
  const [isLogin, setIsLogin] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const [profile, setProfile] = useState(null);

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const register = async () => {
    try {
      const res = await axios.post(`${API}/register`, form);

      setMessage(res.data.message);

      localStorage.setItem("token", res.data.token);

      setToken(res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  const login = async () => {
    try {
      const res = await axios.post(`${API}/login`, {
        email: form.email,
        password: form.password,
      });

      setMessage(res.data.message);

      localStorage.setItem("token", res.data.token);

      setToken(res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  const getProfile = async () => {
    try {
      const res = await axios.get(`${API}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(res.data.user);
    } catch (err) {
      setMessage(err.response?.data?.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setProfile(null);
    setMessage("Logged out");
  };

  return (
    <div
      style={{
        maxWidth: 450,
        margin: "40px auto",
        fontFamily: "Arial",
      }}
    >
      <h2>MERN Authentication Test</h2>

      {!isLogin && (
        <>
          <input
            placeholder="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: 10, padding: 10 }}
          />
        </>
      )}

      <input
        placeholder="Email"
        name="email"
        value={form.email}
        onChange={handleChange}
        style={{ width: "100%", marginBottom: 10, padding: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        name="password"
        value={form.password}
        onChange={handleChange}
        style={{ width: "100%", marginBottom: 10, padding: 10 }}
      />

      {!isLogin ? (
        <button onClick={register}>Register</button>
      ) : (
        <button onClick={login}>Login</button>
      )}

      <button
        onClick={() => setIsLogin(!isLogin)}
        style={{ marginLeft: 10 }}
      >
        {isLogin ? "Go Register" : "Go Login"}
      </button>

      <hr />

      <button onClick={getProfile}>Get Profile</button>

      <button
        style={{ marginLeft: 10 }}
        onClick={logout}
      >
        Logout
      </button>

      <button
        style={{ marginLeft: 10 }}
        onClick={() =>
          window.location.href =
            "http://localhost:5000/api/auth/google"
        }
      >
        Google Login
      </button>

      <hr />

      <h3>Message</h3>

      <pre>{message}</pre>

      <h3>Profile</h3>

      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}

export default App;