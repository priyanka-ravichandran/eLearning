import React, { useEffect, useState } from "react";
import "./Achievement.css";
import { Container } from "react-bootstrap";
import { useGetStudentAchievementsMutation, useGetStudentPointTransactionsMutation } from "../../redux/api/studentsApi";
import { useSelector } from "react-redux";
import { useGetGroupAchievementsMutation } from "../../redux/api/groupsApi";
import { fullDate } from "../HelpFriend/HelpFriendDetails";
import { useMyContext } from "../../MyContextProvider";

const Achievement = () => {
  // Mouse Tracking State
  const [coord, setCoord] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const newCoords = { x: e.screenX, y: e.screenY };
    setCoord(newCoords);
  };

  // Emotion Pop-up State
  const [showChatbot, setShowChatbot] = useState(false);
  const [emotion, setEmotion] = useState("");

  // Function to handle emotion selection
  const handleEmotionClick = (emotion) => {
    setEmotion(emotion);
  };

  // Function to submit emotion
  const submitEmotion = () => {
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
  const [getStudentPointTransactions, { data: pointTransactionsData, isLoading: pointTransactionsLoading, error: pointTransactionsError }] =
    useGetStudentPointTransactionsMutation();
  const [getGroupAchievements, { data: groupAchievementsData }] =
    useGetGroupAchievementsMutation();

  // Use global context for student details to get real-time updates
  const { studentDetails } = useMyContext();
  const student_details = studentDetails || JSON.parse(localStorage.getItem("student_details"));
  const userData = useSelector((state) => state.user.user);

  useEffect(() => {
    if (userData?._id) {
      getStudentAchievements({ student_id: userData._id });
      getStudentPointTransactions({ student_id: userData._id });
    }
    if (student_details?.group?._id) {
      getGroupAchievements({ group_id: student_details.group._id });
    }
  }, [userData?._id, student_details?.group?._id]);

  // Monitor specific point changes with more granular updates
  useEffect(() => {
    if (userData?._id && studentDetails?.student?.current_points !== undefined) {
      getStudentPointTransactions({ student_id: userData._id });
    }
  }, [studentDetails?.student?.current_points]);

  // Add effect to refresh point transactions when student context changes
  useEffect(() => {
    if (userData?._id && studentDetails?.student) {
      // Refresh both achievements and point transactions when student data changes
      getStudentPointTransactions({ student_id: userData._id });
      getStudentAchievements({ student_id: userData._id });
    }
  }, [studentDetails?.student?.current_points, studentDetails?.student?.total_points_earned]);

  // Additional effect to catch any studentDetails changes (for immediate updates)
  useEffect(() => {
    if (userData?._id && studentDetails) {
      // Small delay to ensure backend has processed the transaction
      const timeoutId = setTimeout(() => {
        getStudentPointTransactions({ student_id: userData._id });
      }, 500); // 500ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [studentDetails]);

  // Manual refresh function for testing
  const handleManualRefresh = () => {
    if (userData?._id) {
      getStudentPointTransactions({ student_id: userData._id });
      getStudentAchievements({ student_id: userData._id });
    }
  };

  // Add effect to refresh when component becomes visible/focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userData?._id) {
        getStudentPointTransactions({ student_id: userData._id });
      }
    };

    const handleFocus = () => {
      if (userData?._id) {
        getStudentPointTransactions({ student_id: userData._id });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userData?._id]);

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
            <div className="leaderbord-title">
              Achievements
              <button 
                onClick={handleManualRefresh}
                style={{ 
                  marginLeft: '10px', 
                  padding: '5px 10px', 
                  fontSize: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>
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
              {pointTransactionsLoading && (
                <div className="achievements-board-single-row-table">
                  <div className="reason">Loading point transactions...</div>
                  <div>-</div>
                  <div className="amount">-</div>
                </div>
              )}
              {pointTransactionsError && (
                <div className="achievements-board-single-row-table">
                  <div className="reason">Error loading point transactions</div>
                  <div>-</div>
                  <div className="amount">-</div>
                </div>
              )}
              {/* Display real point transactions data only */}
              {!pointTransactionsLoading && !pointTransactionsError && 
               pointTransactionsData?.data?.transactions?.length > 0 &&
               pointTransactionsData.data.transactions.map(
                (data, index) => (
                  <div key={data._id || index} className="achievements-board-single-row-table">
                    <div className="reason">{data?.reason || "Point Transaction"}</div>
                    <div>{fullDate(data.date || data.created_at)}</div>
                    <div
                      className={`amount ${
                        data?.type === "credit" || (!data?.type && data?.amount > 0)
                          ? "postive_amount"
                          : "nagative_amount"
                      }`}
                    >
                      {data?.points || (data?.type === "credit" ? `+${data?.amount}` : `-${Math.abs(data?.amount)}`)}
                    </div>
                  </div>
                )
              )}
              {/* Show message if no real transactions available */}
              {!pointTransactionsLoading && !pointTransactionsError && 
               (!pointTransactionsData?.data?.transactions || 
                pointTransactionsData?.data?.transactions?.length === 0) && (
                <div className="achievements-board-single-row-table">
                  <div className="reason">No point transactions found</div>
                  <div>-</div>
                  <div className="amount">-</div>
                </div>
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
