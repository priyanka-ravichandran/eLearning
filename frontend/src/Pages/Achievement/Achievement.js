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
  const [localStudentDetails, setLocalStudentDetails] = useState(() => {
    const stored = localStorage.getItem("student_details");
    return stored ? JSON.parse(stored) : null;
  });
  
  // Use the most up-to-date student details
  const student_details = studentDetails || localStudentDetails;
  const userData = useSelector((state) => state.user.user);

  // Listen for localStorage and group status changes
  useEffect(() => {
    const handleStorageUpdate = (e) => {
      if (e.detail?.key === 'student_details' && e.detail?.value) {
        try {
          const newStudentDetails = JSON.parse(e.detail.value);
          console.log("🔄 Achievement: LocalStorage updated, refreshing student details", newStudentDetails);
          setLocalStudentDetails(newStudentDetails);
        } catch (error) {
          console.error("Error parsing updated student details:", error);
        }
      }
    };

    const handleGroupStatusChange = (e) => {
      console.log("🏆 Achievement: Group status changed", e.detail);
      // Force refresh of achievements and group data
      if (userData?._id) {
        getStudentAchievements({ student_id: userData._id });
        getStudentPointTransactions({ student_id: userData._id });
      }
      if (e.detail?.groupData?._id) {
        getGroupAchievements({ group_id: e.detail.groupData._id });
      }
    };

    window.addEventListener('localStorageUpdate', handleStorageUpdate);
    window.addEventListener('groupStatusChanged', handleGroupStatusChange);

    return () => {
      window.removeEventListener('localStorageUpdate', handleStorageUpdate);
      window.removeEventListener('groupStatusChanged', handleGroupStatusChange);
    };
  }, [userData?._id, getStudentAchievements, getStudentPointTransactions, getGroupAchievements]);

  useEffect(() => {
    if (userData?._id) {
      getStudentAchievements({ student_id: userData._id });
      getStudentPointTransactions({ student_id: userData._id });
    }
    if (student_details?.student?.group?._id) {
      console.log("🏆 Loading group achievements for group:", student_details.student.group._id);
      getGroupAchievements({ group_id: student_details.student.group._id });
    }
  }, [userData?._id, student_details?.student?.group?._id, getStudentAchievements, getStudentPointTransactions, getGroupAchievements]);

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

  // Debug logging for point transactions data
  useEffect(() => {
    console.log('🔍 Point transactions data updated:', pointTransactionsData);
    if (pointTransactionsData?.data?.transactions) {
      console.log('📊 Current transactions count:', pointTransactionsData.data.transactions.length);
      pointTransactionsData.data.transactions.forEach((transaction, index) => {
        console.log(`Transaction ${index + 1}:`, transaction);
      });
    } else {
      console.log('❌ No transactions found in expected data structure');
      console.log('Full response structure:', pointTransactionsData);
    }
  }, [pointTransactionsData]);

  // Debug logging for achievements data
  useEffect(() => {
    console.log('🔍 Student achievements data updated:', studentAchievementsData);
    if (studentAchievementsData?.data?.achievements) {
      console.log('🏆 Current achievements count:', studentAchievementsData.data.achievements.length);
      studentAchievementsData.data.achievements.forEach((achievement, index) => {
        console.log(`Achievement ${index + 1}:`, achievement);
      });
    } else {
      console.log('❌ No achievements found in expected data structure');
      console.log('Full achievements response:', studentAchievementsData);
    }
  }, [studentAchievementsData]);

  // Debug logging for group data
  useEffect(() => {
    console.log('🔍 DEBUG - Student Details from context:', studentDetails);
    console.log('🔍 DEBUG - Local student_details state:', localStudentDetails);
    console.log('🔍 DEBUG - Merged student_details:', student_details);
    console.log('🔍 DEBUG - User Data:', userData);
    console.log('🔍 DEBUG - Group ID from student_details:', student_details?.student?.group?._id);
    console.log('🔍 DEBUG - Group object:', student_details?.student?.group);
  }, [studentDetails, localStudentDetails, student_details, userData]);

  // Debug logging for group achievements data
  useEffect(() => {
    console.log('🔍 Group achievements data updated:', groupAchievementsData);
    if (groupAchievementsData?.data?.payload?.group_achievements) {
      console.log('🏆 Current group achievements count:', groupAchievementsData.data.payload.group_achievements.length);
      groupAchievementsData.data.payload.group_achievements.forEach((achievement, index) => {
        console.log(`Group Achievement ${index + 1}:`, achievement);
      });
    } else {
      console.log('❌ No group achievements found in expected data structure');
      console.log('Full group achievements response:', groupAchievementsData);
    }
  }, [groupAchievementsData]);

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
              {/* Display real point transactions data from the correct API response structure */}
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
              {/* Fallback to achievements data if point transactions are not available */}
              {!pointTransactionsLoading && !pointTransactionsError && 
               (!pointTransactionsData?.data?.transactions || 
                pointTransactionsData?.data?.transactions?.length === 0) &&
               studentAchievementsData?.data?.achievements?.length > 0 &&
               studentAchievementsData.data.achievements.map(
                (data, index) => (
                  <div key={data._id || index} className="achievements-board-single-row-table">
                    <div className="reason">{data?.reason || "Achievement"}</div>
                    <div>{fullDate(data.date || data.created_at)}</div>
                    <div
                      className={`amount ${
                        data?.type === "credit" || (!data?.type && data?.points_value > 0)
                          ? "postive_amount"
                          : "nagative_amount"
                      }`}
                    >
                      {data?.points || (data?.type === "credit" ? `+${data?.points_value}` : `-${Math.abs(data?.points_value)}`)}
                    </div>
                  </div>
                )
              )}
              {/* Show message if no transactions or achievements available */}
              {!pointTransactionsLoading && !pointTransactionsError && 
               (!pointTransactionsData?.data?.transactions || 
                pointTransactionsData?.data?.transactions?.length === 0) &&
               (!studentAchievementsData?.data?.achievements || 
                studentAchievementsData?.data?.achievements?.length === 0) && (
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
