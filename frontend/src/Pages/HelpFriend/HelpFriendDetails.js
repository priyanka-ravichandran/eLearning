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

export const fullDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const HelpFriendDetails = () => {
  const [userComment, setUserComment] = useState("");
  const [getQuestionDetails, { data: getQuestionDetailsData }] =
    useLazyGetQuestionDetailQuery();
  const [getSubmitAnswer] = useSubmitAnswerMutation();
  const [reactToAnswer] = useReactToAnswerMutation();
  const [llmFeedback, setLlmFeedback] = useState(null);

  const param = useParams();
  const userData = useSelector((state) => state.user.user);

  useEffect(() => {
    getQuestionDetails({ question_id: param?.id, student_id: userData?._id });
  }, [getQuestionDetails, param, userData]);

  const onSubmitQuestionAns = async () => {
    getSubmitAnswer({
      question_id: param?.id,
      student_id: userData?._id,
      answer: userComment,
    })
      .then((res) => {
        setUserComment("");
        toast.success(`Answer Submitted Successfully`);

        // Capture the LLM block if returned immediately
        if (res?.data?.llm) {
          setLlmFeedback(res.data.llm);
        } else {
          setLlmFeedback(null);
        }

        // Refresh question / answers
        getQuestionDetails({
          question_id: param?.id,
          student_id: userData?._id,
        });
      })
      .catch(() => {
        toast.error("Some error occurred");
        // still refresh to get whatever came back
        getQuestionDetails({
          question_id: param?.id,
          student_id: userData?._id,
        });
      });
  };

  const handleReaction = (reactionType, voteTo) => {
    reactToAnswer({
      question_id: param?.id,
      reaction_by: userData?._id,
      reaction_for: voteTo,
      reaction: reactionType,
    }).then(() => {
      toast.success(`Reacted with ${reactionType}`);
      getQuestionDetails({
        question_id: param?.id,
        student_id: userData?._id,
      });
    });
  };

  const question = getQuestionDetailsData?.data?.question;

  return (
    <Row className="web-container" style={{ backgroundColor: "white" }}>
      {/* Header */}
      <div className="pt-4 d-flex justify-content-between align-items-center">
        <span style={{ color: "#CB5E21", fontSize: 25 }}>Posted by</span>
        <div style={{ fontSize: 25 }}>
          Topic:{" "}
          <span style={{ fontWeight: "bold", fontSize: 25 }}>
            {question?.topic}
          </span>
        </div>
      </div>

      {/* Author + Date */}
      <div className="d-flex align-items-center mb-4">
        <Avatar
          size={50}
          round
          style={{ margin: "0 10px" }}
          name={question?.created_by?.name}
          maxInitials={2}
        />
        <div>
          <span style={{ fontWeight: "bold", fontSize: 25 }}>
            {question?.created_by?.name}
          </span>{" "}
          <span style={{ fontSize: 25 }}>
            on {fullDate(question?.date_posted)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div style={{ textAlign: "left", fontSize: 20 }}>
        {question?.question}
      </div>

      {/* Description */}
      <div style={{ marginTop: "4rem" }} className="question-information">
        <div style={{ textAlign: "left" }}>
          <p>{question?.description}</p>
        </div>
      </div>

      {/* Answer box */}
      <div className="answer-posting">
        <textarea
          rows={4}
          value={userComment}
          placeholder="Type your answer here..."
          onChange={(e) => {
            setUserComment(e.target.value);
            setLlmFeedback(null);
          }}
        />
        <button onClick={onSubmitQuestionAns}>Submit your answer</button>
      </div>

      {/* Immediate LLM feedback (if any) */}
      {llmFeedback && (
        <div
          style={{
            background: "#f9f6f2",
            border: "2px solid #8B3B0E",
            borderRadius: 8,
            padding: "16px 20px",
            margin: "20px 0 10px",
            boxShadow: "0 2px 8px rgba(139,59,14,0.08)",
          }}
        >
          <div
            style={{ fontWeight: 700, color: "#8B3B0E", marginBottom: 6 }}
          >
            AI Feedback (Just Submitted)
          </div>
          <div style={{ fontSize: 16, marginBottom: 2 }}>
            <b>Score:</b> {llmFeedback.score} / 10
          </div>
          <div style={{ fontSize: 15, marginBottom: 2 }}>
            <b>Explanation:</b> {llmFeedback.explanation}
          </div>
          <div style={{ fontSize: 15 }}>
            <b>Solution:</b> {llmFeedback.solution}
          </div>
        </div>
      )}

      {/* All existing answers */}
      {question?.answers?.map((data) => (
        <div className="comment-section" key={data._id}>
          <div>
            <img
              src={userAvatar}
              alt="userAvatar"
              style={{
                borderRadius: "50%",
                width: 50,
                height: 50,
                marginRight: 10,
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
                {[["like", like], ["love", love], ["care", care], ["laugh", laugh], ["wow", wow], ["sad", sad], ["angry", angry]].map(
                  ([type, imgSrc]) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type, data.student_id._id)}
                    >
                      <img
                        src={imgSrc}
                        alt={type}
                        style={{
                          border:
                            data.reaction === type
                              ? "2px solid black"
                              : undefined,
                          borderRadius:
                            data.reaction === type ? "50%" : undefined,
                        }}
                      />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Answer text */}
            <div className="comment-text">{data.answer}</div>

            {/* ─── Inject each answer’s stored LLM feedback here ─── */}
            {data.is_correct != null && (
              <div
                style={{
                  background: "#f0f5f9",
                  border: "1px solid #b3cde0",
                  borderRadius: 4,
                  padding: "8px 12px",
                  marginTop: 8,
                  fontSize: 14,
                }}
              >
                <div>
                  <strong>AI Score:</strong> {data.score} / 10
                </div>
                <div>
                  <strong>Explanation:</strong> {data.explanation}
                </div>
                <div>
                  <strong>Solution:</strong> {data.solution}
                </div>
              </div>
            )}
            {/* ────────────────────────────────────────────────────── */}
          </div>
        </div>
      ))}
    </Row>
  );
};

export default HelpFriendDetails;
