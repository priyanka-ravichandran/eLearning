import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import React, { useEffect } from "react";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import shell from "../../Images/nav/shell.png";
import qa from "../../Images//qa.png";
import eLearning_horizontal from "../../Images/eLearning_horizontal.png";
import leaderboard from "../../Images/nav/leaderboard.png";
import dummy_profile_picture from "../../Images/dummy_profile_picture.svg";
import { useMyContext } from "../../MyContextProvider";
import { persistor } from "../../redux/store";
import { toast } from "react-toastify";
import UserAvatar from "../UserAvatar";

function Header() {
  const { studentDetails } = useMyContext(); // Removed setStudentDetails
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // Clear all localStorage
    persistor.purge();
    // window.dispatchEvent(new CustomEvent('studentDetailsUpdated', { detail: { value: null } }));
    toast.success("Logout Successful");
    navigate("/login");
  };
  
  // Use context first, fallback to localStorage
  const student_details = studentDetails || JSON.parse(localStorage.getItem("student_details"));

  // Get group points robustly (support both .group and .student.group)
  const groupPoints = student_details?.student?.group?.current_points ?? student_details?.group?.current_points ?? 0;

  // Force re-render when studentDetails change
  useEffect(() => {
    console.log('🔄 Header - Student details updated:', {
      points: studentDetails?.student?.current_points,
      totalPoints: studentDetails?.student?.total_points_earned,
      pointsBreakdown: studentDetails?.student?.points_breakdown,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [studentDetails]);

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
        {student_details?.student?.group || student_details?.group ? (
          <Navbar.Text className="d-flex align-items-center flex-column px-4">
            <span className="points-title">GROUP</span>
            <span className="d-flex align-items-center">
              <img className="options shell" src={shell} alt="Points:" />
              <span className="points">
                {groupPoints}
              </span>
            </span>
          </Navbar.Text>
        ) : null}
        <Navbar.Text className="d-flex align-items-center flex-column px-4">
          <span className="points-title">INDIVIDUAL</span>
          <span className="d-flex align-items-center">
            <img className="options shell" src={shell} alt="Points:" />
            <span className="points">
              {student_details?.student?.current_points || 0}
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
        <Nav.Link className="px-4" as={Link} to="/live-quiz">
          <span role="img" aria-label="quiz">📝</span> Live Quiz
        </Nav.Link>

        <NavDropdown
          className="ps-4"
          title={
            <UserAvatar 
              studentDetails={studentDetails}
              size="32"
              round={true}
              className="options"
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
