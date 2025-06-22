import { useNavigate } from "react-router-dom";
import "./Login.css";
import React, { useState } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import logo from "../../../Images/eLearning.png";
import auth from "../../../Images/auth.png";
import { setUserData } from "../../../redux/userSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const validateForm = () => {
    let isValid = true;
    const errors = {};

    if (!email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      errors.email = "Email address is invalid";
      isValid = false;
    }

    if (password.length < 6) {
      errors.password = "Password should be at least 6 characters long";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const userRegistrationData = {
        email: email,
        password: password,
      };

      fetch(process.env.REACT_APP_BASE_URL + "/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userRegistrationData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && data.status === true) {
            dispatch(setUserData(data?.data?.user));
            localStorage.setItem("user_token", data.data.token);
            localStorage.setItem(
              "student_details",
              JSON.stringify(data.data.student_details)
            );
            toast.success("Login Successful")
            navigate("/");
          } else {
            console.log(data.message);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  return (
    <Container className="login-container" fluid>
      <Row>
        <Col className="left-col" xs={6}>
          <img src={logo} alt="eLearning Logo" className="logo" />
          <div className="register-form h-auto">
            <div className="heading pb-3">
              <h1>Login</h1>
            </div>
            <Form
              className="form"
              onSubmit={handleSubmit}
              style={{ textAlign: "left" }}
            >
              <Form.Group
                className="mb-4"
                controlId="exampleForm.ControlInput1"
              >
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={handleEmailChange}
                />
                {errors.email && <p className="text-danger">{errors.email}</p>}
              </Form.Group>

              <Form.Group
                className="mb-4"
                controlId="exampleForm.ControlInput1"
              >
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                />
                {errors.password && (
                  <p className="text-danger">{errors.password}</p>
                )}
              </Form.Group>

              <button className="orange-btn-white-font w-100 p-2 mt-2">
                Login
              </button>
            </Form>
            <p className="redirect py-3">
              Don't Have An Account?{" "}
              <span
                className="hover underline"
                onClick={() => navigate("/register")}
              >
                Register Here
              </span>
            </p>
          </div>
        </Col>
        <Col xs={6} className="right-col">
          <div className="right-container d-flex justify-content-center align-items-center">
            <img src={auth} alt="Auth"></img>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
