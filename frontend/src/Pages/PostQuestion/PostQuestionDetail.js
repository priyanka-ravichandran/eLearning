import React, { useEffect } from "react";
import { Row } from "react-bootstrap";
import userAvatar from "../../Images/useravatar.png";
import arrow_left from "../../Images/arrow-left.svg";
import "../HelpFriend/HelpFriend.css";
import {
  useLazyGetQuestionDetailQuery,
  useVoteStudentMutation,
} from "../../redux/api/questionsApi";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { fullDate } from "../HelpFriend/HelpFriendDetails";
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
const PostQuestionDetail = () => {
  const [getQuestionDetails, { data: getQuestionDetailsData }] =
    useLazyGetQuestionDetailQuery();
  const [voteStudent, { isSuccess }] = useVoteStudentMutation();

  const param = useParams();
  const userData = useSelector((state) => state.user.user);

  useEffect(() => {
    getQuestionDetails({ question_id: param?.id, student_id: userData?._id });
  }, []);
  console.log({ getQuestionDetailsData });
  console.log("success", isSuccess);

  const handleVote = (voteType, voteTo) => {
    voteStudent({
      question_id: param?.id,
      vote_by: userData?._id,
      vote_to: voteTo,
      vote: voteType,
    })
      .then((res) => {
        getQuestionDetails({ question_id: param?.id, student_id: userData?._id });
        toast.success("Voted Successfully");
      })
      .catch((err) => toast.error("Some Error Occured"));
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
        <Avatar
          size={50}
          round={true}
          style={{ margin: "0 10px" }}
          name={getQuestionDetailsData?.data?.question?.created_by?.name}
          maxInitials={2}
        />

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
          <span style={{ fontSize: "25px" }}>on {data.date}</span>
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
        <div>
          {/* {data?.secondaryText?.map((comment, index) => {
            return ( */}
          <div
            style={{
              textAlign: "left",
            }}
          >
            <p>{getQuestionDetailsData?.data?.question?.description}</p>
          </div>
          {/* );
          })}  */}
        </div>
      </div>
      <div style={{ marginTop: "120px" }}>
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
                <div className="upvote-downvote-sec">
                  <button
                    className="upvote"
                    style={{
                      background: `${data?.vote === "up" ? "#8B3B0E" : ""}`,
                    }}
                    onClick={() => handleVote("up", data?.student_id?._id)}
                  >
                    <img src={arrow_left} alt="upvote" />
                    Upvote
                  </button>
                  <button
                    className="downvote"
                    style={{
                      background: `${data?.vote === "down" ? "#8B3B0E" : ""}`,
                    }}
                    onClick={() => handleVote("down", data?.student_id?._id)}
                  >
                    <img src={arrow_left} alt="downvote" />
                    Downvote
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

export default PostQuestionDetail;
