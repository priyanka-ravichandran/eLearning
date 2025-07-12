import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Modal, ProgressBar } from "react-bootstrap";
import village1 from "../../Images/village1.png";
import village2 from "../../Images/village2.png";
import village3 from "../../Images/village3.png";
import village4 from "../../Images/village4.png";
import village5 from "../../Images/village5.png";
import village6 from "../../Images/village6.png";
import village7 from "../../Images/village7.png";
import village_map from "../../Images/village_map.png";
import drum from "../../Images/drum.png";
import grasses from "../../Images/grasses.png";
import hut from "../../Images/hut.png";
import river from "../../Images/river.png";
import shell from "../../Images/shell.png";
import shield from "../../Images/shield.png";
import trees from "../../Images/trees.png";
import { useMyContext } from "../../MyContextProvider";
import { useGetVillageMilestonesMutation, useUpdateVillageLevelMutation } from "../../redux/api/groupsApi";
import { toast } from "react-toastify";

const base_url = process.env.REACT_APP_BASE_URL;

function LandingPage() {
  const navigate = useNavigate();
  const { studentDetails } = useMyContext(); // Removed setStudentDetails
  const student_details = JSON.parse(localStorage.getItem("student_details"));
  const [showChatbot, setShowChatbot] = useState(true);
  const [coord, setCoord] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);
  const [milestoneData, setMilestoneData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render key
  const [getVillageMilestones] = useGetVillageMilestonesMutation();
  const [updateVillageLevel] = useUpdateVillageLevelMutation();
  
  const handleMouseMove = (e) => {
    const newCoords = { x: e.screenX, y: e.screenY };
    setCoord(newCoords);
  };
  
  // Handle Emotion Selection
  const handleEmotionClick = (selectedEmotion) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Emotion selected: ${selectedEmotion}`);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setShowChatbot((prevState) => !prevState);
    }, 5000); // Toggle every 5 seconds

    return () => clearInterval(timer); // Clean up interval on unmount
  }, []);

  useEffect(() => {
    if (!student_details) {
      navigate("/login");
    }
    getStudentdetails();
    if (student_details?.group?._id) {
      fetchMilestoneData();
    }
  }, []);

  // Listen for group status changes from other components (like UserProfile)
  useEffect(() => {
    const handleGroupStatusChange = (event) => {
      console.log("🔄 LandingPage: Group status changed event received:", event.detail);
      // Force refresh by updating key and fetching new student details
      setRefreshKey(prev => prev + 1);
      setTimeout(() => {
        getStudentdetails();
      }, 500); // Small delay to ensure backend has processed the group creation
    };

    const handleLocalStorageUpdate = (event) => {
      console.log("🔄 LandingPage: LocalStorage update event received:", event.detail);
      if (event.detail.key === 'student_details') {
        // Parse the new student details and update state
        const newStudentDetails = JSON.parse(event.detail.value);
        // When you need to update student details:
        // localStorage.setItem("student_details", JSON.stringify(newStudentDetails));
        // window.dispatchEvent(new CustomEvent('studentDetailsUpdated', { detail: { value: JSON.stringify(newStudentDetails) } }));
        setRefreshKey(prev => prev + 1); // Force re-render
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

  // Fetch milestone data when group is available
  useEffect(() => {
    console.log("🔍 LandingPage: studentDetails changed:", {
      hasStudentDetails: !!studentDetails,
      hasGroup: !!studentDetails?.group,
      groupId: studentDetails?.group?._id,
      groupName: studentDetails?.group?.name
    });
    
    if (studentDetails?.group?._id) {
      console.log("✅ LandingPage: Group detected, fetching milestone data");
      fetchMilestoneData();
    } else {
      console.log("❌ LandingPage: No group detected");
    }
  }, [studentDetails]);

  const fetchMilestoneData = async () => {
    try {
      const groupId = studentDetails?.group?._id || student_details?.group?._id;
      if (!groupId) return;

      const response = await getVillageMilestones({ group_id: groupId });
      if (response.data?.status) {
        setMilestoneData(response.data.data);
        console.log("🏆 Village milestone data:", response.data.data);
      }
    } catch (error) {
      console.error("Error fetching milestone data:", error);
    }
  };

  const village_levels = {
    1: village1,
    2: village2,
    3: village3,
    4: village4,
    5: village5,
    6: village6,
    7: village7,
  };

  const next_item = {
    1: river,
    2: trees,
    3: hut,
    4: grasses,
    5: drum,
    6: shield,
  };

  const buyElement = async () => {
    try {
      const groupId = studentDetails?.group?._id || student_details?.group?._id;
      if (!groupId) {
        toast.error("Group not found");
        return;
      }

      // Check if user has enough points
      const currentPoints = studentDetails?.group?.current_points || 0;
      if (currentPoints < 50) {
        toast.error("Insufficient points to buy this item");
        return;
      }

      console.log("🛒 Buying village element for group:", groupId);
      
      const response = await updateVillageLevel({ 
        group_id: groupId, 
        points_debited: 50 
      });

      if (response.data?.status) {
        console.log("✅ Village level updated:", response.data.data);
        
        // Update student details with new group data
        const updatedStudentDetails = {
          student: student_details.student,
          group: response.data.data,
        };

        toast.success("Village level has been upgraded successfully!");
        // When you need to update student details:
        // localStorage.setItem("student_details", JSON.stringify(updatedStudentDetails));
        // window.dispatchEvent(new CustomEvent('studentDetailsUpdated', { detail: { value: JSON.stringify(updatedStudentDetails) } }));
        
        // Update localStorage as well
        localStorage.setItem("student_details", JSON.stringify(updatedStudentDetails));
        
        // Refresh milestone data after purchase
        await fetchMilestoneData();
        
        // Also refresh student details to get updated group info
        await getStudentdetails();
      } else {
        toast.error(response.data?.message || "Failed to upgrade village level");
      }
    } catch (error) {
      console.error("Error buying village element:", error);
      toast.error("Error upgrading village level");
    }
  };

  const getStudentdetails = async () => {
    try {
      const current_student_details = JSON.parse(localStorage.getItem("student_details"));
      if (!current_student_details?.student?._id) {
        console.error("No student ID found in localStorage");
        return;
      }

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: current_student_details.student._id }),
      };

      const response = await fetch(base_url + "/student/get_student_details", requestOptions);
      const data = await response.json();
      console.log("🔄 LandingPage: Student details fetched:", data.data);

      if (data.status && data.data) {
        // Update the studentDetails state
        // When you need to update student details:
        // localStorage.setItem("student_details", JSON.stringify(data.data));
        // window.dispatchEvent(new CustomEvent('studentDetailsUpdated', { detail: { value: JSON.stringify(data.data) } }));
        
        // Also update localStorage with the latest data
        localStorage.setItem("student_details", JSON.stringify(data.data));
        
        console.log("✅ LandingPage: Student details updated successfully");
        console.log("🏆 LandingPage: Group status:", data.data.group ? "Has group" : "No group");
      }
    } catch (error) {
      console.error("❌ LandingPage: Error fetching student details:", error.message);
    }
  };
  

  return (
    <>
      <Container onMouseMove={handleMouseMove} key={refreshKey}>
        <div className="home-container">
          <div className="info" style={{ marginTop: 20, marginLeft: -418 }}>
            Mouse coordinates: {coord.x} {coord.y}
          </div>

          {/* Emotion Popup */}
          {showChatbot && (
            <div className="ChatbotContainer">
              <div className="ChatbotCard">
                <p>Welcome Participant ID -.<br />How are you feeling this second?</p>
                <div className="Emotions">
                  <button onClick={() => handleEmotionClick("Happy")}>😊 Happy</button>
                  <button onClick={() => handleEmotionClick("Frustration")}>😠 Frustration</button>
                  <button onClick={() => handleEmotionClick("Confusion")}>🤔 Confusion</button>
                </div>
                {/* {emotion && (
                  <button onClick={submitEmotion} className="submit-emotion-btn">Submit Emotion</button>
                )} */}
              </div>
            </div>
          )}

          <Container className="landing-heading" fluid>
            <Row className="row px-4 py-3">
              <Col className="left-col" xs={6}>
                <div className="heading">
                  <h1>My Village</h1>
                </div>
              </Col>
              <Col xs={6} className="col-6 d-flex justify-content-end py-2">
                <button className="village-map-btn" onClick={() => setShow(true)}>
                  View Village Map
                </button>
              </Col>
            </Row>

            {(!studentDetails || !studentDetails.group) && (
              <Row className="row px-4 py-3">
                <h3 className="mt-5">Join a group with your classmates to start your Village building Journey!!!</h3>
              </Row>
            )}

            {studentDetails?.group && (
              <Row className="landing-container ps-4">
                <Col xs={7} className="left-side">
                  <img 
                    className="current-village" 
                    src={village_levels[studentDetails?.group?.village_level]} 
                    alt="Village Level" 
                    style={{ width: '100%', maxWidth: '400px', borderRadius: '10px' }}
                  />
                  
                  <p className="pt-3">
                    My Current Village level - <span className="bold">Level {studentDetails?.group?.village_level}</span>
                  </p>
                  
                  {/* Milestone Progress Display */}
                  {milestoneData && (
                    <div className="milestone-progress mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Village Progress</span>
                        <span>
                          <img className="shell me-1" src={shell} alt="Points" />
                          {milestoneData.group.current_points} points
                        </span>
                      </div>
                      
                      {milestoneData.milestone.canUpgrade ? (
                        <div className="alert alert-success py-2">
                          🎉 You can upgrade to Level {milestoneData.milestone.targetLevel}!
                        </div>
                      ) : (
                        <div>
                          <div className="d-flex justify-content-between text-small mb-1">
                            <span>Next Level: {milestoneData.milestone.currentLevel + 1}</span>
                            <span>{milestoneData.milestone.pointsNeeded} more points needed</span>
                          </div>
                          <ProgressBar 
                            now={((milestoneData.milestone.pointsForNextLevel - milestoneData.milestone.pointsNeeded) / milestoneData.milestone.pointsForNextLevel) * 100}
                            style={{ height: '8px' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Col>

                {studentDetails?.group?.village_level < 7 && (
                  <Col xs={5} className="right-side px-5">
                    <div className="buy-element-div mx-3 pt-4">
                      <div className="d-flex justify-content-around align-items-center">
                        <img className="next-element" src={next_item[studentDetails?.group?.village_level]} alt="Next Item" />
                        <span className="for">FOR</span>
                        <span>
                          <img className="shell me-1" src={shell} alt="Points" />
                          <span className="points mt-1">50</span>
                        </span>
                      </div>
                      <button
                        className="my-3 py-2 buy-btn"
                        onClick={() => {buyElement()}}
                      >
                        BUY
                      </button>
                    </div>
                    <div className="mt-4">
                      <img 
                        className="next-village" 
                        src={village_levels[studentDetails?.group?.village_level + 1]} 
                        alt="Next Village Level" 
                      />
                      <p className="pt-1">Your village will look like this - Level {studentDetails?.group?.village_level + 1}</p>
                    </div>
                  </Col>
                )}
              </Row>
            )}
          </Container>

          <Modal show={show} onHide={() => setShow(false)} dialogClassName="modal-90w" aria-labelledby="example-custom-modal-styling-title" scrollable className="village-map-modal">
            <Modal.Header closeButton>
              <Modal.Title id="example-custom-modal-styling-title">Village Map</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <img className="p-3" src={village_map} alt="Village Map" />
            </Modal.Body>
          </Modal>
        </div>
      </Container>
    </>
  );
}

export default LandingPage;
