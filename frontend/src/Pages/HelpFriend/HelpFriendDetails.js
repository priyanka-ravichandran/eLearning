import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Row } from "react-bootstrap";
import userAvatar from "../../Images/useravatar.png";
import "./HelpFriend.css";
import {
  useLazyGetQuestionDetailQuery,
  useReactToAnswerMutation,
  useSubmitAnswerMutation,
} from "../../redux/api/questionsApi";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Avatar from "react-avatar";
import { refreshStudentDetails, refreshPointsIfCurrentUser } from "../../utils";
import { useMyContext } from "../../MyContextProvider";
import EmojiReactions from "../../components/EmojiReactions";
import UserAvatar from "../../components/UserAvatar";

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
  const { studentDetails } = useMyContext(); // Removed setStudentDetails

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
      .then(async (res) => {
        setUserComment("");
        toast.success(`Answer Submitted Successfully! Points may be awarded based on quality.`);

        // Capture the LLM block if returned immediately
        if (res?.data?.llm) {
          setLlmFeedback(res.data.llm);
        } else {
          setLlmFeedback(null);
        }

        // Refresh student details to update points in header immediately
        await refreshStudentDetails(userData?._id);

        // Refresh question / answers
        getQuestionDetails({
          question_id: param?.id,
          student_id: userData?._id,
        });
      })
      .catch(async () => {
        toast.error("Some error occurred");
        
        // Still try to refresh student details in case points were awarded
        await refreshStudentDetails(userData?._id);
        
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

  const handleVote = async (voteType, studentId) => {
  // Call your existing vote_student_answer API
  // Update the vote count in the UI
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
        <UserAvatar
          user={question?.created_by}
          size="50"
          round={true}
          style={{ margin: "0 10px" }}
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
      {question?.answers?.map((data) => {
        // Convert reactions array to count object for EmojiReactions component
        const reactionCounts = {};
        let userReaction = null;
        
        if (data.reactions && Array.isArray(data.reactions)) {
          data.reactions.forEach(reaction => {
            // Count reactions by emoji type
            reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
            
            // Check if current user has reacted
            if (String(reaction.user_id) === String(userData?._id)) {
              userReaction = reaction.emoji;
            }
          });
        }
        
        console.log("Processing answer reactions:", {
          answerId: data._id,
          reactions: data.reactions,
          reactionCounts,
          userReaction
        });
        
        return (
        <div className="answer-container" key={data._id} style={{
          border: '1px solid #e4e6ea',
          borderRadius: '8px',
          marginBottom: '16px',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '16px'
        }}>
          {/* Answer content with AI score inline */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* Answer text */}
            <div style={{
              fontSize: '15px',
              lineHeight: '1.5',
              color: '#232629',
              flex: 1
            }}>
              {data.answer}
            </div>
            
            {/* AI Score badge next to answer */}
            <div style={{
              fontSize: '14px',
              color: '#0074cc',
              textAlign: 'center',
              padding: '4px 8px',
              backgroundColor: '#e1ecf4',
              borderRadius: '4px',
              minWidth: '60px',
              flexShrink: 0
            }}>
              <div style={{ fontWeight: 'bold' }}>AI Score</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {data.score ? `${data.score}/10` : 'N/A'}
              </div>
            </div>
          </div>

          {/* AI Feedback section (if available) */}
          {data.is_correct != null && (
            <div style={{
              background: '#f0f5f9',
              border: '1px solid #b3cde0',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0074cc' }}>
                AI Analysis
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Explanation:</strong> {data.explanation}
              </div>
              <div>
                <strong>Solution:</strong> {data.solution}
              </div>
            </div>
          )}

          {/* User info and reactions section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #e4e6ea',
            paddingTop: '12px'
          }}>
            {/* User info */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <UserAvatar 
                user={data?.student_id}
                size="32"
                round={true}
                style={{
                  marginRight: 8,
                }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  {data?.student_id?.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6a737c' }}>
                  answered {fullDate(data?.date)}
                </div>
              </div>
            </div>

            {/* Reactions */}
            <EmojiReactions
              postId={data._id}
              postType="answer"
              currentUserId={userData?._id}
              questionId={param?.id}
              initialReactions={reactionCounts}
              userReaction={userReaction}
              onReactionUpdate={async (newReactions) => {
                console.log('Reaction update callback triggered', newReactions);
                
                // Refresh question details to get updated data
                getQuestionDetails({
                  question_id: param?.id,
                  student_id: userData?._id,
                });
                
                // The answer author (data.student_id._id) is the one who receives points
                // Check if current user is the answer author and refresh their points
                const answerAuthorId = data?.student_id?._id;
                
                if (answerAuthorId && userData?._id) {
                  const pointsRefreshed = await refreshPointsIfCurrentUser(
                    answerAuthorId, 
                    userData._id, 
                    'reaction received'
                  );
                  
                  if (pointsRefreshed) {
                    toast.success('You received +2 points for the reaction!', { 
                      position: 'top-right',
                      autoClose: 3000 
                    });
                  }
                }
              }}
              showCounts={true}
              size="md"
            />
          </div>
        </div>
        );
      })}
    </Row>
  );
};

export default HelpFriendDetails;
