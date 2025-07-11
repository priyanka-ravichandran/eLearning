import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Badge, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { 
  useGetActiveChallengeQuery, 
  useSubmitIndividualAnswerMutation,
  useGetChallengeLeaderboardQuery 
} from '../../redux/api/dailyChallengeApi';
import { useMyContext } from '../../MyContextProvider';
import shell from '../../Images/shell.png';
import './DailyChallenge.css';

const DailyChallenge = () => {
  const [show, setShow] = useState(false);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const userData = useSelector((state) => state.user.user);
  const { studentDetails } = useMyContext();
  const student_details = studentDetails || JSON.parse(localStorage.getItem("student_details"));
  
  // API hooks
  const { data: activeChallengeData, isLoading: challengeLoading, error: challengeError, refetch } = useGetActiveChallengeQuery();
  const [submitIndividualAnswer] = useSubmitIndividualAnswerMutation();
  const { data: leaderboardData } = useGetChallengeLeaderboardQuery(
    activeChallengeData?.data?.challenge?._id,
    { skip: !activeChallengeData?.data?.challenge?._id }
  );
  
  const challenge = activeChallengeData?.data?.challenge;
  const groupId = student_details?.group?._id;
  const studentId = userData?._id || student_details?.student?._id;
  
  // Check if current user has already submitted (individual-based)
  const hasSubmitted = challenge?.group_submissions?.some(
    submission => String(submission.student_id) === String(studentId)
  );
  
  // Get current user's submission if exists  
  const userSubmission = challenge?.group_submissions?.find(
    submission => String(submission.student_id) === String(studentId)
  );
  
  // Calculate time remaining
  const [timeRemaining, setTimeRemaining] = useState('');
  
  useEffect(() => {
    if (challenge?.end_time) {
      const timer = setInterval(() => {
        const now = new Date();
        const endTime = new Date(challenge.end_time);
        const diff = endTime - now;
        
        if (diff <= 0) {
          setTimeRemaining('Challenge Closed');
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [challenge?.end_time]);
  
  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error('Please enter your answer');
      return;
    }
    
    if (!studentId) {
      toast.error('Please log in to participate');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await submitIndividualAnswer({
        challenge_id: challenge._id,
        student_id: studentId,
        answer: answer.trim()
      }).unwrap();
      
      toast.success(response.message || 'Answer submitted successfully!');
      setAnswer('');
      setShow(false);
      refetch(); // Refresh the challenge data
      
      // Show achievement notification if points were awarded
      if (response.achievement) {
        setTimeout(() => {
          toast.success(`🏆 ${response.achievement.reason} - ${response.achievement.points} points!`, {
            autoClose: 5000
          });
        }, 1000);
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
  
  if (challengeLoading) {
    return (
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading daily challenge...</p>
      </div>
    );
  }
  
  if (challengeError || !challenge) {
    return (
      <Alert variant="info">
        <h6>📚 No Daily Challenge Today</h6>
        <p className="mb-0">Check back later for today's challenge!</p>
      </Alert>
    );
  }
  
  const isActive = challenge.status === 'active' && new Date() <= new Date(challenge.end_time);
  
  return (
    <>
      {/* Challenge Card */}
      <Card className="daily-challenge-card" onClick={() => setShow(true)} style={{ cursor: 'pointer' }}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h6 className="mb-0">🏆 Daily Challenge</h6>
            <Badge bg={isActive ? 'success' : 'secondary'} className="ms-2">
              {isActive ? 'ACTIVE' : 'CLOSED'}
            </Badge>
          </div>
          <div className="d-flex align-items-center">
            <img src={shell} alt="points" height="20" className="me-1" />
            <span className="fw-bold">{challenge.points} pts</span>
          </div>
        </Card.Header>
        <Card.Body>
          <p className="question-text mb-3">{challenge.question}</p>
          {challenge.description && (
            <p className="text-muted mb-3">{challenge.description}</p>
          )}
          
          <Row className="mb-3">
            <Col md={6}>
              <strong>Topic:</strong> {challenge.topic}
            </Col>
            <Col md={6}>
              <strong>Submissions:</strong> {challenge.group_submissions?.length || 0}
            </Col>
          </Row>
          
          {isActive && (
            <Alert variant="info" className="mb-0">
              <strong>⏰ {timeRemaining}</strong>
              <br />
              <small>Submit your answer to earn up to {challenge.points} points!</small>
            </Alert>
          )}
          
          {hasSubmitted && (
            <Alert variant="success" className="mb-0">
              <strong>✅ Answer Submitted!</strong>
              <br />
              <small>Click to view your results</small>
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Challenge Modal */}
      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            🏆 Daily Challenge - {new Date(challenge.challenge_date).toLocaleDateString()}
            <Badge bg={isActive ? 'success' : 'secondary'} className="ms-2">
              {isActive ? 'ACTIVE' : 'CLOSED'}
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="challenge-info">
            <h5 className="question-text mb-3">{challenge.question}</h5>
            {challenge.description && (
              <p className="text-muted mb-3">{challenge.description}</p>
            )}
            
            <Row className="mb-3">
              <Col md={4}>
                <strong>Topic:</strong> {challenge.topic}
              </Col>
              <Col md={4}>
                <strong>Points:</strong> {challenge.points}
              </Col>
              <Col md={4}>
                <strong>Available:</strong> {formatTime(challenge.start_time)} - {formatTime(challenge.end_time)}
              </Col>
            </Row>
            
            {isActive && (
              <Alert variant="info">
                <strong>⏰ {timeRemaining}</strong>
                <br />
                <small>Answer correctly to earn up to {challenge.points} individual points!</small>
              </Alert>
            )}
          </div>

          {/* User's Previous Answer */}
          {hasSubmitted && userSubmission ? (
            <Card className="mt-4">
              <Card.Header>
                <h6 className="mb-0">✅ Your Answer</h6>
              </Card.Header>
              <Card.Body>
                <p><strong>Answer:</strong> {userSubmission.answer}</p>
                <Row>
                  <Col md={4}>
                    <small><strong>Score:</strong> {userSubmission.llm_score}/10</small>
                  </Col>
                  <Col md={4}>
                    <small><strong>Time:</strong> {userSubmission.time_taken_minutes} min</small>
                  </Col>
                  <Col md={4}>
                    <small><strong>Final Score:</strong> {userSubmission.final_score}</small>
                  </Col>
                </Row>
                {userSubmission.llm_feedback && (
                  <div className="mt-3">
                    <Alert variant={userSubmission.llm_feedback.is_correct ? 'success' : 'warning'}>
                      <strong>AI Feedback:</strong> {userSubmission.llm_feedback.explanation}
                    </Alert>
                  </div>
                )}
              </Card.Body>
            </Card>
          ) : isActive && !hasSubmitted ? (
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
                      placeholder="Enter your answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={submitting}
                    />
                    <Form.Text className="text-muted">
                      Enter your best answer to this challenge
                    </Form.Text>
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          ) : !studentId ? (
            <Alert variant="warning" className="mt-4">
              Please log in to participate in daily challenges.
            </Alert>
          ) : (
            <Alert variant="secondary" className="mt-4">
              This challenge is no longer accepting submissions.
            </Alert>
          )}
          
          {/* Current Winner Display */}
          {challenge.winner && (
            <Card className="mt-4">
              <Card.Header>
                <h6 className="mb-0">🏆 Current Leader</h6>
              </Card.Header>
              <Card.Body>
                <p><strong>Best Score:</strong> {challenge.winner.final_score}</p>
                <p><strong>Time Taken:</strong> {challenge.winner.time_taken_minutes} minutes</p>
              </Card.Body>
            </Card>
          )}
          
          {/* Leaderboard */}
          {leaderboardData?.data && leaderboardData.data.length > 0 && (
            <Card className="mt-4">
              <Card.Header>
                <h6 className="mb-0">📊 Top Submissions</h6>
              </Card.Header>
              <Card.Body>
                {leaderboardData.data.slice(0, 5).map((submission, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <span>#{index + 1}</span>
                    <span>Score: {submission.final_score}</span>
                    <span>{submission.time_taken_minutes}m</span>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isActive && !hasSubmitted && (
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={submitting || !answer.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Your Answer'}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DailyChallenge;
