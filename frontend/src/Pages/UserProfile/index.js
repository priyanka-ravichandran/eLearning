import React, { useEffect, useState, useCallback } from "react";
import { Card, Button, Tab, Nav, Form, Row, Col, Alert, Spinner, Toast, ToastContainer } from "react-bootstrap";
import Avatar from "react-avatar";
import AvatarShop from "../../components/AvatarShop";
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
  const [showCopied, setShowCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [groupId, setGroupId] = useState(() => localStorage.getItem("group_id"));
  const [groupDetails, setGroupDetails] = useState(null);
  const [showAvatarShop, setShowAvatarShop] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  // Update avatar data when student details change
  const updateAvatarData = useCallback((studentData) => {
    if (studentData?.student?.avatar) {
      const avatar = studentData.student.avatar;
      const baseUrl = 'https://api.dicebear.com/9.x/personas/svg';
      const params = new URLSearchParams();
      
      if (avatar.seed) params.append('seed', avatar.seed);
      if (avatar.hair) params.append('hair', avatar.hair);
      if (avatar.eyes) params.append('eyes', avatar.eyes);
      if (avatar.facialHair) params.append('facialHair', avatar.facialHair);
      if (avatar.mouth) params.append('mouth', avatar.mouth);
      if (avatar.body) params.append('body', avatar.body);
      
      setAvatarUrl(`${baseUrl}?${params.toString()}`);
    }
  }, []);

  // Helper: Refresh student details from backend and update state/localStorage
  const refreshStudentDetails = async () => {
    try {
      console.log("🔄 UserProfile: Refreshing student details...");
      const res = await fetch(`${API_BASE}/student/get_student_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentDetails.student._id }),
      });
      const data = await res.json();
      console.log("🔄 UserProfile: Received refreshed student details:", data);
      
      if (data.status && data.data && data.data.student) {
        const newStudentDetails = { student: data.data.student };
        localStorage.setItem("student_details", JSON.stringify(newStudentDetails));
        setStudentDetails(newStudentDetails);
        
        // Don't clear groupDetails if we still have a group - prevent race condition
        if (data.data.student.group && (data.data.student.group._id || data.data.student.group.id)) {
          const studentGroupId = data.data.student.group._id || data.data.student.group.id;
          console.log("✅ UserProfile: Student still has group after refresh:", data.data.student.group);
          console.log("✅ UserProfile: Student group ID:", studentGroupId);
          
          // Always fetch full group details instead of using the partial group object from student endpoint
          // This ensures we have leader info, village level, etc.
          if (!groupDetails || (groupDetails._id || groupDetails.id) !== studentGroupId) {
            console.log("🔄 UserProfile: Group changed or missing details, fetching full group details");
            // Store the group ID in localStorage if not already there
            if (!localStorage.getItem("group_id")) {
              localStorage.setItem("group_id", studentGroupId);
              setGroupId(studentGroupId);
            }
            // Fetch complete group details instead of using partial data
            fetchGroupDetails(studentGroupId);
          } else {
            console.log("✅ UserProfile: Group details already match, no need to refetch");
          }
        } else {
          console.log("❌ UserProfile: Student no longer has group after refresh");
          setGroupDetails(null);
        }
        
        // Trigger custom event to notify other components
        window.dispatchEvent(new CustomEvent('localStorageUpdate', {
          detail: {
            key: 'student_details',
            value: JSON.stringify(newStudentDetails)
          }
        }));
        
        // Also trigger group update event for immediate UI refresh
        window.dispatchEvent(new CustomEvent('groupStatusChanged', {
          detail: {
            hasGroup: !!(data.data.student.group && data.data.student.group._id),
            groupData: data.data.student.group || null
          }
        }));
        
        // Update avatar data
        updateAvatarData(newStudentDetails);
        
        console.log("🔄 Student details refreshed and broadcasted", newStudentDetails);
        console.log("🏆 Group status:", data.data.student.group ? "Has group" : "No group");
      }
    } catch (err) {
      console.error("Error refreshing student details:", err);
    }
  };

  // Update avatar data when student details change
  useEffect(() => {
    if (studentDetails?.student) {
      updateAvatarData(studentDetails);
      console.log('Student Details Avatar:', studentDetails.student.avatar);
      console.log('User Points:', studentDetails.student.current_points);
    }
  }, [studentDetails, updateAvatarData]);

  // Fetch latest student details on mount
  useEffect(() => {
    // On mount, always fetch latest student details from backend and update state/localStorage
    const fetchAndSyncStudent = async () => {
      const student_details_local = JSON.parse(localStorage.getItem("student_details"));
      if (student_details_local && student_details_local.student && student_details_local.student._id) {
        try {
          console.log("🔄 UserProfile: Initial fetch of student details on mount");
          const res = await fetch(`${API_BASE}/student/get_student_details`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: student_details_local.student._id }),
          });
          const data = await res.json();
          console.log("🔄 UserProfile: Initial student details response:", data);
          
          if (data.status && data.data && data.data.student) {
            const newStudentDetails = { student: data.data.student };
            localStorage.setItem("student_details", JSON.stringify(newStudentDetails));
            setStudentDetails(newStudentDetails);
            
            // Set group details immediately if available to prevent flickering
            if (data.data.student.group && data.data.student.group._id) {
              console.log("✅ UserProfile: Setting initial group details:", data.data.student.group);
              setGroupDetails(data.data.student.group);
              setGroupId(data.data.student.group._id);
              localStorage.setItem("group_id", data.data.student.group._id);
            }
          }
        } catch (err) {
          console.error("Error in initial student fetch:", err);
          // Optionally handle error
        }
      }
    };
    fetchAndSyncStudent();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Always sync groupId from backend studentDetails
    console.log("🔍 UserProfile: Syncing groupId from studentDetails", studentDetails);
    if (studentDetails && studentDetails.student && studentDetails.student.group && studentDetails.student.group._id) {
      console.log("✅ UserProfile: Found group in studentDetails", studentDetails.student.group);
      if (groupId !== studentDetails.student.group._id) {
        console.log("🔄 UserProfile: Updating groupId", studentDetails.student.group._id);
        setGroupId(studentDetails.student.group._id);
        localStorage.setItem("group_id", studentDetails.student.group._id);
      }
      // Always set group details from studentDetails to ensure they're current
      setGroupDetails(studentDetails.student.group);
    } else {
      console.log("❌ UserProfile: No group found in studentDetails");
      console.log("📊 UserProfile: studentDetails structure:", {
        exists: !!studentDetails,
        hasStudent: !!(studentDetails?.student),
        hasGroup: !!(studentDetails?.student?.group),
        hasGroupId: !!(studentDetails?.student?.group?._id)
      });
      // Only clear if we're sure there's no group AND studentDetails is fully loaded
      if (studentDetails && studentDetails.student && studentDetails.student.hasOwnProperty('group') && !studentDetails.student.group) {
        console.log("🗑️ UserProfile: Confirmed no group, clearing state");
        setGroupId(null);
        setGroupDetails(null);
        localStorage.removeItem("group_id");
      }
    }
  }, [studentDetails]);

  useEffect(() => {
    console.log("🔍 UserProfile: groupId changed:", groupId);
    if (groupId && !groupDetails) {
      console.log("✅ UserProfile: Fetching group details for groupId:", groupId);
      fetchGroupDetails(groupId);
    } else if (!groupId && groupDetails) {
      console.log("❌ UserProfile: No groupId, clearing groupDetails");
      setGroupDetails(null);
    }
    // eslint-disable-next-line
  }, [groupId]);

  // Debug: Monitor groupDetails changes
  useEffect(() => {
    console.log("🔍 UserProfile: groupDetails changed:", groupDetails);
    console.log("🔍 UserProfile: groupDetails type:", typeof groupDetails);
    if (groupDetails) {
      console.log("✅ UserProfile: Group details available:", {
        id: groupDetails._id,
        name: groupDetails.name,
        code: groupDetails.code
      });
    } else {
      console.log("❌ UserProfile: Group details is null/undefined");
    }
  }, [groupDetails]);

  // Listen for group status changes from other components
  useEffect(() => {
    const handleGroupStatusChange = (event) => {
      console.log("🔄 UserProfile: Group status changed event received:", event.detail);
      if (event.detail.hasGroup && event.detail.groupData) {
        console.log("✅ UserProfile: Setting group details from event:", event.detail.groupData);
        setGroupDetails(event.detail.groupData);
        setGroupId(event.detail.groupData._id);
        localStorage.setItem("group_id", event.detail.groupData._id);
      } else if (!event.detail.hasGroup) {
        console.log("❌ UserProfile: Clearing group details from event");
        setGroupDetails(null);
        setGroupId(null);
        localStorage.removeItem("group_id");
      }
      // Refresh student details to ensure consistency
      refreshStudentDetails();
    };

    const handleLocalStorageUpdate = (event) => {
      console.log("🔄 UserProfile: LocalStorage update event received:", event.detail);
      if (event.detail.key === 'student_details') {
        const newStudentDetails = JSON.parse(event.detail.value);
        setStudentDetails(newStudentDetails);
        // Don't clear groupDetails unnecessarily - let the studentDetails useEffect handle it
      }
    };

    // Add event listeners
    window.addEventListener('groupStatusChanged', handleGroupStatusChange);
    window.addEventListener('localStorageUpdate', handleLocalStorageUpdate);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('groupStatusChanged', handleGroupStatusChange);
      window.removeEventListener('localStorageUpdate', handleLocalStorageUpdate);
    };
  }, []);

  const fetchStudentDetails = async () => {
    setLoading(true);
    setError("");
    try {
      // Get student details from localStorage
      const student_details_local = JSON.parse(localStorage.getItem("student_details"));
      if (!student_details_local || !student_details_local.student || !student_details_local.student._id) {
        setError("No student found in local storage.");
        setShowError(true);
        setLoading(false);
        return;
      }
      // Fetch group details for this student (contains both student and group)
      const groupRes = await fetch(`${API_BASE}/group/get_group_by_student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: student_details_local.student._id }),
      });
      // Optionally update studentDetails here if needed
    } catch (err) {
      setError("Failed to fetch profile.");
      setShowError(true);
    }
    setLoading(false);
  };

  const fetchGroupDetails = async (id) => {
    console.log("🔍 UserProfile: fetchGroupDetails called with id:", id);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/group/get_group_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: id }),
      });
      const data = await res.json();
      console.log("🔍 UserProfile: fetchGroupDetails response:", data);
      
      if (data.status && data.data && data.data.group) {
        // Check if group object is accessible and valid
        if (typeof data.data.group !== "object" || data.data.group === null) {
          console.log("❌ UserProfile: Invalid group data received:", data.data.group);
          console.error("Invalid group data received:", data.data.group);
          setError("Group details are not accessible.");
          setShowError(true);
          // Don't set groupDetails to null here - keep existing data if valid
        } else {
          console.log("✅ UserProfile: Successfully fetched group details:", data.data.group);
          setGroupDetails(data.data.group);
          setError("");
          setShowError(false);
        }
      } else {
        console.log("❌ UserProfile: Failed to fetch group details:", data.message);
        setError(data.message || "Failed to fetch group details.");
        setShowError(true);
        // Only set to null if we're sure the group doesn't exist
        if (data.message && (data.message.includes("not found") || data.message.includes("does not exist"))) {
          setGroupDetails(null);
        }
      }
    } catch (err) {
      console.error("❌ UserProfile: Error fetching group details:", err);
      setError("Failed to fetch group details.");
      setShowError(true);
      // Don't clear groupDetails on network errors - keep existing data
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
        let passcodeMsg = "";
        if (data.data && data.data.group && data.data.group.code) {
          passcodeMsg = ` Passcode: ${data.data.group.code}`;
        }
        setSuccess((data.message || "Group created successfully!") + passcodeMsg);
        setShowSuccess(true);
        if (data.data && data.data.group && (data.data.group._id || data.data.group.id)) {
          const newGroupId = data.data.group._id || data.data.group.id;
          localStorage.setItem("group_id", newGroupId);
          setGroupId(newGroupId);
          // Fetch complete group details instead of using partial data from create response
          console.log("🔄 UserProfile: Group created, fetching complete group details");
          fetchGroupDetails(newGroupId);
        }
        setGroupName("");
        setActiveTab("group");
        await refreshStudentDetails(); // <-- Refresh student details
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
      if (data.success || data.status) {
        let passcodeMsg = "";
        if (data.data && data.data.group && data.data.group.code) {
          passcodeMsg = ` Passcode: ${data.data.group.code}`;
        }
        setSuccess("Joined group successfully!" + passcodeMsg);
        setShowSuccess(true);
        if (data.data && data.data.group && data.data.group._id) {
          localStorage.setItem("group_id", data.data.group._id);
          setGroupId(data.data.group._id);
          // Directly set group details from response to avoid race condition
          setGroupDetails(data.data.group);
        }
        setJoinCode("");
        setActiveTab("group");
        await refreshStudentDetails(); // <-- Refresh student details
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
          group_id: groupId,
          student_id: studentDetails.student._id,
        }),
      });
      const data = await res.json();
      if (data.success || data.status) {
        setSuccess("Exited group successfully!");
        setShowSuccess(true);
        localStorage.removeItem("group_id");
        setGroupId(null);
        setGroupDetails(null);
        setActiveTab("profile");
        await refreshStudentDetails(); // <-- Refresh student details
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

  const handleSharePasscode = () => {
    if (groupDetails && groupDetails.code) {
      navigator.clipboard.writeText(groupDetails.code);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const handleSendEmail = () => {
    if (!groupDetails?.code) return;

    const subject = 'Join my group on eLearning!';
    const body = `Join "${groupDetails.name}" using passcode: ${groupDetails.code}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Track if email client launched successfully
    let emailLaunched = false;

    // Method 1: Direct window.location (works in most cases)
    try {
      window.location.href = mailtoUrl;
      emailLaunched = true;
    } catch (e) {
      console.log("Direct method failed", e);
    }

    // Method 2: Iframe fallback with longer timeout
    setTimeout(() => {
      if (!emailLaunched) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = mailtoUrl;
        document.body.appendChild(iframe);

        setTimeout(() => {
          document.body.removeChild(iframe);

          // Only show error if nothing happened after 3 seconds total
          if (!emailLaunched) {
            navigator.clipboard.writeText(`${subject}\n\n${body}`);
            setShowCopied(true);
            setError('Email client not responding - invitation copied to clipboard');
            setShowError(true);
          }
        }, 2000); // Additional 2 seconds for iframe method
      }
    }, 1000); // Initial 1 second delay
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
              {/* Profile Tab - Updated with Avatar */}
              <Tab.Pane eventKey="profile">
                <Row className="align-items-center">
                  <Col xs={12} md={4} className="text-center mb-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="User Avatar"
                        style={{
                          width: "90px",
                          height: "90px",
                          borderRadius: "50%",
                          border: "3px solid #267c5d",
                          objectFit: "cover"
                        }}
                      />
                    ) : (
                      <Avatar
                        name={studentDetails?.student?.name || "User"}
                        size="90"
                        round
                        color="#267c5d"
                      />
                    )}
                    <h5 className="mt-3 mb-2 fw-bold">
                      {studentDetails?.student?.name}
                    </h5>
                    <div className="text-muted mb-3">{studentDetails?.student?.email}</div>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowAvatarShop(true)}
                      className="customize-avatar-btn"
                    >
                      🎭 Customize Avatar
                    </Button>
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
                    
                    {/* Points Breakdown */}
                    {studentDetails?.student?.points_breakdown && (
                      <Row className="mb-3">
                        <Col xs={12}>
                          <div className="text-secondary small mb-2">Points Breakdown</div>
                          <div className="points-breakdown">
                            {studentDetails.student.points_breakdown.llm_score_points > 0 && (
                              <div className="d-flex justify-content-between align-items-center py-1">
                                <span className="small">Q&A Evaluation</span>
                                <span className="fw-semibold">{studentDetails.student.points_breakdown.llm_score_points}</span>
                              </div>
                            )}
                            {studentDetails.student.points_breakdown.question_posting_points > 0 && (
                              <div className="d-flex justify-content-between align-items-center py-1">
                                <span className="small">Question Posting</span>
                                <span className="fw-semibold">{studentDetails.student.points_breakdown.question_posting_points}</span>
                              </div>
                            )}
                            {studentDetails.student.points_breakdown.reaction_points > 0 && (
                              <div className="d-flex justify-content-between align-items-center py-1">
                                <span className="small">Reactions</span>
                                <span className="fw-semibold">{studentDetails.student.points_breakdown.reaction_points}</span>
                              </div>
                            )}
                            {studentDetails.student.points_breakdown.daily_challenge_points > 0 && (
                              <div className="d-flex justify-content-between align-items-center py-1">
                                <span className="small">Daily Challenges</span>
                                <span className="fw-semibold">{studentDetails.student.points_breakdown.daily_challenge_points}</span>
                              </div>
                            )}
                            {studentDetails.student.points_breakdown.individual_daily_question_points > 0 && (
                              <div className="d-flex justify-content-between align-items-center py-1">
                                <span className="small">🧮 Daily Math Questions</span>
                                <span className="fw-semibold">{studentDetails.student.points_breakdown.individual_daily_question_points}</span>
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>
                    )}
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Group Tab - Remains exactly the same */}
              <Tab.Pane eventKey="group">
                {/* Debug: Log current state before rendering */}
                {console.log("🎨 UserProfile: Rendering group tab - groupDetails:", groupDetails, "loading:", loading)}
                {console.log("🎨 UserProfile: groupDetails._id:", groupDetails?._id, "groupDetails.id:", groupDetails?.id)}
                {console.log("🎨 UserProfile: typeof groupDetails:", typeof groupDetails)}
                {console.log("🎨 UserProfile: groupDetails keys:", groupDetails ? Object.keys(groupDetails) : "null")}
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="success" />
                  </div>
                ) : (
                  <>
                    {groupDetails && (groupDetails._id || groupDetails.id) ? (
                      <Card className="mt-2 shadow-sm border-0">
                        <Card.Body>
                          <div className="d-flex align-items-center mb-3 justify-content-between">
                            <div className="d-flex align-items-center">
                              <Avatar
                                name={groupDetails.name ? groupDetails.name : `Group ${groupDetails.group_no}`}
                                size="64"
                                round
                                color="#b2dfdb"
                                fgColor="#267c5d"
                              />
                              <div className="ms-3">
                                <h5 className="mb-1 fw-bold">
                                  {groupDetails.name ? groupDetails.name : `Group #${groupDetails.group_no}`}
                                </h5>
                                <div className="text-muted small">
                                  Village Level: {groupDetails.village_level}
                                  {groupDetails.leader && (
                                    <span className="ms-2">
                                      • Leader: <span className="fw-semibold">{groupDetails.leader.name || 'Unknown'}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="text-secondary small mt-1 d-flex align-items-center">
                                <strong>Passcode:</strong> <span className="fw-semibold ms-1">{groupDetails.code}</span>
                                <button
                                  className="btn btn-link p-0 ms-2"
                                  title="Copy passcode"
                                  style={{ fontSize: '1.2rem' }}
                                  onClick={handleSharePasscode}
                                >
                                  {/* Inline SVG clipboard icon */}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10 1.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 .5.5V14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 0 .5-.5v-1A.5.5 0 0 1 7.5 1h1A.5.5 0 0 1 10 1.5zm-1 0a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 1-.5.5h-1A1.5 1.5 0 0 0 3 3.5V14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V3.5A1.5 1.5 0 0 0 12.5 2h-1a.5.5 0 0 1-.5-.5v-1z"/>
                                  </svg>
                                </button>
                                <button
                                  className="btn btn-link p-0 ms-2"
                                  title="Invite via Email"
                                  style={{ fontSize: '1.2rem' }}
                                  onClick={handleSendEmail}
                                >
                                  {/* Inline SVG email icon */}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.383V5.383zm-.034 7.434-5.482-3.29-5.482 3.29A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.183zM1 11.383l4.708-2.825L1 5.383v6z"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          <Row className="mb-2">
                            <Col xs={6}>
                              <div className="text-secondary small">Group Rank</div>
                              <div className="fw-semibold">{groupDetails.group_rank ?? "-"}</div>
                            </Col>
                            <Col xs={6}>
                              <div className="text-secondary small">Current Points</div>
                              <div className="fw-semibold">{groupDetails.current_points}</div>
                            </Col>
                          </Row>
                          <Row className="mb-2">
                            <Col xs={6}>
                              <div className="text-secondary small">Total Points Earned</div>
                              <div className="fw-semibold">{groupDetails.total_points_earned}</div>
                            </Col>
                            <Col xs={6}>
                              <div className="text-secondary small">Village Level</div>
                              <div className="fw-semibold">{groupDetails.village_level}</div>
                            </Col>
                          </Row>
                          <Row className="mb-2">
                            <Col xs={12}>
                              <div className="text-secondary small">Team Leader</div>
                              <div className="fw-semibold">
                                {groupDetails.leader ? (
                                  <div className="d-flex align-items-center">
                                    <span>{groupDetails.leader.name || 'Unknown'}</span>
                                    <span className="text-muted ms-2">({groupDetails.leader.email || 'No email'})</span>
                                  </div>
                                ) : (
                                  <span className="text-muted">No leader assigned</span>
                                )}
                              </div>
                            </Col>
                          </Row>
                          <div className="mb-2">
                            <div className="text-secondary small mb-1">Team Members</div>
                            {groupDetails.team_members && groupDetails.team_members.length > 0 ? (
                              <div className="table-responsive">
                                <table className="table table-sm table-bordered align-middle mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th className="text-center" style={{ width: '40px' }}>#</th>
                                      <th>Name</th>
                                      <th>Email</th>
                                      <th className="text-center" style={{ width: '80px' }}>Role</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupDetails.team_members.map((member, idx) => {
                                      const isLeader = groupDetails.leader && groupDetails.leader._id === member._id;
                                      return (
                                        <tr key={member._id}>
                                          <td className="text-center">{idx + 1}</td>
                                          <td>
                                            {member.name}
                                            {isLeader && (
                                              <span className="badge bg-primary ms-2" style={{ fontSize: '0.7rem' }}>
                                                Leader
                                              </span>
                                            )}
                                          </td>
                                          <td>{member.email}</td>
                                          <td className="text-center">
                                            {isLeader ? (
                                              <span className="text-primary fw-semibold">👑 Leader</span>
                                            ) : (
                                              <span className="text-muted">Member</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <span>No members</span>
                            )}
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
        <Toast
          bg="info"
          show={showCopied}
          onClose={() => setShowCopied(false)}
          delay={1500}
          autohide
          style={{ position: 'fixed', top: 80, right: 30, zIndex: 99999 }}
        >
          <Toast.Body className="text-white">Passcode copied!</Toast.Body>
        </Toast>
        <Toast
          bg="info"
          show={emailSent}
          onClose={() => setEmailSent(false)}
          delay={1500}
          autohide
          style={{ position: 'fixed', top: 120, right: 30, zIndex: 99999 }}
        >
          <Toast.Body className="text-white">Passcode sent via email!</Toast.Body>
        </Toast>
        <Toast
          bg="danger"
          show={!!emailError}
          onClose={() => setEmailError("")}
          delay={2000}
          autohide
          style={{ position: 'fixed', top: 160, right: 30, zIndex: 99999 }}
        >
          <Toast.Body className="text-white">{emailError}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Avatar Shop Modal */}
      <AvatarShop
        show={showAvatarShop}
        onHide={() => setShowAvatarShop(false)}
        studentDetails={studentDetails}
        onAvatarUpdate={refreshStudentDetails}
      />
    </>
  );
};

export default UserProfile;