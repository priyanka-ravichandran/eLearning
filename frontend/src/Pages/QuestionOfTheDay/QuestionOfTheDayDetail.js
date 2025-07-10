import React, { useState, useEffect } from "react";
import { Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import "../HelpFriend/HelpFriend.css";
import PageTitle from "../../components/PageTitle";
import shell from "../../Images/nav/shell.png";
import { useGetDailyChallengeByIdQuery, useSubmitIndividualAnswerMutation } from "../../redux/api/dailyChallengeApi";
import { useSelector } from "react-redux";
import { useMyContext } from "../../MyContextProvider";

const data = {
  topic: "History",
  question:
    "How could the sense of inclusiveness be better among the students?In what ways can schools foster an environment that promotes inclusivity and diversity among their student body?",
  secondaryText: [
    "From the diagram below, elaborate on What were the key economic, social, and political factors that ultimately led to the outbreak of the Civil War in the United States?In what ways did the issue of slavery intensify regional tensions, ultimately becoming a central point of contention between the Northern and Southern states?How did the secession of Southern states and the formation of the Confederate States of America contribute to the escalation of hostilities leading to the Civil War?",
    "o what extent did the Emancipation Proclamation transform the objectives of the Civil War, turning it into a fight not only for preserving the Union but also for the abolition of slavery?What were the consequences of key battles such as Gettysburg and Antietam, both strategically and in terms of shaping the course of the war and public opinion?In what ways did the outcome of the Civil War shape the subsequent Reconstruction era, influencing the path of the United States toward reunification and addressing the challenges of the post-war period?",
  ],
  imageUrl: "https://i.pravatar.cc/150?img=3",
	correctAns: "From the diagram below, elaborate on What were the key economic, social, and political factors that ultimately led to the outbreak of the Civil War in the United States?In what ways did the issue of slavery intensify regional tensions, ultimately becoming a central point of contention between the Northern and Southern states?How did the secession of Southern states and the formation of the Confederate States of America contribute to the escalation of hostilities leading to the Civil War? o what extent did the Emancipation Proclamation transform the objectives of the Civil War, turning it into a fight not only for preserving the Union but also for the abolition of slavery?What were the consequences of key battles such as Gettysburg and Antietam, both strategically and in terms of shaping the course of the war and public opinion?In what ways did the outcome of the Civil War shape the subsequent Reconstruction era, influencing the path of the United States toward reunification and addressing the challenges of the post-war period?",
	submittedAns: "From the diagram below, elaborate on What were the key economic, social, and political factors that ultimately led to the outbreak of the Civil War in the United States?In what ways did the issue of slavery intensify regional tensions, ultimately becoming a central point of contention between the Northern and Southern states?How did the secession of Southern states and the formation of the Confederate States of America contribute to the escalation of hostilities leading to the Civil War?"
};

const QuestionOfTheDayDetail = () => {
  const { id } = useParams();
  const [isAnsSubmitted, setIsAnsSubmitted] = useState(false);
  const [answer, setAnswer] = useState("");
  
  // Get student and group details
  const userData = useSelector((state) => state.user.user);
  const { studentDetails } = useMyContext();
  const student_details = studentDetails || JSON.parse(localStorage.getItem("student_details"));
  
  // API calls
  const { data: challengeData, isLoading, error } = useGetDailyChallengeByIdQuery(id);
  const [submitIndividualAnswer, { isLoading: submitting }] = useSubmitIndividualAnswerMutation();
  
  // Check if current student has already submitted
  const hasStudentSubmitted = challengeData?.data?.group_submissions?.some(
    submission => submission.student_id === student_details?._id
  );
  
  // Get current student's answer if submitted
  const studentAnswer = challengeData?.data?.group_submissions?.find(
    submission => submission.student_id === student_details?._id
  );
  
  useEffect(() => {
    if (hasStudentSubmitted) {
      setIsAnsSubmitted(true);
    }
  }, [hasStudentSubmitted]);
  
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !student_details?._id) {
      alert("Please enter an answer and ensure you're logged in");
      return;
    }
    
    try {
      await submitIndividualAnswer({
        challenge_id: id,
        student_id: student_details._id,
        answer: answer.trim()
      }).unwrap();
      setIsAnsSubmitted(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer. Please try again.");
    }
  };
  
  if (isLoading) {
    return (
      <Row className="web-container" style={{ backgroundColor: "white" }}>
        <div className="header mt-4">
          <PageTitle text="Loading Challenge..." />
        </div>
        <div>Loading daily challenge details...</div>
      </Row>
    );
  }
  
  if (error || !challengeData?.data) {
    return (
      <Row className="web-container" style={{ backgroundColor: "white" }}>
        <div className="header mt-4">
          <PageTitle text="Challenge Not Found" />
        </div>
        <div>This daily challenge could not be found or has been removed.</div>
      </Row>
    );
  }
  
  const challenge = challengeData.data;
  const formattedDate = new Date(challenge.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return (
    <Row
      className="web-container"
      style={{
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          marginBottom: "5rem",
        }}
        className="header mt-4 d-flex justify-content-between align-items-center "
      >
        <PageTitle text={`Daily Challenge - ${formattedDate}`} />
        <div className="question-header-right">
          <div className="question-topic">
            <div>Status:</div>
            <span style={{ color: challenge.is_active ? "#28a745" : "#dc3545" }}>
              {challenge.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="question-topic">
            <div>Groups Answered:</div>
            <span>
              <img src={shell} alt="shell" />
              {" "}{challenge.group_answers?.length || 0}
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          textAlign: "left",
          fontSize: "20px",
          fontWeight: "700"
        }}
      >
        {challenge.question}
      </div>
      <div
        style={{
          marginTop: "4rem",
        }}
        className="question-information d-flex"
      >
        <div
          style={{
            flex: 1,
          }}
          className="left-part"
        >
          <div style={{ 
            padding: "20px", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "8px",
            border: "1px solid #dee2e6"
          }}>
            <h5>Challenge Information</h5>
            <p><strong>Date:</strong> {formattedDate}</p>
            <p><strong>Status:</strong> {challenge.is_active ? "Active" : "Inactive"}</p>
            <p><strong>Groups Participated:</strong> {challenge.group_answers?.length || 0}</p>
            {challenge.winner && (
              <p><strong>Winner:</strong> {challenge.winner.group_name}</p>
            )}
          </div>
        </div>
        <div
          className="right-part"
          style={{
            flex: "1",
            marginLeft: "5rem",
          }}
        >
          <h5>Group Competition</h5>
          <p>This is a group challenge where your team competes against other groups. Submit your best answer and it will be scored by our AI system.</p>
          <p>The winner is determined by:</p>
          <ul>
            <li>Accuracy of the answer (AI-scored)</li>
            <li>Speed of submission (fastest correct answer wins)</li>
          </ul>
          {challenge.group_answers?.length > 0 && (
            <div>
              <h6>Participating Groups:</h6>
              {challenge.group_answers.map((answer, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                  <strong>{answer.group_name || `Group ${index + 1}`}</strong>
                  {answer.llm_score && (
                    <span style={{ marginLeft: "10px", color: "#28a745" }}>
                      Score: {answer.llm_score}/10
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {!isAnsSubmitted && challenge.is_active && (
        <div className="answer-posting answer-posting-day">
          <textarea 
            rows={4} 
            placeholder="Type your group's answer here..." 
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button 
            onClick={handleSubmitAnswer}
            disabled={submitting || !answer.trim()}
          >
            {submitting ? "Submitting..." : "Submit Group Answer"}
          </button>
          {!student_details?.group && (
            <div style={{ color: "#dc3545", marginTop: "10px" }}>
              You must be part of a group to participate in daily challenges.
            </div>
          )}
        </div>
      )}
      {!challenge.is_active && (
        <div style={{ 
          padding: "20px", 
          backgroundColor: "#f8d7da", 
          color: "#721c24", 
          borderRadius: "8px",
          marginTop: "20px"
        }}>
          This challenge is no longer active.
        </div>
      )}
      {isAnsSubmitted && studentAnswer && (
        <div className="answer-container">
          <div className="ans-sec">
            <h1>Your Answer</h1>
            <span>{studentAnswer.answer}</span>
          </div>
          {studentAnswer.llm_score && (
            <div className="ans-sec">
              <h1>AI Score</h1>
              <span style={{ color: "#28a745", fontSize: "24px", fontWeight: "bold" }}>
                {studentAnswer.llm_score}/10
              </span>
            </div>
          )}
          {challenge.winner && (
            <div className="ans-sec">
              <h1>Winner</h1>
              <span style={{ 
                color: challenge.winner.group_id === student_details?.group?._id ? "#28a745" : "#6c757d",
                fontWeight: "bold"
              }}>
                {challenge.winner.group_name}
                {challenge.winner.group_id === student_details?.group?._id && " 🏆 (Your Group!)"}
              </span>
            </div>
          )}
        </div>
      )}
    </Row>
  );
};

export default QuestionOfTheDayDetail;
