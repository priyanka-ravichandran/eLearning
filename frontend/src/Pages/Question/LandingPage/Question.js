import { useNavigate } from 'react-router-dom'
import './Question.css'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Form, Modal } from 'react-bootstrap'

import shell from '../../../Images/shell.png'

const base_url = process.env.REACT_APP_BASE_URL

function Question () {
  const [show, setShow] = useState(false)
  const [dayQuestions, setDayQuestions] = useState([])
  const [weekQuestion, setWeekQuestion] = useState(null)
  const [displayMonthYear, setDisplayMonthYear] = useState('')
  const [displayWeek, setDisplayWeek] = useState([])
  // const currentDate = new Date().toISOString()

  const navigate = useNavigate()

  const handleQuestionDetailsPage = id => {
    navigate('/question/' + id)
  }

  function getCurrentWeekDates () {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    console.log('TODAYYYYYYY', today.toISOString())
    const dayOfWeek = today.getDay()
    console.log('dayOfWeek', dayOfWeek)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - dayOfWeek)
    startDate.setUTCHours(0, 0, 0, 0)
    console.log('startDate', startDate)
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + (6 - dayOfWeek))
    endDate.setUTCHours(0, 0, 0, 0)

    console.log('endDate', endDate)

    const dates = []

    for (let i = -1; i < 6; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      date.setUTCHours(0, 0, 0, 0)
      dates.push(date.toISOString())
    }

    console.log('current week:', dates)

    setDisplayWeek(dates)

    return dates
  }

  const getQuestionsForWeek = async dates => {
    try {
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start_date: dates[1],
          end_date: dates[6]
        })
      }

      const response = await fetch(
        base_url + '/question/get_questions_for_week',
        requestOptions
      )
      const data = await response.json()
      console.log('questions for the week', data.data)

      setDayQuestions(data.data.day)
      setWeekQuestion(data.data.week)
    } catch (error) {
      console.error('Error fetching data:', error.message)
    }
  }

  const isActive = day => {
    let currentDate = new Date()
    currentDate.setUTCHours(0, 0, 0, 0)
    currentDate = currentDate.toISOString()

    return day == currentDate
  }

  const prevWeek = () => {
    const dates = []
    const startDate = displayWeek[1]
    for (let i = 2; i < 9; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() - i)
      date.setUTCHours(0, 0, 0, 0)
      dates.unshift(date.toISOString())
    }

    console.log('prev week:', dates)

    let endDate = new Date(dates[5])

    setDisplayWeek(dates)

    setDisplayMonthYear(
      endDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
    )

    getQuestionsForWeek(dates)
  }

  const nextWeek = () => {
    const dates = []
    const lastDayOfCurrentWeek = displayWeek[5]
    for (let i = 2; i < 9; i++) {
      const date = new Date(lastDayOfCurrentWeek)
      date.setDate(date.getDate() + i)
      date.setUTCHours(0, 0, 0, 0)
      dates.push(date.toISOString())
    }

    let endDate = new Date(dates[5])

    setDisplayWeek(dates)

    setDisplayMonthYear(
      endDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
    )

    console.log('next week:', dates)
    getQuestionsForWeek(dates)
  }

  const prevMonth = () => {
    const current = new Date(displayWeek[5])
    console.log('current', current, current.toISOString())
    let year = current.getUTCFullYear()
    let month = current.getUTCMonth() - 1

    if (month === -1) {
      year--
      month = 11
    }

    const firstDayOfMonth = new Date(year, month, 1)
    console.log(
      'firstDayOfMonth',
      firstDayOfMonth,
      firstDayOfMonth.toISOString()
    )
    const dayOfWeek = firstDayOfMonth.getDay()

    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek)
    console.log('startDate', startDate, startDate.toISOString())

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      date.setUTCHours(0, 0, 0, 0)
      dates.push(date.toISOString())
    }

    setDisplayWeek(dates)

    let endDate = new Date(dates[5])

    console.log(
      'end date while prev month: ',
      endDate.toISOString(),
      endDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    )

    setDisplayMonthYear(
      endDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
    )

    console.log('prev month: ', dates)

    getQuestionsForWeek(dates)
  }

  const nextMonth = () => {
    const current = new Date(displayWeek[5])
    let year = current.getUTCFullYear()
    let month = current.getUTCMonth() + 1

    if (month === 12) {
      year++
      month = 0
    }

    const firstDayOfMonth = new Date(year, month, 1)
    let dayOfWeek = firstDayOfMonth.getDay()

    if (dayOfWeek === 6) {
      dayOfWeek = -1
    }

    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      date.setUTCHours(0, 0, 0, 0)
      dates.push(date.toISOString())
    }

    console.log('next month: ', dates)

    setDisplayWeek(dates)

    let endDate = new Date(dates[5])

    setDisplayMonthYear(
      endDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
    )

    getQuestionsForWeek(dates)
  }

  const isDateMatch = (dateToCheck, arrayOfObjects) => {
    return arrayOfObjects.some(obj => {
      return obj.active_from_date == dateToCheck
    })
  }

  useEffect(() => {
    getQuestionsForWeek(getCurrentWeekDates())

    let date = new Date()

    setDisplayMonthYear(
      date.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
    )
  }, [])

  return (
    <>
      <Container className='question' fluid>
        <Row className='row px-4 py-3'>
          <div className='heading'>
            <h1>Question of the Day / Week</h1>
          </div>
        </Row>
        <div className='month-heading d-flex justify-content-center'>
          <h3 className='month-heading mx-4 my-0'>
            <i
              style={{ color: 'var(--main-orange)' }}
              className='bi bi-caret-left align-self-center me-5 hover'
              onClick={prevMonth}
            />
            {displayMonthYear}
            <i
              style={{ color: 'var(--main-orange)' }}
              className='bi bi-caret-right align-self-center ms-5 hover'
              onClick={nextMonth}
            ></i>
          </h3>
        </div>
        {dayQuestions.length >= 0 && (
          <>
            <Row className='m-3 question-row'>
              <Col className='mx-1'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <i
                      style={{ color: 'var(--main-orange)' }}
                      className='bi bi-caret-left align-self-center fs-4 hover'
                      onClick={prevWeek}
                    />
                    <div
                      className={isActive(displayWeek[1]) ? 'current-day' : ''}
                    >
                      <p>{displayWeek?.[1]?.slice(8, 10)}</p>
                      <p>Monday</p>
                    </div>
                    <i
                      style={{ color: 'white' }}
                      className='bi bi-caret-left align-self-center '
                    />
                  </div>

                  {isDateMatch(displayWeek[1], dayQuestions) ? (
                    <div
                      className='question-card p-2'
                      onClick={() => {
                        handleQuestionDetailsPage(dayQuestions[0]?._id)
                      }}
                    >
                      <p>{dayQuestions[0]?.question}</p>
                      <p>
                        Topic:{' '}
                        <span className='bold'>{dayQuestions[0]?.topic}</span>
                      </p>
                      <p>
                        Points:{' '}
                        <img className='' height='30px' src={shell} alt='' />
                        <span className='bold'>{dayQuestions[0]?.points}</span>
                      </p>
                    </div>
                  ) : (
                    <div className='question-card p-2'>
                      <p>Releasing Soon ...</p>
                    </div>
                  )}
                </div>
              </Col>
              <Col className='mx-1'>
                <div>
                  <div
                    className={isActive(displayWeek[2]) ? 'current-day' : ''}
                  >
                    <p>{displayWeek?.[2]?.slice(8, 10)}</p>
                    <p>Tuesday</p>
                  </div>
                  {isDateMatch(displayWeek[2], dayQuestions) ? (
                    <div
                      className='question-card p-2'
                      onClick={() => {
                        handleQuestionDetailsPage(dayQuestions[1]?._id)
                      }}
                    >
                      <p>{dayQuestions[1]?.question}</p>
                      <p>
                        Topic:{' '}
                        <span className='bold'>{dayQuestions[1]?.topic}</span>
                      </p>
                      <p>
                        Points:{' '}
                        <img className='' height='30px' src={shell} alt='' />
                        <span className='bold'>{dayQuestions[1]?.points}</span>
                      </p>
                    </div>
                  ) : (
                    <div className='question-card p-2'>
                      <p>Releasing Soon ...</p>
                    </div>
                  )}
                </div>
              </Col>
              <Col className='mx-1'>
                <div>
                  <div
                    className={isActive(displayWeek[3]) ? 'current-day' : ''}
                  >
                    <p>{displayWeek?.[3]?.slice(8, 10)}</p>
                    <p>Wednesday</p>
                  </div>
                  {isDateMatch(displayWeek[3], dayQuestions) ? (
                    <div
                      className='question-card p-2'
                      onClick={() => {
                        handleQuestionDetailsPage(dayQuestions[2]?._id)
                      }}
                    >
                      <p>{dayQuestions[2]?.question}</p>
                      <p>
                        Topic:{' '}
                        <span className='bold'> {dayQuestions[1]?.topic}</span>
                      </p>
                      <p>
                        Points:{' '}
                        <img className='' height='30px' src={shell} alt='' />
                        <span className='bold'>{dayQuestions[1]?.points}</span>
                      </p>
                    </div>
                  ) : (
                    <div className='question-card p-2'>
                      <p>Releasing Soon ...</p>
                    </div>
                  )}
                </div>
              </Col>
              <Col className='mx-1'>
                <div>
                  <div
                    className={isActive(displayWeek[4]) ? 'current-day' : ''}
                  >
                    <p>{displayWeek?.[4]?.slice(8, 10)}</p>
                    <p>Thursday</p>
                  </div>
                  {isDateMatch(displayWeek[4], dayQuestions) ? (
                    <div
                      className='question-card p-2'
                      onClick={() => {
                        handleQuestionDetailsPage(dayQuestions[3]?._id)
                      }}
                    >
                      <p>{dayQuestions[3]?.question}</p>
                      <p>
                        Topic:{' '}
                        <span className='bold'> {dayQuestions[3]?.topic}</span>
                      </p>
                      <p>
                        Points:{' '}
                        <img className='' height='30px' src={shell} alt='' />
                        <span className='bold'>
                          {dayQuestions?.[3]?.points}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className='question-card p-2'>
                      <p>Releasing Soon ...</p>
                    </div>
                  )}
                </div>
              </Col>
              <Col className='mx-1'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <i
                      style={{ color: 'white' }}
                      className='bi bi-caret-left align-self-center '
                    />
                    <div
                      className={isActive(displayWeek[5]) ? 'current-day' : ''}
                    >
                      <p>{displayWeek?.[5]?.slice(8, 10)}</p>
                      <p>Friday</p>
                    </div>
                    <i
                      style={{ color: 'var(--main-orange)' }}
                      className='bi bi-caret-right align-self-center fs-4 hover'
                      onClick={nextWeek}
                    />
                  </div>
                  {isDateMatch(displayWeek[5], dayQuestions) ? (
                    <div
                      className='question-card p-2'
                      onClick={() => {
                        handleQuestionDetailsPage(dayQuestions?.[4]?._id)
                      }}
                    >
                      <p>{dayQuestions?.[4]?.question}</p>
                      <p>
                        Topic:{' '}
                        <span className='bold'>{dayQuestions?.[4]?.topic}</span>
                      </p>
                      <p>
                        Points:{' '}
                        <img className='' height='30px' src={shell} alt='' />
                        <span className='bold'>
                          {dayQuestions?.[4]?.points}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className='question-card p-2'>
                      <p>Releasing Soon ...</p>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
            <Row className='m-2 mt-4'>
              <Col className='mx-3'>
                {weekQuestion && Object.keys(weekQuestion).length != 0 ? (
                  <div
                    className='question-card card-week p-2'
                    onClick={() => {
                      handleQuestionDetailsPage(weekQuestion?._id)
                    }}
                  >
                    <p>{weekQuestion.question}</p>
                    <p>
                      Topic: <span className='bold'>{weekQuestion?.topic}</span>
                    </p>
                    <p>
                      Points:{' '}
                      <img className='' height='30px' src={shell} alt='' />
                      <span className='bold'>{weekQuestion.points}</span>
                    </p>
                  </div>
                ) : (
                  <div className='question-card card-week p-2'>
                    <p>Releasing Soon ...</p>
                  </div>
                )}
              </Col>
            </Row>
          </>
        )}
      </Container>
    </>
  )
}

export default Question
