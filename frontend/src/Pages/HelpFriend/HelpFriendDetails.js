import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Row } from "react-bootstrap";
import userAvatar from "../../Images/useravatar.png";
import like from "../../Images/emoji/like.png";
import love from "../../Images/emoji/love.png";
import care from "../../Images/emoji/care.png";
import laugh from "../../Images/emoji/laugh.png";
import wow from "../../Images/emoji/wow.png";
import sad from "../../Images/emoji/sad.png";
import angry from "../../Images/emoji/angry.png";
import "./HelpFriend.css";
import {
  useLazyGetQuestionDetailQuery,
  useReactToAnswerMutation,
  useSubmitAnswerMutation,
} from "../../redux/api/questionsApi";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Avatar from "react-avatar";

const data = {
  name: "Adam Levine",
  date: "Feb 4,2024",
  topic: "History",
  question:
    "How could the sense of inclusiveness be better among the students?In what ways can schools foster an environment that promotes inclusivity and diversity among their student body?",
  secondaryText: [
    "From the diagram below, elaborate on What were the key economic, social, and political factors that ultimately led to the outbreak of the Civil War in the United States?In what ways did the issue of slavery intensify regional tensions, ultimately becoming a central point of contention between the Northern and Southern states?How did the secession of Southern states and the formation of the Confederate States of America contribute to the escalation of hostilities leading to the Civil War?",
    "o what extent did the Emancipation Proclamation transform the objectives of the Civil War, turning it into a fight not only for preserving the Union but also for the abolition of slavery?What were the consequences of key battles such as Gettysburg and Antietam, both strategically and in terms of shaping the course of the war and public opinion?In what ways did the outcome of the Civil War shape the subsequent Reconstruction era, influencing the path of the United States toward reunification and addressing the challenges of the post-war period?",
  ],
  comments: [
    {
      name: "Adam Levine",
      comment:
        "The Civil War erupted primarily due to deep-seated tensions over slavery, exacerbated by economic disparities and differing political ideologies between the Northern and Southern states.The Civil War erupted primarily due to deep-seated tensions over slavery, exacerbated by economic disparities and differing political ideologies between the Northern and Southern states.",
      date: "Feb 4,2024",
    },
    {
      name: "Ronaldo",
      comment:
        "The Civil War erupted primarily due to deep-seated tensions over slavery, exacerbated by economic disparities and differing political ideologies between the Northern and Southern states.The Civil War erupted primarily due to deep-seated tensions over slavery, exacerbated by economic disparities and differing political ideologies between the Northern and Southern states.",
      date: "Feb 4,2024",
    },
  ],
  imageUrl: "https://i.pravatar.cc/150?img=3",
};
export const fullDate = (date) => {
  return new Date(date)?.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
const HelpFriendDetails = () => {
  const [userComment, setUserComment] = useState("");
  const [getQuestionDetails, { data: getQuestionDetailsData }, refe] =
    useLazyGetQuestionDetailQuery();
  const [getSubmitAnswer, { data: getSubmitAns }] = useSubmitAnswerMutation();
  const [reactToAnswer, { isSuccess }] = useReactToAnswerMutation();

  const param = useParams();
  const userData = useSelector((state) => state.user.user);

  useEffect(() => {
    getQuestionDetails({ question_id: param?.id, student_id: userData?._id });
  }, []);

  const onSubmitQuestionAns = async () => {
    getSubmitAnswer({
      question_id: param?.id,
      student_id: userData?._id,
      answer: userComment,
    })
      .then((res) => {
        setUserComment("");
        toast.success(`Answer Submitted Successfully`);
    getQuestionDetails({ question_id: param?.id, student_id: userData?._id });
      })
      .catch((err) =>{ 
        toast.error("Some error Occured")
      getQuestionDetails({ question_id: param?.id, student_id: userData?._id });

    });
  };

  const handleReaction = (reactionType, voteTo) => {
    reactToAnswer({
      question_id: param?.id,
      reaction_by: userData?._id,
      reaction_for: voteTo,
      reaction: reactionType,
    }).then((res) => {
      toast.success(`Reacted with ${reactionType}`);
    getQuestionDetails({ question_id: param?.id, student_id: userData?._id });
  });
  };
  return (
    <Row
      className="web-container"
      style={{
        backgroundColor: "white",
      }}
    >
      <div className="pt-4 d-flex justify-content-between align-items-center">
        <span
          style={{
            color: "rgba(203, 94, 33, 1)",
            fontSize: "25px",
          }}
        >
          Posted by
        </span>
        <div style={{ fontSize: "25px" }}>
          Topic:{" "}
          <span
            style={{
              fontWeight: "bold",
              fontSize: "25px",
            }}
          >
            {getQuestionDetailsData?.data?.question?.topic}
          </span>
        </div>
      </div>
      <div className="d-flex align-items-center mb-4">
      <Avatar size={50} round={true} style={{margin:'0 10px'}} name={getQuestionDetailsData?.data?.question?.created_by?.name} maxInitials={2}/>

        <div>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "25px",
            }}
          >
            {" "}
            {getQuestionDetailsData?.data?.question?.created_by?.name}
          </span>{" "}
          <span style={{ fontSize: "25px" }}>
            on {fullDate(getQuestionDetailsData?.data?.question?.date_posted)}
          </span>
        </div>
      </div>
      <div
        style={{
          textAlign: "left",
          fontSize: "20px",
        }}
      >
        {getQuestionDetailsData?.data?.question?.question}
      </div>
      <div
        style={{
          marginTop: "4rem",
        }}
        className="question-information d-flex"
      >
        
        <div
         
        >
          {/* {data?.secondaryText?.map((comment, index) => {
            return ( */}
          <div
            style={{
              textAlign: "left",
            }}
            // key={index}
          >
            <p>{getQuestionDetailsData?.data?.question?.description}</p>
          </div>
          {/* );
          })} */}
        </div>
      </div>
      <div className="answer-posting">
        <textarea
          rows={4}
          value={userComment}
          placeholder="Type your answer here..."
          onChange={(e) => setUserComment(e.target.value)}
        />
        <button onClick={() => onSubmitQuestionAns()}>
          Submit your answer
        </button>
      </div>
      <div>
        {getQuestionDetailsData?.data?.question?.answers?.map((data) => (
          <div className="comment-section">
            <div>
              <img
                src={userAvatar}
                alt="userAvatar"
                style={{
                  borderRadius: "50%",
                  width: "50px",
                  height: "50px",
                  marginRight: "10px",
                }}
              />
            </div>
            <div style={{ width: "100%" }}>
              <div className="comment-header">
                <div>
                  <b>{data?.student_id?.name}</b>{" "}
                  <span className="header-date">{fullDate(data?.date)}</span>
                </div>
                <div className="reactions">
                  <button
                    
                    onClick={() =>
                      handleReaction("like", data?.student_id?._id)
                    }
                  >
                    <img
                      src={like}
                      style={{
                        border:`${data?.reaction === "like" ? "2px solid black " : ""}`,
                        borderRadius:`${data?.reaction === "like" ? "50% " : ""}`
                      }}
                      alt="like"
                    />
                  </button>
                  <button
                    
                    onClick={() =>
                      handleReaction("love", data?.student_id?._id)
                    }
                  >
                    <img
                      src={love}
                      style={{
                        border:`${data?.reaction === "love" ? "2px solid black " : ""}`,
                        borderRadius:`${data?.reaction === "love" ? "50% " : ""}`

                      }}
                      alt="love"
                    />
                  </button>
                  <button
                    
                    onClick={() =>
                      handleReaction("care", data?.student_id?._id)
                    }
                  >
                    <img
                      src={care}
                      style={{
                        border:`${data?.reaction === "care" ? "2px solid black " : ""}`,
                        borderRadius:`${data?.reaction === "care" ? "50% " : ""}`

                      }}
                      alt="care"
                    />
                  </button>
                  <button
                    
                    onClick={() =>
                      handleReaction("laugh", data?.student_id?._id)
                    }
                  >
                    <img
                      src={laugh}
                      style={{
                        border:`${data?.reaction === "laugh" ? "2px solid black " : ""}`,
                        borderRadius:`${data?.reaction === "laugh" ? "50% " : ""}`

                      }}
                      alt="laugh"
                    />
                  </button>
                  <button
                  
                    
                    onClick={() => handleReaction("wow", data?.student_id?._id)}
                  >
                    <img
                      src={wow}
                      style={{
                        border:`${data?.reaction === "wow" ? "2px solid black " : ""}`,
                        borderRadius:`${data?.reaction === "wow" ? "50% " : ""}`

                      }}
                      
                      alt="wow"
                    />
                  </button>
                  <button
                   
                    onClick={() => handleReaction("sad", data?.student_id?._id)}
                  >
                    <img
                      src={sad}
                      style={{
                        border:`${data?.reaction === "sad" ? "2px solid black " : ""}`,
                        borderRadius:`${data?.reaction === "sad" ? "50% " : ""}`

                      }}
                      alt="sad"
                    />
                  </button>
                  <button
                   
                    onClick={() =>
                      handleReaction("angry", data?.student_id?._id)
                    }
                  >
                    <img
                      src={angry}
                      style={{
                        border:`${data?.reaction === "angry" ? "2px solid black " : ""}`,
                        borderRadius:`${data?.reaction === "angry" ? "50% " : ""}`

                      }}
                      alt="angry"
                    />
                  </button>
                </div>
              </div>
              <div className="comment-text">{data?.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </Row>
  );
};

export default HelpFriendDetails;
