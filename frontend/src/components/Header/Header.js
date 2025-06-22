import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import React from "react";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import shell from "../../Images/nav/shell.png";
import qa from "../../Images//qa.png";
import eLearning_horizontal from "../../Images/eLearning_horizontal.png";
import leaderboard from "../../Images/nav/leaderboard.png";
import dummy_profile_picture from "../../Images/dummy_profile_picture.svg";
import { useMyContext } from "../../MyContextProvider";
import { persistor } from "../../redux/store";
import { toast } from "react-toastify";

function Header() {
  const { studentDetails, setStudentDetails } = useMyContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("student_details");
    persistor.purge();
    setStudentDetails(null);
    toast.success("Logout Successful");
    navigate("/login");
  };
  const student_details = JSON.parse(localStorage.getItem("student_details"));

  return (
    <Navbar expand="lg" className="d-flex justify-content-between px-5 header">
      <Nav>
        <Navbar.Brand as={Link} to="/">
          <img
            className="eLearningLogo"
            src={eLearning_horizontal}
            alt="eLearning Logo"
          />
        </Navbar.Brand>
      </Nav>
      <Nav>
        {student_details?.group && (
          <Navbar.Text className="d-flex align-items-center flex-column px-4">
            <span className="points-title">GROUP</span>
            <span className="d-flex align-items-center">
              <img className="options shell" src={shell} alt="Points:" />
              <span className="points">
                {student_details?.group?.current_points}
              </span>
            </span>
          </Navbar.Text>
        )}
        <Navbar.Text className="d-flex align-items-center flex-column px-4">
          <span className="points-title">INDIVIDUAL</span>
          <span className="d-flex align-items-center">
            <img className="options shell" src={shell} alt="Points:" />
            <span className="points">
              {student_details?.student?.current_points}
            </span>
          </span>
        </Navbar.Text>
      </Nav>
      <Nav className="">
        <NavDropdown
          className="px-4"
          title={<img className="options" align="start" src={qa} alt="Q&A" />}
          id="collapsible-nav-dropdown"
        >
          <NavDropdown.Item as={Link} to="/help-friend">
            Help A Friend
          </NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/post-question">
            My Questions
          </NavDropdown.Item>
          {/* <NavDropdown.Item as={Link} to="/">Post A Question</NavDropdown.Item> */}
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={() => navigate("/question")}>
            Question of the Day/Week
          </NavDropdown.Item>
        </NavDropdown>
        <Nav.Link className="px-4" as={Link} to="/leaderboard">
          <img className="options" src={leaderboard} alt="Leaderboard" />
        </Nav.Link>

        <NavDropdown
          className="ps-4"
          title={
            <img
              className="options"
              src={dummy_profile_picture}
              alt="My Profile"
            />
          }
          id="collapsible-nav-dropdown"
        >
          <NavDropdown.Item as={Link} to="/user-profile">My Profile</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item as={Link} to="/">My Village</NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/achievements">
            My Achievements
          </NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
        </NavDropdown>
        <span className="px-3"></span>
      </Nav>
    </Navbar>
  );
}

export default Header;
