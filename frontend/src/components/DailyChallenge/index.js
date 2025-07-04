import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Badge, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { 
  useGetActiveChallengeQuery, 
  useSubmitGroupAnswerMutation,
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
  const [submitGroupAnswer] = useSubmitGroupAnswerMutation();
  const { data: leaderboardData } = useGetChallengeLeaderboardQuery(
    activeChallengeData?.data?.challenge?._id,
    { skip: !activeChallengeData?.data?.challenge?._id }
  );
  
  const challenge = activeChallengeData?.data?.challenge;
  const groupId = student_details?.group?._id;
  
  // Check if current user's group has already submitted
  const hasSubmitted = challenge?.group_submissions?.some(
    submission => String(submission.group_id) === String(groupId)
  );
  
  // Get current user's group submission if exists
  const groupSubmission = challenge?.group_submissions?.find(
    submission => String(submission.group_id) === String(groupId)
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
    
    if (!groupId) {
      toast.error('You must be in a group to participate');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await submitGroupAnswer({
        challenge_id: challenge._id,
        group_id: groupId,
        student_id: userData._id,
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
      <div className="daily-challenge-card">
        <div className="text-center p-4">
          <Spinner animation="border" role="status" />
          <div className="mt-2">Loading today's challenge...</div>
        </div>
      </div>
    );
  }
  
  if (challengeError || !challenge) {
    return (
      <div className="daily-challenge-card">
        <div className="text-center p-4">
          <h5>🌅 Daily Challenge</h5>
          <p className="text-muted">No active challenge today</p>
          <small>Check back at 10:00 AM for today's challenge!</small>
        </div>
      </div>
    );
  }
  
  const isActive = challenge.status === 'active';
  const isClosed = challenge.status === 'closed';
  
  return (
    <>
      <div className="daily-challenge-card" onClick={() => setShow(true)}>
        <Card className="h-100 challenge-card">
          <Card.Header className="challenge-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">🏆 Daily Challenge</h6>
              <Badge bg={isActive ? 'success' : isClosed ? 'secondary' : 'warning'}>
                {challenge.status.toUpperCase()}
              </Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="challenge-info">
              <p className="challenge-question">{challenge.question}</p>
              <div className="challenge-meta">
                <div className="topic-points">
                  <small><strong>Topic:</strong> {challenge.topic}</small>
                  <div className="points-display">
                    <img src={shell} alt="points" height="20" />
                    <span>{challenge.points}</span>
                  </div>
                </div>
                {isActive && (
                  <div className="time-remaining">
                    <small className="text-primary">{timeRemaining}</small>
                  </div>
                )}
              </div>
              {hasSubmitted && (
                <Badge bg="info" className="mt-2">
                  ✅ Your group has submitted
                </Badge>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
      
      {/* Challenge Modal */}
      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            🏆 Daily Challenge - {new Date(challenge.challenge_date).toLocaleDateString()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="challenge-details">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Badge bg={isActive ? 'success' : isClosed ? 'secondary' : 'warning'}>
                {challenge.status.toUpperCase()}
              </Badge>
              <div className="text-muted">
                <small>
                  {formatTime(challenge.start_time)} - {formatTime(challenge.end_time)}
                </small>
              </div>
            </div>
            
            <div className="challenge-info-detailed">
              <h5>{challenge.question}</h5>
              {challenge.description && (
                <p className="text-muted">{challenge.description}</p>
              )}
              
              <Row className="mt-3">
                <Col md={6}>
                  <div className="info-item">
                    <strong>Topic:</strong> {challenge.topic}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-item">
                    <strong>Points:</strong> 
                    <img src={shell} alt="points" height="20" className="ms-1 me-1" />
                    {challenge.points}
                  </div>
                </Col>
              </Row>
              
              {isActive && (
                <div className="mt-3">
                  <Alert variant="info">
                    <strong>⏰ {timeRemaining}</strong>
                    <br />
                    <small>Submit your group's answer quickly for bonus points!</small>
                  </Alert>
                </div>
              )}
            </div>
            
            {/* Group Submission Section */}
            {hasSubmitted ? (
              <Card className="mt-4">
                <Card.Header>
                  <h6 className="mb-0">✅ Your Group's Submission</h6>
                </Card.Header>
                <Card.Body>
                  <p><strong>Answer:</strong> {groupSubmission.answer}</p>
                  <Row>
                    <Col md={4}>
                      <small><strong>Score:</strong> {groupSubmission.llm_score}/10</small>
                    </Col>
                    <Col md={4}>
                      <small><strong>Time:</strong> {groupSubmission.time_taken_minutes} min</small>
                    </Col>
                    <Col md={4}>
                      <small><strong>Final Score:</strong> {groupSubmission.final_score}</small>
                    </Col>
                  </Row>
                  {groupSubmission.llm_feedback && (
                    <div className="mt-2">
                      <Alert variant={groupSubmission.llm_feedback.is_correct ? 'success' : 'warning'}>
                        <strong>AI Feedback:</strong> {groupSubmission.llm_feedback.explanation}
                      </Alert>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ) : isActive && groupId ? (
              <div className="mt-4">
                <h6>Submit Your Group's Answer</h6>
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Enter your group's answer here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={submitting}
                  />
                </Form.Group>
                <Button 
                  variant="primary" 
                  className="mt-3"
                  onClick={handleSubmit}
                  disabled={submitting || !answer.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit Group Answer'}
                </Button>
              </div>
            ) : !groupId ? (
              <Alert variant="warning" className="mt-4">
                You must be in a group to participate in daily challenges.
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
                  <p><strong>Group:</strong> {challenge.winner.group_id}</p>
                  <p><strong>Score:</strong> {challenge.winner.final_score}</p>
                  <p><strong>Time:</strong> {challenge.winner.time_taken_minutes} minutes</p>
                </Card.Body>
              </Card>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DailyChallenge;
