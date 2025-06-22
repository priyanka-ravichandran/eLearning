import React, { useEffect, useState, useCallback } from "react";
import { Container, Dropdown, Row } from "react-bootstrap";
import PageTitle from "../../components/PageTitle";
import "../HelpFriend/HelpFriend.css";
import calender_icon from "../../Images/refer-friend/calender_icon.svg";
import post_question from "../../Images/modal/post_question.svg";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Model";
import { Button } from "@mui/material";
import {
  useLazyGetMyQuestionsQuery,
  usePostQuestionMutation,
} from "../../redux/api/questionsApi";
import { QUESTION_TOPICS } from "../../utils";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as tf from '@tensorflow/tfjs';
//import webgazer from "../WebGazer";
import * as tmImage from '@teachablemachine/image';
var jsonArr = [];
var prediction;
//var perf =require('../WebGazer/www/index.html');
export const getFormattedDate = (date) => {
  const newDate = new Date(date);
  return `${newDate.getDate()} ${newDate.toLocaleString("default", {
    month: "short",
  })}`;
};
const PostQuestion = () => {
  const [questionState, setQuestionState] = useState({
    question: "",
    description: "",
    topic: QUESTION_TOPICS[0],
  });
  const navigate = useNavigate();
  // const [getPostQuestionList,{data:postQustionsList}]=usePostQuestionMutation();
  // const [getAllQuestions,{data:getAllQuestion}]= useGetAllQuestionsMutation()
  const [getMyQuestions, { data: myQuestions ,isLoading:questionLoading}] = useLazyGetMyQuestionsQuery();
  const [postQuestion, { isLoading, isError }] = usePostQuestionMutation();
  const userData = useSelector((state) => state.user?.user);
  var [data, setData] = useState();
    // Emotion Pop-up State
    const [showChatbot, setShowChatbot] = useState(false);
    const [emotion, setEmotion] = useState("");
  const [coord, setCoord] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const newCoords = {x: e.screenX, y: e.screenY}
      setCoord(newCoords);
      console.log("Mouse Coordinates:", newCoords)
    };

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

    async function alertHello(){
      //console.log('Hello')
      let model, webcam, labelContainer, maxPredictions;
  
      //var info = document.getElementById('info');
  
  // Creating function that will tell the position of cursor
  // PageX and PageY will getting position values and show them in P
  
    //info.innerHTML = 'Position X : ' + pageX + '<br />Position Y : ' + pageY;
  
  //info.addEventListener('mousemove', tellPos, false);
  
      // Load the image model and setup the webcam
      //async function init() {
          const modelURL ="https://teachablemachine.withgoogle.com/models/Ogzn2k_IY/model.json";
          const metadataURL = "https://teachablemachine.withgoogle.com/models/Ogzn2k_IY/metadata.json";
  
          // load the model and metadata
          // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
          // or files from your local hard drive
          // Note: the pose library adds "tmImage" object to your window (window.tmImage)
          //model = await tf.load(modelURL, metadataURL);
          model = await tmImage.load(modelURL, metadataURL);
          maxPredictions = model.getTotalClasses();
  
          // Convenience function to setup a webcam
          const flip = true; // whether to flip the webcam
         // webcam = new tf.Webcam(200, 200, flip); // width, height, flip
         webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
          await webcam.setup(); // request access to the webcam
          await webcam.play();
          window.requestAnimationFrame(loop);
  
          // append elements to the DOM
          document.getElementById("webcam-container").appendChild(webcam.canvas);
          labelContainer = document.getElementById("label-container");
          for (let i = 0; i < maxPredictions; i++) { // and class labels
              labelContainer.appendChild(document.createElement("div"));
         // }
      }
  
      async function loop() {
          webcam.update(); // update the webcam frame
          await predict();
          window.requestAnimationFrame(loop);
      }
  
      // run the webcam image through the image model
      async function predict() {
          // predict can take in an image, video or canvas html element
          //var json2;
         // const timers = {time};
          //var seconds;
          var seconds = new Date();
          prediction = await model.predict(webcam.canvas);
          for (let i = 0; i < maxPredictions; i++) {
              const classPrediction =
                  prediction[i].className + ": " + prediction[i].probability.toFixed(2);
                  //json2.add(timers, PID, prediction[i].probability) 
                  //console.log(time) 
                  jsonArr.push({seconds, i,
                    prediction: prediction[i].probability,
                    //optionValue: status.options[i].value
                });
                console.log(jsonArr)
              labelContainer.childNodes[i].innerHTML = classPrediction;
          }
          
      }
  
      }

      const reqData = () => {
        var webgazer = window.webgazer
        //const webgazer = require('webgazer');
        var topDist = '-500';
        webgazer.setGazeListener((data,clock)=>{
        //setData(data, clock)
        //webgazer.hide();
        console.log(data,clock)
        }).begin()
        //webgazerVideoFeed.style.top=topDist;
        //webgazerVideoFeed.style.top = 50;
        //webgazerFaceOverlay.style.top=50;
        //webgazerFaceFeedbackBox.style.top =50;
       // var video = document.getElementById("eye-gazer").appendChild(webgazer);

            //webgazer.style.visibility = hidden;
       
      }
      const Comp = () => {
        useEffect(() => {
          reqData(); // assign it or whatever you need
        }, [])
      }
    
    const handleClick = useCallback(reqData);
    
    function Eyetrack(){

      useEffect(() => {
        const webgazer = window.webgazer
        webgazer.setGazeListener((data,clock)=>{
        //setData(data, clock)
        console.log(data,clock)
        })}, []).begin()
        //return { setData };
      }

  useEffect(() => {
    getMyQuestions({
      start_date: new Date("03-03-2023"),
      end_date: new Date(),
      topic: questionState?.topic,
      student_id: userData?._id,
    });
    // getPostQuestionList()
  }, [questionState?.topic]);

  console.log(myQuestions, "myQuestions");
  console.log("post quesiton res", isError, isLoading);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setQuestionState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    console.log(questionState);
    postQuestion({ ...questionState, student_id: userData?._id })
      .then((res) => {
        console.log("res", res);
        toast.success('Question Posted Successfully')
        setIsModalOpen(false);
      })
      .catch((err) => {
        toast.error('Some Error Occured')
        console.log("err", err);
      });
  };
  return (
    <>
      <Container onMouseMove={handleMouseMove}
        style={{
          maxWidth: "95%",
        }}
      >
        <Button onClick={handleClick}>EyeTrack</Button> 
        <Button onClick={alertHello}>EngageTrack</Button> 
        <div>
          <div className="home-container">
          <div className="info" style={{marginTop:20, marginLeft:-418}}>
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
              className="header mt-4 d-flex justify-content-between align-items-center "
            >
              <PageTitle text={"MY QUESTIONS"} />

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
                   { QUESTION_TOPICS.map((topic)=>(
                   <Dropdown.Item  name={topic} onClick={(e)=>{
                    setQuestionState((prevState) => ({
                      ...prevState,
                      topic: e.target.name,
                    }));
                   }} active={questionState.topic===topic} >{topic}</Dropdown.Item>))}
            
                  </Dropdown.Menu>
                </Dropdown>
                {/* <div
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/question-of-the-day")}
                >
                  <img src={calender_icon} alt="calender" />
                </div> */}
                <div
                  className="answer-posting"
                  style={{ margin: 0, padding: 0 }}
                >
                  <button
                    style={{ padding: "2px 16px" }}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Post a Question
                  </button>
                </div>
              </div>
            </div>
            <Row
              style={{
                backgroundColor: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >{
                questionLoading && <h3 style={{display:'flex',justifyContent:'center'}}>Loading...</h3>
              }
                {myQuestions?.data?.map((value, index) => {
                  return (
                    <div
                      key={index}
                      style={{
                        background: "rgba(203, 94, 33, 0.5)",
                        marginBottom: "3rem",
                        flex: "0 0 30%",
                        boxSizing: "border-box",
                        padding: "10px 0 39px 20px",
                        border: "1px solid rgba(97, 41, 9, 1)",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        navigate(`/post-question-details/${value?._id}`)
                      }
                    >
                      <div
                        style={{
                          textAlign: "left",
                        }}
                        className="card-content"
                      >
                        <p
                          style={{
                            color: " rgba(0, 0, 0, 1)",
                            marginBottom: "0px",
                            fontSize: "20px",
                            maxWidth: "303px",
                          }}
                        >
                          {" "}
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
                        <div
                          style={{
                            fontSize: "25px",
                          }}
                          className="mt-4"
                        >
                          Topic:{" "}
                          <span
                            style={{
                              fontWeight: "700",
                            }}
                          >
                            {value?.topic}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "25px",
                          }}
                        >
                          Answers: <span>{value?.answers?.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Row>
          </div>
        </div>
      </Container>
      <Modal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        title={
          <div className="post-que-modal-head">
            <img src={post_question} alt="post question" />
            <span>Post a Question</span>
          </div>
        }
        content={
          <>
            <div className="post-que-form">
              <div className="form-field-sec">
                <span>Add a Title for the Question</span>
                <input
                  name="question"
                  value={questionState?.question}
                  onChange={handleChange}
                  placeholder="Example : How to  handle send and Download postman using Karate framework"
                />
              </div>
              <div className="form-field-sec">
                <span>What are the details of your Question?</span>
                <input
                  name="description"
                  value={questionState?.description}
                  onChange={handleChange}
                  placeholder="Enter the details of your problem"
                />
              </div>
              
              <div className="form-field-sec">
                <span>What is the name of the Topic?</span>
                <Dropdown className="dropdon-main" >
                <Dropdown.Toggle
                    variant="success"
                    className="dropdown-title"
                    id="dropdown-basic"
                    style={{minWidth:'110px'}}
                  >
                     {questionState?.topic}
                  </Dropdown.Toggle>
                <Dropdown.Menu>
                   { QUESTION_TOPICS.slice(1).map((topic)=>(
                   <Dropdown.Item  name={topic} onClick={(e)=>{
                    const { name } = e.target;
                    setQuestionState((prevState) => ({
                      ...prevState,
                      topic: name,
                    }));
                   }} active={questionState.topic===topic} >{topic}</Dropdown.Item>))}
            
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
            <button className="form-submit-btn" onClick={handleSubmit}>
              Submit
            </button>
          </>
        }
      />
    </>
  );
};

export default PostQuestion;
