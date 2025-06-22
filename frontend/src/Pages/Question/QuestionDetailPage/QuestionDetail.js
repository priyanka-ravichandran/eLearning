import { useNavigate, useParams } from "react-router-dom";
import "./QuestionDetail.css";
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FloatingLabel } from "react-bootstrap";

import shell from "../../../Images/shell.png";
import temp from "../../../Images/temp.png";

import { toast } from "react-toastify";

const base_url = process.env.REACT_APP_BASE_URL;

function Question() {
  const [show, setShow] = useState(false);
  const [questionDetails, setQuestionDetails] = useState({});
  const [displayDate, setDisplayDate] = useState("");
  const { id } = useParams();
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const student_details = JSON.parse(localStorage.getItem("student_details"));
  const navigate = useNavigate();

  const setDisplayDateHeading = (question) => {
    if (question.question_type == "week") {
      const start = new Date(question.active_from_date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(question.due_date);
      end.setUTCHours(0, 0, 0, 0);

      const startMonth = start.toLocaleString("en-US", { month: "short" });
      const endMonth = end.toLocaleString("en-US", { month: "short" });
      const startDay = start.getUTCDate();
      const endDay = end.getUTCDate() - 1;

      let formattedRange = startMonth + " " + startDay;
      if (startMonth !== endMonth || startDay !== endDay) {
        formattedRange += "-" + endDay;
      }

      setDisplayDate(formattedRange);
    } else if (question.question_type == "day") {
      const dateString = question.active_from_date;
      const date = new Date(dateString);
      date.setUTCHours(0, 0, 0, 0);

      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      setDisplayDate(formattedDate);
    }
  };

  const getQuestionDetails = async () => {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: id,
          student_id: student_details.student._id,
        }),
      };

      const response = await fetch(
        base_url + "/question/get_question_details",
        requestOptions
      );
      const data = await response.json();
      console.log("question details", data.data);

      setQuestionDetails(data.data.question);

      setDisplayDateHeading(data.data.question);

      if (data.data.question.can_edit) {
        setSubmittedAnswer(data.data.question.student_answer);
      }
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  };

  const submitAnswer = async () => {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: id,
          student_id: student_details.student._id,
          answer: submittedAnswer,
        }),
      };

      const response = await fetch(
        base_url + "/question/submit_answer",
        requestOptions
      );
      const data = await response.json();
      console.log("question details", data.data);
      toast.success("Answer Submitted Successfully");

      setQuestionDetails(data.data);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  };

  const handleTextBoxChange = (event) => {
    console.log("answer change", event.target.value);
    setSubmittedAnswer(event.target.value);
  };

  useEffect(() => {
    getQuestionDetails();
  }, []);

  return (
    <>
      <Container className="question-detail" fluid>
        <Row className="px-4 pt-3">
          <Col
            xs={2}
            className="d-flex align-items-center justify-content-start pe-5 me-5"
          >
            <button
              className="py-2 submit-btn"
              onClick={() => navigate("/question")}
            >
              <i class="bi bi-arrow-left pe-3"></i>Back
            </button>
          </Col>
        </Row>
        <Row className="row px-4 py-3">
          <Col className="left-heading-col">
            <div className="heading">
              {questionDetails?.question_type == "week" && (
                <h1>Question of the Week, {displayDate}</h1>
              )}
              {questionDetails?.question_type == "day" && (
                <h1>Question of the Day, {displayDate}</h1>
              )}
            </div>
          </Col>
          <Col className="right-heading-col d-flex justify-content-end align-items-center">
            <p className="me-5 my-0">
              Topic: <span>{questionDetails?.topic}</span>
            </p>
            <p className="my-0">
              Points: <img className="" height="30px" src={shell} alt="" />
              <span>{questionDetails?.points}</span>
            </p>
          </Col>
        </Row>
        <Row className="row px-4 py-3">
          <h5 className="">{questionDetails?.question}</h5>
        </Row>
        <Row className="row px-4 py-3">
          <Col>
            <p className="description">{questionDetails?.description}</p>
          </Col>
        </Row>

        {questionDetails.can_edit && (
          <Row className="row px-4 py-4">
            <Col xs={9}>
              <Form.Control
                as="textarea"
                placeholder="Type your Answer here..."
                value={submittedAnswer}
                onChange={handleTextBoxChange}
                style={{ height: "100px" }}
              />
            </Col>
            <Col
              xs={3}
              className="d-flex align-items-center justify-content-center"
            >
              {questionDetails?.can_edit &&
              questionDetails?.student_answer == null ? (
                <button className="submit-btn p-3" onClick={submitAnswer}>
                  Submit your Answer
                </button>
              ) : (
                <button className="submit-btn p-3" onClick={submitAnswer}>
                  Update your Answer
                </button>
              )}
            </Col>
          </Row>
        )}
        {!questionDetails.can_edit && (
          <Row className="row px-4 py-3">
            <div className="my-2">
              <h4 className="sub-heading">Correct Answer :</h4>
              <p className="text-justify">{questionDetails?.correct_answer}</p>
            </div>
            <div className="my-2">
              <h4 className="sub-heading">Submitted Answer :</h4>
              <p className="text-justify">
                {!questionDetails.can_edit &&
                questionDetails?.student_answer == null
                  ? "No Answer Submitted"
                  : questionDetails?.student_answer}
              </p>
            </div>
          </Row>
        )}
      </Container>
    </>
  );
}

export default Question;
