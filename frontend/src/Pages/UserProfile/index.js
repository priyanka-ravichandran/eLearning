import React, { useEffect, useState } from "react";
import { Card, Button, Tab, Nav, Form, Row, Col, Alert, Spinner, Toast, ToastContainer } from "react-bootstrap";
import Avatar from "react-avatar";
import "./index.css";

const API_BASE = "http://localhost:3000";

const UserProfile = () => {
  // Initial student details from localStorage
  const [studentDetails, setStudentDetails] = useState(() =>
    JSON.parse(localStorage.getItem("student_details"))
  );
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Create group form
  const [groupName, setGroupName] = useState("");
  // Join group form
  const [joinCode, setJoinCode] = useState("");

  // Fetch latest student details on mount
  useEffect(() => {
    fetchStudentDetails();
    // eslint-disable-next-line
  }, []);

  const fetchStudentDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const student_details123 = JSON.parse(localStorage.getItem("student_details"));
      const res = await fetch(`${API_BASE}/student/get_student_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: student_details123.student._id }),
      });
      const data = await res.json();
      if (data.success) {
        setStudentDetails(data.data);
        localStorage.setItem("student_details", JSON.stringify(data.data));
      } else {
        setError(data.message || "Failed to fetch profile.");
      }
    } catch (err) {
      setError("Failed to fetch profile.");
    }
    setLoading(false);
  };

  // Create group handler
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/group/create_group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          student_id_1: studentDetails.student._id,
          student_id_2: null,
          student_id_3: null,
        }),
      });
      const data = await res.json();
      if (data.success || data.status) {
        setSuccess(data.message || "Group created successfully!");
        setShowSuccess(true);
        fetchStudentDetails();
        setGroupName("");
        setActiveTab("group");
      } else {
        setError(data.message || "Failed to create group.");
        setShowError(true);
      }
    } catch (err) {
      setError("Failed to create group.");
      setShowError(true);
    }
    setGroupActionLoading(false);
  };

  // Join group handler
  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setGroupActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/group/join_group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: joinCode,
          student_id: studentDetails.student._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Joined group successfully!");
        setShowSuccess(true);
        fetchStudentDetails();
        setJoinCode("");
        setActiveTab("group");
      } else {
        setError(data.message || "Failed to join group.");
        setShowError(true);
      }
    } catch (err) {
      setError("Failed to join group.");
      setShowError(true);
    }
    setGroupActionLoading(false);
  };

  // Exit group handler
  const handleExitGroup = async () => {
    if (!window.confirm("Are you sure you want to exit the group?")) return;
    setGroupActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/group/exit_group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: studentDetails.group._id,
          student_id: studentDetails.student._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Exited group successfully!");
        setShowSuccess(true);
        fetchStudentDetails();
        setActiveTab("profile");
      } else {
        setError(data.message || "Failed to exit group.");
        setShowError(true);
      }
    } catch (err) {
      setError("Failed to exit group.");
      setShowError(true);
    }
    setGroupActionLoading(false);
  };

  // Helper: Render group members
  const renderGroupMembers = (members) =>
    members.map((m, idx) => (
      <span key={m._id}>
        {m.name}
        {idx < members.length - 1 ? ", " : ""}
      </span>
    ));

  return (
    <>
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <Card className="shadow-lg rounded-4 p-4">
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="profile" className="fw-bold">
                Profile
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="group" className="fw-bold">
                Group
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            {/* Profile Tab */}
            <Tab.Pane eventKey="profile">
              <Row className="align-items-center">
                <Col xs={12} md={4} className="text-center mb-3">
                  <Avatar
                    name={studentDetails?.student?.name || "User"}
                    size="90"
                    round
                    color="#267c5d"
                  />
                  <h5 className="mt-3 mb-0 fw-bold">
                    {studentDetails?.student?.name}
                  </h5>
                  <div className="text-muted">{studentDetails?.student?.email}</div>
                </Col>
                <Col xs={12} md={8}>
                  <Row className="mb-2">
                    <Col xs={6}>
                      <div className="text-secondary small">Grade</div>
                      <div className="fw-semibold">{studentDetails?.student?.grade}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-secondary small">Individual Rank</div>
                      <div className="fw-semibold">{studentDetails?.student?.individual_rank ?? "-"}</div>
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={6}>
                      <div className="text-secondary small">Current Points</div>
                      <div className="fw-semibold">{studentDetails?.student?.current_points}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-secondary small">Total Points Earned</div>
                      <div className="fw-semibold">{studentDetails?.student?.total_points_earned}</div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Tab.Pane>

            {/* Group Tab */}
            <Tab.Pane eventKey="group">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : (
                <>
                  {/* If user is in a group */}
                  {studentDetails?.group ? (
                    <Card className="mt-2 shadow-sm border-0">
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                          <Avatar
                            name={`Group ${studentDetails.group.group_no}`}
                            size="64"
                            round
                            color="#b2dfdb"
                            fgColor="#267c5d"
                          />
                          <div className="ms-3">
                            <h5 className="mb-1 fw-bold">
                              Group #{studentDetails.group.group_no}
                            </h5>
                            <div className="text-muted small">
                              Village Level: {studentDetails.group.village_level}
                            </div>
                          </div>
                        </div>
                        <Row className="mb-2">
                          <Col xs={6}>
                            <div className="text-secondary small">Group Rank</div>
                            <div className="fw-semibold">{studentDetails.group.group_rank ?? "-"}</div>
                          </Col>
                          <Col xs={6}>
                            <div className="text-secondary small">Current Points</div>
                            <div className="fw-semibold">{studentDetails.group.current_points}</div>
                          </Col>
                        </Row>
                        <Row className="mb-2">
                          <Col xs={6}>
                            <div className="text-secondary small">Total Points Earned</div>
                            <div className="fw-semibold">{studentDetails.group.total_points_earned}</div>
                          </Col>
                          <Col xs={6}>
                            <div className="text-secondary small">Village Level</div>
                            <div className="fw-semibold">{studentDetails.group.village_level}</div>
                          </Col>
                        </Row>
                        <div className="mb-2">
                          <div className="text-secondary small">Team Members</div>
                          <div className="fw-semibold">
                            {renderGroupMembers(studentDetails.group.team_members)}
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          className="mt-3"
                          onClick={handleExitGroup}
                          disabled={groupActionLoading}
                        >
                          {groupActionLoading ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            "Exit Group"
                          )}
                        </Button>
                      </Card.Body>
                    </Card>
                  ) : (
                    // If user is not in a group: show create/join
                    <Row>
                      <Col md={6} className="mb-4">
                        <Card className="shadow-sm border-0">
                          <Card.Body>
                            <h5 className="fw-bold mb-3">Create Group</h5>
                            <Form onSubmit={handleCreateGroup}>
                              <Form.Group className="mb-3">
                                <Form.Label>Group Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="Enter group name"
                                  value={groupName}
                                  onChange={(e) => setGroupName(e.target.value)}
                                  required
                                />
                              </Form.Group>
                              <Button
                                variant="success"
                                type="submit"
                                className="w-100"
                                disabled={groupActionLoading}
                              >
                                {groupActionLoading ? (
                                  <Spinner size="sm" animation="border" />
                                ) : (
                                  "Create Group"
                                )}
                              </Button>
                            </Form>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6} className="mb-4">
                        <Card className="shadow-sm border-0">
                          <Card.Body>
                            <h5 className="fw-bold mb-3">Join Group</h5>
                            <Form onSubmit={handleJoinGroup}>
                              <Form.Group className="mb-3">
                                <Form.Label>Group Code</Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="Enter group code"
                                  value={joinCode}
                                  onChange={(e) => setJoinCode(e.target.value)}
                                  required
                                />
                              </Form.Group>
                              <Button
                                variant="primary"
                                type="submit"
                                className="w-100"
                                disabled={groupActionLoading}
                              >
                                {groupActionLoading ? (
                                  <Spinner size="sm" animation="border" />
                                ) : (
                                  "Join Group"
                                )}
                              </Button>
                            </Form>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}
                </>
              )}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Card>
    </div>
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast
        bg="danger"
        show={showError}
        onClose={() => setShowError(false)}
        delay={4000}
        autohide
      >
        <Toast.Header>
          <strong className="me-auto text-danger">Error</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{error}</Toast.Body>
      </Toast>
      <Toast
        bg="success"
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        delay={3000}
        autohide
      >
        <Toast.Header>
          <strong className="me-auto text-success">Success</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{success}</Toast.Body>
      </Toast>
    </ToastContainer>
  </>
  );
};

export default UserProfile;