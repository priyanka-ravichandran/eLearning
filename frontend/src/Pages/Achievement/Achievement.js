import React, { useEffect, useState } from "react";
import "./Achievement.css";
import { Container } from "react-bootstrap";
import { useGetStudentAchievementsMutation } from "../../redux/api/studentsApi";
import { useSelector } from "react-redux";
import { useGetGroupAchievementsMutation } from "../../redux/api/groupsApi";
import { fullDate } from "../HelpFriend/HelpFriendDetails";

const Achievement = () => {
  // Mouse Tracking State
  const [coord, setCoord] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const newCoords = { x: e.screenX, y: e.screenY };
    setCoord(newCoords);
    console.log("Mouse Coordinates:", newCoords);
  };

  // Emotion Pop-up State
  const [showChatbot, setShowChatbot] = useState(false);
  const [emotion, setEmotion] = useState("");

  // Function to handle emotion selection
  const handleEmotionClick = (emotion) => {
    setEmotion(emotion);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Emotion selected: ${emotion}`);
  };

  // Function to submit emotion
  const submitEmotion = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Emotion submitted: ${emotion}`);
    setEmotion(""); // Reset emotion after submission
  };

  // Auto-toggle chatbot every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setShowChatbot((prevState) => !prevState);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [activeTab, setActiveTab] = useState("individual");
  const [getStudentAchievements, { data: studentAchievementsData }] =
    useGetStudentAchievementsMutation();
  const [getGroupAchievements, { data: groupAchievementsData }] =
    useGetGroupAchievementsMutation();

  const student_details = JSON.parse(localStorage.getItem("student_details"));
  const userData = useSelector((state) => state.user.user);

  console.log("User Data:", userData);

  useEffect(() => {
    getStudentAchievements({ student_id: userData?._id });
    getGroupAchievements({ group_id: student_details?.group?._id });
  }, []);

  return (
    <>
      <Container onMouseMove={handleMouseMove}>
        <div className="home-container">
          <div className="info" style={{ marginTop: 20, marginLeft: -418 }}>
            Mouse coordinates: {coord.x} {coord.y}
          </div>

          {/* Emotion Pop-up */}
          {showChatbot && (
            <div className="ChatbotContainer">
              <div className="ChatbotCard">
                <p>Welcome! How are you feeling?</p>
                <div className="Emotions">
                  <button onClick={() => handleEmotionClick("Happy")}>
                    😊 Happy
                  </button>
                  <button onClick={() => handleEmotionClick("Frustration")}>
                    😠 Frustration
                  </button>
                  <button onClick={() => handleEmotionClick("Confusion")}>
                    🤔 Confusion
                  </button>
                </div>
                {emotion && (
                  <button className="submit-emotion" onClick={submitEmotion}>
                    Submit Emotion
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="leader-board">
            <div className="leaderbord-title">Achievements</div>
            <div className="tab-menu">
              <span
                onClick={() => setActiveTab("individual")}
                className={`${activeTab === "individual" && "active"}`}
              >
                Individual
              </span>
              <span
                onClick={() => setActiveTab("group")}
                className={`${activeTab === "group" && "active"}`}
              >
                Group
              </span>
            </div>

            {/* Achievement Table */}
            {activeTab === "individual" ? (
              <div className="achievements-board-single-row">
                <div className="reason">Reason</div>
                <div>Date</div>
                <div className="amount">Amount</div>
              </div>
            ) : (
              <div className="achievements-board-single-row group-acheivement-rows">
                <div className="reason">Team Member</div>
                <div>Reason</div>
                <div>Date</div>
                <div className="amount">Amount</div>
              </div>
            )}
          </div>

          {/* Data Mapping */}
          {activeTab === "individual" ? (
            <div className="tabmenu-content-table achivement-table">
              {studentAchievementsData?.data?.payload?.student_achievements?.map(
                (data) => (
                  <div className="achievements-board-single-row-table">
                    <div className="reason">{data?.reason}</div>
                    <div>{fullDate(data.date)}</div>
                    <div
                      className={`amount ${
                        data?.type === "credit"
                          ? "postive_amount"
                          : "nagative_amount"
                      }`}
                    >
                      {`${
                        data?.type === "debit"
                          ? `-${data?.points}`
                          : `+${data?.points}`
                      }` || "-"}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="tabmenu-content-table achivement-table">
              {groupAchievementsData?.data?.payload?.group_achievements?.map(
                (data) => (
                  <div className="achievements-board-single-row-table group-acheivement-rows">
                    <div className="reason">{data?.team}</div>
                    <div>{data?.reason}</div>
                    <div>{fullDate(data?.date)}</div>
                    <div
                      className={`amount ${
                        data?.type === "credit"
                          ? "postive_amount"
                          : "nagative_amount"
                      }`}
                    >
                      {`${
                        data?.type === "debit"
                          ? `-${data?.points}`
                          : `+${data?.points}`
                      }` || "-"}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </Container>
    </>
  );
};

export default Achievement;
