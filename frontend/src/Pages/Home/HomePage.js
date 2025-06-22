import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import PageTitle from "../../components/PageTitle";
import OutlineButton from "../../components/Button";
import { Button, Col, Container, Row } from "react-bootstrap";
import village from "../../Images/village.png";
import village2 from "../../Images/village2.png";
import trees from "../../Images/trees.png";
import shellColor from "../../Images/shell_color.png";
import Modal from "../../components/Model";
import villageMap from "../../Images/home/modal_image.svg";
import { useUpdateVillageLevelMutation } from "../../redux/api/groupsApi";

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateVillageLevel, { data: updateVillageLevelData }] =
    useUpdateVillageLevelMutation();
  
  // Mouse tracking state
  const [coord, setCoord] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const newCoords = { x: e.screenX, y: e.screenY };
    setCoord(newCoords);
    console.log("Mouse Coordinates:", newCoords);
  };

  const userData = useSelector((state) => state.user.user);
  console.log(userData, "userData");

  const updateVillageMap = async () => {
    await updateVillageLevel({
      village_level: 5,
      group_id: userData?.group_id || "65e78093bd39e727b8872332",
      points_debited: userData?.grade,
    });
  };

  // Emotion tracking state
  const [emotion, setEmotion] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);

  // Handle emotion selection
  const handleEmotionClick = (emotion) => {
    setEmotion(emotion);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Emotion selected: ${emotion}`);
  };

  // Handle emotion submission
  const submitEmotion = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Emotion submitted: ${emotion}`);
    setEmotion("");
  };

  // Toggle chatbot every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setShowChatbot((prevState) => !prevState);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Container onMouseMove={handleMouseMove} style={{ maxWidth: "95%" }}>
        <div className="home-container">
          <div className="info" style={{ marginTop: 150, marginLeft: -418 }}>
            Mouse coordinates: {coord.x} {coord.y}
          </div>

          <div>
            <div className="home-container">
              <div
                style={{ marginBottom: "5rem" }}
                className="header mt-4 d-flex justify-content-between align-items-center"
              >
                <PageTitle text={"My Village"} />
                <div onClick={() => setIsModalOpen(true)}>
                  <OutlineButton text={"View Village Map"} />
                </div>
              </div>
              <Row style={{ backgroundColor: "white" }}>
                <Col sm={6}>
                  <div>
                    <img src={village} alt="village" style={{ width: "100%" }} />
                    <p
                      style={{
                        fontSize: "30px",
                        fontWeight: "400",
                        color: "rgba(203, 94, 33, 1)",
                      }}
                    >
                      My current Village Level -{" "}
                      <span style={{ fontSize: "30px", fontWeight: "600" }}>
                        Level 2
                      </span>
                    </p>
                  </div>
                </Col>
                <Col className="offset-1" sm={5}>
                  <div>
                    <div
                      style={{
                        backgroundColor: "rgba(241, 213, 179, 1)",
                        marginBottom: "3rem",
                        padding: "32px 20px 30px 20px",
                      }}
                      className="d-flex flex-column"
                    >
                      <div className="d-flex justify-content-around align-items-center">
                        <div>
                          <img
                            width={"169px"}
                            height={"171px"}
                            src={trees}
                            alt="trees"
                          />
                        </div>
                        <div
                          style={{
                            color: "rgba(97, 41, 9, 1)",
                            fontSize: "20px",
                          }}
                        >
                          FOR
                        </div>
                        <div className="d-flex align-items-center">
                          <img
                            width={"101.44px"}
                            height={"84.42px"}
                            src={shellColor}
                            alt="shell"
                          />
                          <span
                            style={{
                              color: "rgba(192, 73, 6, 1)",
                              fontSize: "48px",
                              fontWeight: "700",
                            }}
                          >
                            70
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: "40px", padding: "1rem" }}>
                        <Button
                          style={{
                            width: "100%",
                            backgroundColor: "#CB5E21",
                            padding: "11px",
                            fontSize: "32px",
                            border: "2px solid #8B3B0E",
                          }}
                          onClick={() => updateVillageMap()}
                        >
                          Buy
                        </Button>
                      </div>
                    </div>
                    <div>
                      <img src={village2} alt="village" />
                      <p
                        style={{
                          color: "rgba(203, 94, 33, 1)",
                          fontSize: "20px",
                          fontWeight: "400",
                        }}
                      >
                        Your village will look like this - Level 3
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </Container>

      {/* Emotion Pop-up */}
      {showChatbot && (
        <div className="ChatbotContainer">
          <div className="ChatbotCard">
            <p>
              Welcome Participant ID -.<br />How are you feeling this second?
            </p>
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
              <button className="submit-btn" onClick={submitEmotion}>
                Submit Emotion
              </button>
            )}
          </div>
        </div>
      )}

      {/* Village Map Modal */}
      <Modal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        title={"Village Map"}
        content={
          <div className="pt-4 pb-4">
            <img src={villageMap} alt="village-map" />
          </div>
        }
      />
    </>
  );
};

export default HomePage;
