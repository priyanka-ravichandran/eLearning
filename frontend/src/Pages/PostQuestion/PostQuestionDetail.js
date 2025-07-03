import React, { useEffect } from "react";
import { Row } from "react-bootstrap";
import userAvatar from "../../Images/useravatar.png";
import arrow_left from "../../Images/arrow-left.svg";
import "../HelpFriend/HelpFriend.css";
import {
  useLazyGetQuestionDetailQuery,
  useVoteStudentMutation,
} from "../../redux/api/questionsApi";
import { useGetStudentAvatarMutation } from "../../redux/api/avatarApi";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { fullDate } from "../HelpFriend/HelpFriendDetails";
import { toast } from "react-toastify";
import Avatar from "react-avatar";
import EmojiReactions from "../../components/EmojiReactions";
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
  const [getStudentAvatar] = useGetStudentAvatarMutation();

  const param = useParams();
  const userData = useSelector((state) => state.user.user);
  const [llmFeedback, setLlmFeedback] = React.useState(null);
  const [userAvatars, setUserAvatars] = React.useState({});

  // Test function to create default avatars for users who don't have custom ones
  const generateDefaultAvatar = (userId, userName) => {
    // Only return null - we don't want to generate anything, just use backend avatars
    return null;
  };

  useEffect(() => {
    getQuestionDetails({ question_id: param?.id, student_id: userData?._id });
  }, []);

  // Fetch avatars for all users who have answered
  useEffect(() => {
    if (getQuestionDetailsData?.data?.question?.answers) {
      const answers = getQuestionDetailsData.data.question.answers;
      const question = getQuestionDetailsData.data.question;
      
      console.log("Processing question and answers for avatars:", { question, answers });
      
      const newUserAvatars = {};
      
      // Process question author avatar
      if (question.created_by?._id && question.created_by?.avatar) {
        const authorId = question.created_by._id;
        const avatarConfig = question.created_by.avatar;
        console.log("Question author avatar config:", avatarConfig);
        
        // Generate avatar URL from backend data
        const avatarUrl = generateAvatarUrlFromConfig(avatarConfig);
        newUserAvatars[authorId] = avatarUrl;
        console.log("Generated avatar URL for question author:", avatarUrl);
      }
      
      // Process answer authors avatars
      answers.forEach(answer => {
        if (answer.student_id?._id && answer.student_id?.avatar) {
          const studentId = answer.student_id._id;
          const avatarConfig = answer.student_id.avatar;
          console.log("Answer author avatar config:", avatarConfig);
          
          // Generate avatar URL from backend data
          const avatarUrl = generateAvatarUrlFromConfig(avatarConfig);
          newUserAvatars[studentId] = avatarUrl;
          console.log("Generated avatar URL for answer author:", avatarUrl);
        }
      });
      
      console.log("Setting user avatars:", newUserAvatars);
      setUserAvatars(newUserAvatars);
    }
  }, [getQuestionDetailsData]);
  console.log({ getQuestionDetailsData });
  console.log("success", isSuccess);
  console.log("User avatars state:", userAvatars);

  // Test function to manually test avatar API
  const testAvatarAPI = () => {
    if (userData?._id) {
      console.log("Testing avatar API for current user:", userData._id);
      getStudentAvatar({ student_id: userData._id })
        .then((response) => {
          console.log("Manual avatar test response:", response);
        })
        .catch((error) => {
          console.log("Manual avatar test error:", error);
        });
    }
  };

  // Test on component mount
  useEffect(() => {
    setTimeout(testAvatarAPI, 2000); // Test after 2 seconds
  }, [userData]);

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

  // Function to handle answer submission (assuming you have it)
  // If you have a submit handler, update it to setLlmFeedback with the llm response
  // Example:
  // const handleSubmitAnswer = (answer) => {
  //   submitAnswerApi(...).then(res => {
  //     setLlmFeedback(res.data.llm);
  //     // Optionally refresh question details
  //   });
  // };

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
        {userAvatars[getQuestionDetailsData?.data?.question?.created_by?._id] ? (
          <img
            src={userAvatars[getQuestionDetailsData?.data?.question?.created_by?._id]}
            alt="User Avatar"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              margin: "0 10px",
              border: "2px solid #007bff"
            }}
            onError={(e) => {
              console.log("Avatar image failed to load:", e.target.src);
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <Avatar
            size={50}
            round={true}
            style={{ margin: "0 10px" }}
            name={getQuestionDetailsData?.data?.question?.created_by?.name}
            maxInitials={2}
          />
        )}

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
      {/* Show LLM feedback immediately after submission if present */}
      {llmFeedback && (
        <div
          style={{
            background: "#f9f6f2",
            border: "2px solid #8B3B0E",
            borderRadius: "8px",
            padding: "16px 20px",
            margin: "20px 0 10px 0",
            boxShadow: "0 2px 8px rgba(139,59,14,0.08)",
          }}
        >
          <div style={{ fontWeight: 700, color: "#8B3B0E", marginBottom: 6 }}>
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
      <div style={{ marginTop: "120px" }}>
        {getQuestionDetailsData?.data?.question?.answers?.map((data) => (
          <div className="comment-section">
            <div>
              {userAvatars[data?.student_id?._id] ? (
                <img
                  src={userAvatars[data?.student_id?._id]}
                  alt="User Avatar"
                  style={{
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    marginRight: "10px",
                    border: "2px solid #007bff"
                  }}
                  onError={(e) => {
                    console.log("Avatar image failed to load for answer:", e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <Avatar
                  size={50}
                  round={true}
                  style={{ marginRight: "10px" }}
                  name={data?.student_id?.name}
                  maxInitials={2}
                />
              )}
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
              
              {/* Emoji Reactions */}
              <EmojiReactions
                postId={data?._id}
                postType="answer"
                currentUserId={userData?._id}
                questionId={param?.id}
                initialReactions={data?.reactions || {}}
                onReactionUpdate={(newReactions) => {
                  // Refresh question details to get updated data
                  getQuestionDetails({ question_id: param?.id, student_id: userData?._id });
                }}
                showCounts={true}
                size="md"
              />
              
              {/* LLM Feedback Section */}
              {(data?.score !== undefined || data?.explanation || data?.solution) && (
                <div
                  style={{
                    background: "#f9f6f2",
                    border: "1px solid #e0d7ce",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginTop: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#8B3B0E", marginBottom: 4 }}>
                    AI Feedback
                  </div>
                  {data?.score !== undefined && (
                    <div style={{ fontSize: 16, marginBottom: 2 }}>
                      <b>Score:</b> {data.score} / 10
                    </div>
                  )}
                  {data?.explanation && (
                    <div style={{ fontSize: 15, marginBottom: 2 }}>
                      <b>Explanation:</b> {data.explanation}
                    </div>
                  )}
                  {data?.solution && (
                    <div style={{ fontSize: 15 }}>
                      <b>Solution:</b> {data.solution}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Row>
  );
};

export default PostQuestionDetail;

// Generate DiceBear avatar URL from avatar configuration
const generateAvatarUrlFromConfig = (avatarConfig) => {
    if (!avatarConfig) return null;
    
    const baseUrl = 'https://api.dicebear.com/9.x/personas/svg';
    const params = new URLSearchParams();
    
    // Add seed
    if (avatarConfig.seed) {
      params.append('seed', avatarConfig.seed);
    }
    
    // Add customizations based on Personas style options
    if (avatarConfig.hair) {
      params.append('hair', avatarConfig.hair);
    }
    if (avatarConfig.eyes) {
      params.append('eyes', avatarConfig.eyes);
    }
    if (avatarConfig.facialHair) {
      params.append('facialHair', avatarConfig.facialHair);
    }
    if (avatarConfig.mouth) {
      params.append('mouth', avatarConfig.mouth);
    }
    if (avatarConfig.body) {
      params.append('body', avatarConfig.body);
    }
    
    return `${baseUrl}?${params.toString()}`;
  };
