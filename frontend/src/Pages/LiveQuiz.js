import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useMyContext } from '../MyContextProvider';
import UserAvatar from '../components/UserAvatar';
import './LiveQuiz.css';

const socket = io('http://localhost:3000'); // Update if deployed

function LiveQuiz() {
  const { studentDetails, refreshStudentDetails } = useMyContext();
  const [quizActive, setQuizActive] = useState(false);
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState('');
  const [timer, setTimer] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0); // For manual re-render
  const timerRef = useRef();

  // Helper: robust group membership check
  const getGroupId = () => {
    const group = studentDetails?.student?.group;
    if (!group) return null;
    if (typeof group === 'string') return group;
    return group._id || group.id || null;
  };

  useEffect(() => {
    // Debug logs
    console.log('LiveQuiz MOUNT studentDetails:', studentDetails);
    console.log('LiveQuiz MOUNT group:', studentDetails?.student?.group);

    // Listen for localStorageUpdate event to refresh context/state
    const handleLocalStorageUpdate = () => {
      console.log('LiveQuiz: localStorageUpdate event received');
      if (refreshStudentDetails) {
        refreshStudentDetails();
      }
      setForceUpdate(f => f + 1); // Force re-render if context doesn't update
    };
    window.addEventListener('localStorageUpdate', handleLocalStorageUpdate);

    return () => {
      window.removeEventListener('localStorageUpdate', handleLocalStorageUpdate);
    };
  }, []);

  useEffect(() => {
    // Debug logs on context change
    console.log('LiveQuiz studentDetails updated:', studentDetails);
    console.log('LiveQuiz group updated:', studentDetails?.student?.group);

    const groupId = getGroupId();
    if (groupId && studentDetails?.student?._id) {
      socket.emit('joinQuiz', {
        groupId,
        userId: studentDetails.student._id
      });
    }
    socket.on('quizStarted', ({ question, quizStartTime, serverTime, answers: initialAnswers }) => {
      setQuizActive(true);
      setQuestion(question);
      setSelected('');
      // Timer sync using server time
      const QUIZ_DURATION = 15 * 60; // 15 minutes in seconds
      if (quizStartTime && serverTime) {
        const now = Date.now();
        const offset = now - serverTime; // client-server clock diff
        const elapsed = Math.floor((now - quizStartTime - offset) / 1000);
        const remaining = QUIZ_DURATION - elapsed;
        setTimer(remaining > 0 ? remaining : 0);
      } else if (quizStartTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - quizStartTime) / 1000);
        const remaining = QUIZ_DURATION - elapsed;
        setTimer(remaining > 0 ? remaining : 0);
      } else {
        setTimer(QUIZ_DURATION);
      }
      setAnswers(initialAnswers || []);
      // If any answer exists, block all users
      if (initialAnswers && initialAnswers.length > 0) {
        // If this user already answered, set selected
        const myAnswer = initialAnswers.find(a => a.userId === studentDetails.student._id);
        if (myAnswer) setSelected(myAnswer.answer);
      }
    });
    socket.on('quizInactive', () => {
      setQuizActive(false);
      setQuestion(null);
      setTimer(0);
      setAnswers([]);
      setSelected('');
    });
    socket.on('answerUpdate', ({ answers: updatedAnswers }) => {
      setAnswers(updatedAnswers || []);
      // If any answer exists, set selected to the group's answer for all users
      if (updatedAnswers && updatedAnswers.length > 0) {
        setSelected(updatedAnswers[0].answer); // Always show the group's answer
      } else {
        setSelected('');
      }
    });
    return () => {
      socket.off('quizStarted');
      socket.off('quizInactive');
      socket.off('answerUpdate');
    };
  }, [studentDetails, forceUpdate]);

  // Timer countdown
  useEffect(() => {
    if (quizActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else {
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [quizActive, timer]);

  const handleAnswer = (ans) => {
    setSelected(ans);
    socket.emit('submitAnswer', {
      groupId: getGroupId(),
      userId: studentDetails.student._id,
      answer: ans
    });
  };

  // DEBUG: Log studentDetails structure
  console.log('studentDetails:', studentDetails);

  const handleStartQuiz = async () => {
    const groupId = getGroupId();
    if (!studentDetails.student || !groupId) {
      alert('You must join a group to start the quiz.');
      return;
    }
    await fetch(`http://localhost:3000/test-start-quiz?groupId=${groupId}`);
  };

  const handleEndQuiz = async () => {
    const groupId = getGroupId();
    if (!studentDetails.student || !groupId) {
      alert('You must join a group to end the quiz.');
      return;
    }
    await fetch(`http://localhost:3000/test-end-quiz?groupId=${groupId}`);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="live-quiz-container">
      <h2 className="quiz-title">📝 Weekly Live Quiz</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={handleStartQuiz} className="quiz-option-btn" style={{ marginRight: 8 }} disabled={!studentDetails.student || !getGroupId()}>Start Test Quiz</button>
        <button onClick={handleEndQuiz} className="quiz-option-btn" disabled={!studentDetails.student || !getGroupId()}>End Test Quiz</button>
      </div>
      {!studentDetails.student || !getGroupId() ? (
        <div className="quiz-inactive">
          <p>You must join a group to participate in the live quiz.</p>
        </div>
      ) : quizActive && question ? (
        <div className="quiz-card">
          <div className="quiz-header">
            <h4>{question.text}</h4>
            <div className="quiz-timer">⏰ {formatTime(timer)}</div>
          </div>
          <ul className="quiz-options">
            {question.options.map(opt => (
              <li key={opt}>
                <button
                  className={`quiz-option-btn${selected === opt ? ' selected' : ''}`}
                  disabled={answers.length > 0 || selected}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
          {selected && <p className="your-answer">Your answer: <b>{selected}</b></p>}
          <h5 className="live-answers-title">Live Answers:</h5>
          <ul className="live-answers-list">
            {answers.map((a, idx) => (
              <li key={idx} className="live-answer-item">
                <UserAvatar studentDetails={{ student: { _id: a.userId } }} size="24" round={true} />
                <span className="live-answer-user">{a.userId}</span>: <span className="live-answer-text">{a.answer}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="quiz-inactive">
          <p>No quiz is live right now. Please check back at <b>8:00 PM Sunday</b>!</p>
          <img src="https://cdn.pixabay.com/photo/2017/01/31/13/14/quiz-2024323_1280.png" alt="Quiz" className="quiz-image" />
        </div>
      )}
    </div>
  );
}

export default LiveQuiz;
