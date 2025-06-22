import React, { useEffect, useState } from "react";
import { Container, Dropdown, Row } from "react-bootstrap";
import PageTitle from "../../components/PageTitle";
import "./HelpFriend.css";
import { useNavigate } from "react-router-dom";
import { useLazyGetAllQuestionsQuery } from "../../redux/api/questionsApi";
import { getFormattedDate } from "../PostQuestion/PostQuestion";
import { QUESTION_TOPICS } from "../../utils";
import { useSelector } from "react-redux";

const HelpFriend = () => {
  const navigate = useNavigate();
  const [getAllQuestions, { data: apiData, isLoading }] =
    useLazyGetAllQuestionsQuery();
  const [topicState, setTopicState] = useState(QUESTION_TOPICS[0]);

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

  useEffect(() => {
    getAllQuestions({ topic: topicState });
  }, [topicState]);

  const userData = useSelector((state) => state.user.user);
  console.log("User Data:", userData);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Remove questions where created_by is the same as student_id
    setData(
      apiData?.data?.filter((value) => {
        if (!value.created_by) return value;
        return value.created_by !== userData?._id;
      })
    );
  }, [apiData]);

  return (
    <Container
      onMouseMove={handleMouseMove}
      style={{
        maxWidth: "95%",
      }}
    >
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
              {/* {emotion && (
                <button className="submit-emotion" onClick={submitEmotion}>
                  Submit Emotion
                </button>
              )} */}
            </div>
          </div>
        )}

        <div
          style={{
            marginBottom: "5rem",
          }}
          className="header mt-4 d-flex justify-content-between align-items-center"
        >
          <PageTitle text={"HELP A FRIEND"} />

          <div className="header-right-container">
            <Dropdown className="dropdown-main">
              <Dropdown.Toggle
                variant="success"
                className="dropdown-title"
                id="dropdown-basic"
              >
                Question Topic
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {QUESTION_TOPICS.map((topic) => (
                  <Dropdown.Item
                    name={topic}
                    onClick={(e) => setTopicState(e.target.name)}
                    active={topicState === topic}
                  >
                    {topic}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <Row style={{ backgroundColor: "white" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {isLoading ? (
              <h4>Loading...</h4>
            ) : (
              data?.map((value) => (
                <div
                  key={value?._id}
                  style={{
                    background: "rgba(203, 94, 33, 0.5)",
                    marginBottom: "3rem",
                    flex: "0 0 30%",
                    padding: "10px 0 39px 20px",
                    border: "1px solid rgba(97, 41, 9, 1)",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/help-friend-details/${value?._id}`)}
                >
                  <div className="card-content">
                    <p
                      style={{
                        color: " rgba(0, 0, 0, 1)",
                        marginBottom: "0px",
                        fontSize: "20px",
                        maxWidth: "303px",
                      }}
                    >
                      {value?.question}
                    </p>
                    <span
                      style={{
                        color: "rgba(139, 59, 14, 1)",
                        fontSize: "18px",
                      }}
                    >
                      {getFormattedDate(value?.date_posted)}
                    </span>
                    <div className="mt-4">
                      Topic:{" "}
                      <span style={{ fontWeight: "700" }}>
                        {value?.topic}
                      </span>
                    </div>
                    <div>
                      Answers: <span>{value?.answers?.length}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Row>
      </div>
    </Container>
  );
};

export default HelpFriend;
