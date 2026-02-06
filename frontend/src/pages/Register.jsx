import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Gọi sang Backend đang chạy cổng 8081
      const response = await fetch("http://localhost:8081/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.text(); // Backend trả về text "Đăng ký thành công"

      if (response.ok) {
//         alert("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/verify", { state: { email: formData.email } });
      } else {
        setMessage(data); // Hiện lỗi từ backend (ví dụ: Trùng username)
      }
    } catch (error) {
      setMessage("Lỗi kết nối đến server!");
      console.error(error);
    }
  };

  return (
    <div
      className="container"
      style={{ maxWidth: "400px", margin: "50px auto" }}
    >
      <h2>Đăng Ký Tài Khoản</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Username:</label>
          <input
            type="text"
            name="username"
            required
            style={{ width: "100%", padding: "8px" }}
            onChange={handleChange}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            required
            style={{ width: "100%", padding: "8px" }}
            onChange={handleChange}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            required
            style={{ width: "100%", padding: "8px" }}
            onChange={handleChange}
          />
        </div>
        <button
          type="submit"
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Đăng Ký
        </button>
      </form>
      {message && <p style={{ color: "red" }}>{message}</p>}
      <p>
        Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
      </p>
    </div>
  );
}

export default Register;
