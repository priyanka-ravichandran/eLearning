import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { 
  useGetActiveIndividualQuestionQuery, 
  useSubmitIndividualAnswerMutation,
  useGetStudentAnswerForTodayQuery 
} from '../../redux/api/individualDailyQuestionApi';
import { useMyContext } from '../../MyContextProvider';
import shell from '../../Images/shell.png';
import './IndividualDailyQuestion.css';

const IndividualDailyQuestion = () => {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const userData = useSelector((state) => state.user.user);
  const { studentDetails, setStudentDetails } = useMyContext();
  const student_details = studentDetails || JSON.parse(localStorage.getItem("student_details"));
  
  // Get student ID from multiple sources
  const studentId = userData?._id || student_details?.student?._id;
  
  // API hooks
  const { data: questionData, isLoading: questionLoading, error: questionError, refetch } = useGetActiveIndividualQuestionQuery();
  const [submitIndividualAnswer] = useSubmitIndividualAnswerMutation();
  const { data: studentAnswerData, isLoading: answerLoading } = useGetStudentAnswerForTodayQuery(
    studentId,
    { skip: !studentId }
  );
  
  const question = questionData?.data?.question;
  const hasAnswered = studentAnswerData?.data?.has_answered;
  const studentAnswer = studentAnswerData?.data?.answer_details;
  
  // Calculate time remaining
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    if (question?.end_time) {
      const timer = setInterval(() => {
        const now = new Date();
        const endTime = new Date(question.end_time);
        const diff = endTime - now;
        
        if (diff <= 0) {
          setTimeRemaining('Question Closed');
          setIsActive(false);
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
          setIsActive(question.status === 'active');
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [question?.end_time, question?.status]);
  
  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error('Please enter your answer');
      return;
    }
    
    if (!studentId) {
      toast.error('Student ID not found. Please log in.');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await submitIndividualAnswer({
        question_id: question._id,
        student_id: studentId,
        answer: answer.trim()
      }).unwrap();
      
      toast.success(response.message || 'Answer submitted successfully!');
      setAnswer('');
      refetch(); // Refresh the question data
      
      // Show achievement notification if points were awarded
      if (response.achievement) {
        setTimeout(() => {
          toast.success(`🏆 ${response.achievement.reason} - ${response.achievement.points} points!`, {
            autoClose: 5000
          });
        }, 1000);
        
        // Refresh student details to update points in header and other components
        if (studentId) {
          console.log('🔄 Refreshing student details after individual question submission...');
          try {
            const res = await fetch(`http://localhost:3000/student/get_student_details`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ student_id: studentId }),
            });
            const data = await res.json();
            
            if (data.status && data.data && data.data.student) {
              const newStudentDetails = { student: data.data.student };
              localStorage.setItem("student_details", JSON.stringify(newStudentDetails));
              setStudentDetails(newStudentDetails);
              
              // Broadcast the update
              window.dispatchEvent(new CustomEvent('localStorageUpdate', {
                detail: {
                  key: 'student_details',
                  value: JSON.stringify(newStudentDetails)
                }
              }));
              
              console.log('✅ Student details refreshed after individual question points');
            }
          } catch (error) {
            console.error('Error refreshing student details:', error);
          }
        }
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  if (!studentId) {
    return (
      <Card className="individual-question-card">
        <Card.Body className="text-center">
          <Alert variant="warning">
            <h6>⚠️ Student Not Found</h6>
            <p className="mb-0">Please log in to view the daily math question.</p>
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  if (questionLoading || answerLoading) {
    return (
      <Card className="individual-question-card">
        <Card.Body className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading today's math question...</p>
        </Card.Body>
      </Card>
    );
  }
  
  if (questionError || !question) {
    return (
      <Card className="individual-question-card">
        <Card.Body className="text-center">
          <Alert variant="info">
            <h6>📚 No Math Question Today</h6>
            <p className="mb-0">Check back at 12:01 AM for today's question!</p>
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  const isClosed = !isActive || new Date() > new Date(question.end_time);
  
  return (
    <Card className="individual-question-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <h6 className="mb-0">🧮 Daily Math Question</h6>
          <Badge bg={isActive ? 'success' : isClosed ? 'secondary' : 'warning'} className="ms-2">
            {isActive ? 'ACTIVE' : isClosed ? 'CLOSED' : 'SCHEDULED'}
          </Badge>
        </div>
        <div className="d-flex align-items-center">
          <img src={shell} alt="points" height="20" className="me-1" />
          <span className="fw-bold">Up to 10 pts</span>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="question-info">
          <p className="question-text mb-3">{question.question}</p>
          <Row className="mb-3">
            <Col md={6}>
              <div className="info-item">
                <strong>Topic:</strong> {question.topic}
              </div>
            </Col>
            <Col md={6}>
              <div className="info-item">
                <strong>Difficulty:</strong> 
                <Badge bg={
                  question.difficulty_level === 'easy' ? 'success' : 
                  question.difficulty_level === 'medium' ? 'warning' : 'danger'
                } className="ms-1">
                  {question.difficulty_level?.toUpperCase()}
                </Badge>
              </div>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <div className="info-item">
                <strong>Available:</strong> {formatTime(question.start_time)}
              </div>
            </Col>
            <Col md={6}>
              <div className="info-item">
                <strong>Closes:</strong> {formatTime(question.end_time)}
              </div>
            </Col>
          </Row>
          
          {isActive && (
            <div className="mt-3">
              <Alert variant="info">
                <strong>⏰ {timeRemaining}</strong>
                <br />
                <small>Answer correctly to earn up to 10 individual points!</small>
              </Alert>
            </div>
          )}
        </div>
        
        {/* Student Answer Section */}
        {hasAnswered && studentAnswer ? (
          <Card className="mt-4">
            <Card.Header>
              <h6 className="mb-0">✅ Your Answer</h6>
            </Card.Header>
            <Card.Body>
              <p><strong>Your Answer:</strong> {studentAnswer.answer}</p>
              <Row>
                <Col md={4}>
                  <div className="score-display">
                    <strong>AI Score:</strong> 
                    <span className="ms-2 score-value">{studentAnswer.llm_score}/10</span>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="points-display">
                    <strong>Points Earned:</strong> 
                    <span className="ms-2 points-value">+{studentAnswer.points_earned}</span>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="time-display">
                    <strong>Submitted:</strong> 
                    <span className="ms-2">{formatTime(studentAnswer.submission_time)}</span>
                  </div>
                </Col>
              </Row>
              
              {studentAnswer.llm_feedback && (
                <div className="mt-3">
                  <Alert variant={studentAnswer.llm_feedback.is_correct ? 'success' : 'warning'}>
                    <strong>AI Feedback:</strong> {studentAnswer.llm_feedback.explanation}
                    {studentAnswer.llm_feedback.solution && (
                      <div className="mt-2">
                        <strong>Solution:</strong> {studentAnswer.llm_feedback.solution}
                      </div>
                    )}
                  </Alert>
                </div>
              )}
            </Card.Body>
          </Card>
        ) : isActive && !hasAnswered ? (
          <Card className="mt-4">
            <Card.Header>
              <h6 className="mb-0">📝 Submit Your Answer</h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Your Answer:</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your answer (numbers only)"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={submitting}
                  />
                  <Form.Text className="text-muted">
                    Enter just the numerical answer (e.g., "42" or "3.14")
                  </Form.Text>
                </Form.Group>
                <Button 
                  variant="primary" 
                  onClick={handleSubmit}
                  disabled={submitting || !answer.trim()}
                  className="w-100"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        ) : (
          <Alert variant="secondary" className="mt-4">
            {isClosed ? 
              "This question is now closed. Check back tomorrow at 10:32 AM for the next one!" :
              "This question is not yet active. It will open at 12:01 AM."
            }
          </Alert>
        )}
        
        {/* Participants Info */}
        <div className="mt-3 text-center">
          <small className="text-muted">
            Total participants today: <strong>{question.total_participants || 0}</strong>
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default IndividualDailyQuestion;
