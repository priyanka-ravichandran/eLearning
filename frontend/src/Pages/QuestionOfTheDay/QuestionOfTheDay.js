import React, { useEffect, useState } from "react";
import { Container, Row } from "react-bootstrap";
import PageTitle from "../../components/PageTitle";
import "../HelpFriend/HelpFriend.css";
import "./QuestionOfTheDay.css";
import carousal_left from "../../Images/carousal_left.svg";
import carousal_right from "../../Images/carousal_right.svg";
import { useNavigate } from "react-router-dom";
import shell from "../../Images/nav/shell.png";
import { createDateFromObject, getDateRange, getDayName, getMonthName, getMonthYear } from "../../utils";
import { useGetQuestionForWeekMutation } from "../../redux/api/questionsApi";

const data = [
  {
    title: "How could the sense of inclusiveness be better among the students?",
    topic: "Statistic",
    answer: "70",
  },
  {
    title: "How could the sense of inclusiveness be better among the students?",
    topic: "Statistic",
    answer: "70",
  },
  {
    title: "How could the sense of inclusiveness be better among the students?",
    topic: "Statistic",
    answer: "70",
  },
  {
    title: "How could the sense of inclusiveness be better among the students?",
    topic: "Statistic",
    answer: "70",
  },
  {
    title: null,
  },
];

const QuestionOfTheDay = () => {
  const navigate = useNavigate();
  const date = new Date();
  const [selectedDate, setSelectedDate] = useState({
    day: getDayName(date),
    date: date.getDate(),
    month: getMonthName(date),
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthYear, setMonthYear] = useState(getMonthYear(currentDate));
  const [dateRange, setDateRange] = useState(getDateRange(currentDate));
    console.log(dateRange,monthYear,dateRange[0],createDateFromObject(dateRange[0]))
  const [getQuestionForWeek,{isLoading,data}]= useGetQuestionForWeekMutation()

  useEffect(()=>{
    getQuestionForWeek({start_date:createDateFromObject(dateRange[0]),end_date:createDateFromObject(dateRange[4])})
  },[])

  console.log(data,'data',isLoading)

  const handleNextClick = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDate);
    setDateRange(getDateRange(nextDate));
    if (nextDate.getMonth() !== currentDate.getMonth()) {
      setMonthYear(getMonthYear(dateRange[dateRange.length - 1]));
    }
  };

  const handlePreviousClick = () => {
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(previousDate);
    setDateRange(getDateRange(previousDate));
    if (previousDate.getMonth() !== currentDate.getMonth()) {
      setMonthYear(getMonthYear(dateRange[0]));
    }
  };

  const handleNextMonthClick = () => {
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(nextMonthDate);
    setDateRange(getDateRange(nextMonthDate));
    setMonthYear(getMonthYear(nextMonthDate));
  };

  const handlePreviousMonthClick = () => {
    const previousMonthDate = new Date(currentDate);
    previousMonthDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(previousMonthDate);
    setDateRange(getDateRange(previousMonthDate));
    setMonthYear(getMonthYear(previousMonthDate));
  };

  const isSelectedDateMatch = (date) => {
    if(date.date === selectedDate.date && date.day === selectedDate.day && date.month === selectedDate.month){
      return true;
    }
    return false;
  }

  return (
    <>
      <Container
        style={{
          maxWidth: "95%",
        }}
      >
        <div>
          <div className="home-container mb-5">
            <div
              style={{
                marginBottom: "3rem",
              }}
              className="header mt-4 d-flex justify-content-between align-items-center "
            >
              <PageTitle text={"Question of the Day / Week"} />
            </div>
            <Row
              style={{
                backgroundColor: "white",
              }}
            >
              <div className="carousal-month">
                <button onClick={() => handlePreviousMonthClick()}>
                  <img src={carousal_left} alt="left" />
                </button>
                <div className="current-month-text">{monthYear}</div>
                <button onClick={() => handleNextMonthClick()}>
                  <img src={carousal_right} alt="right" />
                </button>
              </div>
              <div className="carousal-day">
                <button onClick={() => handlePreviousClick()}>
                  <img src={carousal_left} alt="left" />
                </button>
                {dateRange?.map((data) => (
                  <div onClick={() => {setSelectedDate(data); setMonthYear(getMonthYear(data))}} className={`${isSelectedDateMatch(data) && "day-active"} current-day-text`}>
                    <div>{data.date}</div>
                    <div>{data.day}</div>
                  </div>
                ))}
                <button onClick={() => handleNextClick()}>
                  <img src={carousal_right} alt="right" />
                </button>
              </div>
            </Row>

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
              >
                {data?.data?.questions?.length<1?
                <h2 style={{display:'flex',margin:'auto',padding:'30px'}}>No Questions for this week</h2>
                :data?.data?.questions?.map((value, index) => {
                  return value?.title ? (
                    <div
                      key={index}
                      style={{
                        marginBottom: "3rem",
                        boxSizing: "border-box",
                        padding: "14px 12px 31px 12px",
                        border: "2px solid #CB5E21",
                        cursor: "pointer",
                        maxWidth: "235px",
                      }}
                      onClick={() => navigate("/question-of-the-day/1")}
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
                            fontSize: "16px",
                            maxWidth: "303px",
                            textAlign: "center",
                          }}
                        >
                          {" "}
                          {value?.title}
                        </p>
                        <div
                          style={{
                            fontSize: "16px",
                          }}
                          className="mt-5"
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
                            fontSize: "16px",
                          }}
                        >
                          Answers:{" "}
                          <span>
                            <img
                              src={shell}
                              alt="shell"
                              style={{ height: "25px" }}
                            />{" "}
                            <b>{value?.answer}</b>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={index}
                      style={{
                        marginBottom: "3rem",
                        boxSizing: "border-box",
                        padding: "14px 12px 31px 12px",
                        border: "2px solid #CB5E21",
                        width: "235px",
                        alignContent: "center",
                      }}
                    >
                      Releasing Soon...
                    </div>
                  );
                })}
              </div>
            </Row>
            <div className="day-extra-text mb-5">
              Which graph below shows the most reasonable scale for the
              information in the table. Which graph below shows the most
              reasonable scale for the information in the table. Which graph
              below shows the most reasonable scale for the information in the
              table. Which graph below shows the most reasonable scale for the
              information in the table?
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default QuestionOfTheDay;
