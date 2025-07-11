import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useMyContext } from '../MyContextProvider';
import UserAvatar from '../components/UserAvatar';
import './LiveQuiz.css';

const socket = io('http://localhost:3000'); // Update if deployed

function LiveQuiz() {
  const { studentDetails } = useMyContext();
  const [quizActive, setQuizActive] = useState(false);
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState('');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    if (studentDetails?.group?._id && studentDetails?.student?._id) {
      socket.emit('joinQuiz', {
        groupId: studentDetails.group._id,
        userId: studentDetails.student._id
      });
    }
    socket.on('quizStarted', ({ question }) => {
      setQuizActive(true);
      setQuestion(question);
      setAnswers([]);
      setSelected('');
      setTimer(15 * 60); // 15 minutes in seconds
    });
    socket.on('quizInactive', () => {
      setQuizActive(false);
      setQuestion(null);
      setTimer(0);
    });
    socket.on('answerUpdate', ({ userId, answer }) => {
      setAnswers(prev => [...prev, { userId, answer }]);
    });
    return () => {
      socket.off('quizStarted');
      socket.off('quizInactive');
      socket.off('answerUpdate');
    };
  }, [studentDetails]);

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
      groupId: studentDetails.group._id,
      userId: studentDetails.student._id,
      answer: ans
    });
  };

  const handleStartQuiz = async () => {
    await fetch('http://localhost:3000/test-start-quiz');
  };

  const handleEndQuiz = async () => {
    await fetch('http://localhost:3000/test-end-quiz');
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
        <button onClick={handleStartQuiz} className="quiz-option-btn" style={{ marginRight: 8 }}>Start Test Quiz</button>
        <button onClick={handleEndQuiz} className="quiz-option-btn">End Test Quiz</button>
      </div>
      {quizActive && question ? (
        <div className="quiz-card">
          <div className="quiz-header">
            <h4>{question.text}</h4>
            <div className="quiz-timer">⏰ {formatTime(timer)}</div>
          </div>
          <ul className="quiz-options">
            {question.options.map(opt => (
              <li key={opt}>
                <button className={`quiz-option-btn${selected === opt ? ' selected' : ''}`} disabled={!!selected} onClick={() => handleAnswer(opt)}>{opt}</button>
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
