import React, { useState } from "react";
import { Row } from "react-bootstrap";
import "../HelpFriend/HelpFriend.css";
import PageTitle from "../../components/PageTitle";
import shell from "../../Images/nav/shell.png";

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
	const [isAnsSubmitted, setIsAnsSubmitted] = useState(false);
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
        <PageTitle text={"Question of the Day  -  Feb 8, 2024"} />
        <div className="question-header-right">
          <div className="question-topic">
            <div>Topic:</div>
            <span>History</span>
          </div>
          <div className="question-topic">
            <div>Points:</div>
            <span>
              <img src={shell} alt="shell" />
              {" "}70
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
        {data?.question}
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
          <img
            src={data?.imageUrl}
            alt="images"
            style={{
              width: "100%",
              objectFit: "cover",
              maxHeight: "300px",
            }}
          />
        </div>
        <div
          className="right-part"
          style={{
            flex: "1",
            marginLeft: "5rem",
          }}
        >
          {data?.secondaryText?.map((comment, index) => {
            return (
              <div
                style={{
                  textAlign: "left",
                }}
                key={index}
              >
                <p>{comment}</p>
              </div>
            );
          })}
        </div>
      </div>
			{!isAnsSubmitted &&
				<div className="answer-posting answer-posting-day">
					<textarea rows={4} placeholder="Type your answer here..." />
					<button onClick={() => setIsAnsSubmitted(true)}>Submit your answer</button>
				</div>
			}
			{isAnsSubmitted &&
				<div className="answer-container">
					<div className="ans-sec">
						<h1>Correct Answer</h1>
						<span>{data.correctAns}</span>
					</div>
					<div className="ans-sec">
						<h1>Submitted Answer</h1>
						<span>{data.correctAns}</span>
					</div>
				</div>
			}
    </Row>
  );
};

export default QuestionOfTheDayDetail;
