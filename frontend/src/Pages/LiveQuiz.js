import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useMyContext } from '../MyContextProvider';
import UserAvatar from '../components/UserAvatar';
import './LiveQuiz.css';
import '../overlay-debug.css'; // DEBUG: highlight overlays and force pointer events

const socket = io('http://localhost:3000'); // Update if deployed

function LiveQuiz() {
  const { studentDetails, refreshStudentDetails } = useMyContext();
  const [quizActive, setQuizActive] = useState(false);
  const [questions, setQuestions] = useState([]); // Array of 5 questions
  const [currentIdx, setCurrentIdx] = useState(0); // Current question index
  const [answers, setAnswers] = useState([]); // Array of user's answers
  const [selected, setSelected] = useState(''); // Selected option for current question
  const [timer, setTimer] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0); // For manual re-render
  const [syncing, setSyncing] = useState(false); // Real-time sync state
  const [lockedQuestions, setLockedQuestions] = useState({}); // Track locked questions
  const timerRef = useRef();
  const userId = studentDetails?.student?._id || studentDetails?.student?.id || '';

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

  // Timer countdown
  useEffect(() => {
    if (quizActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else {
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [quizActive, timer]);

  // When quiz starts, fetch questions
  const handleStartQuiz = async () => {
    const groupId = getGroupId();
    if (!studentDetails.student || !groupId) {
      alert('You must join a group to start the quiz.');
      return;
    }
    setQuizActive(true);
    setCurrentIdx(0);
    setAnswers([]);
    setSelected('');
    try {
      const res = await fetch('http://localhost:3000/api/generate-math-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });
      const data = await res.json();
      console.log('Quiz API response:', data); // Debug log
      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        // Use backend startTime for timer sync
        const QUIZ_DURATION = 15 * 60; // 15 min in seconds
        const now = Date.now();
        const elapsed = Math.floor((now - data.startTime) / 1000);
        const remaining = QUIZ_DURATION - elapsed;
        console.log('Quiz startTime:', data.startTime, 'Now:', now, 'Elapsed:', elapsed, 'Remaining:', remaining);
        if (remaining > 0 && data.questions.length > 0) {
          setTimer(remaining);
        } else {
          setQuizActive(false);
          setQuestions([]);
          setTimer(0);
          alert('Quiz session has expired or no questions available. Please try again.');
        }
      } else {
        alert('Failed to fetch quiz questions.');
        setQuizActive(false);
      }
    } catch (err) {
      alert('Error fetching quiz questions.');
      setQuizActive(false);
      console.error('Quiz fetch error:', err);
    }
  };

  // Debug: log answers and selected on every render
  useEffect(() => {
    console.log('[RENDER] answers:', JSON.stringify(answers), 'selected:', selected, 'currentIdx:', currentIdx);
    answers.forEach((a, i) => {
      if (a) console.log(`[RENDER] Q${i+1}: answered by ${a.by}, value: ${a.answer}`);
    });
  });

  // Join the room after you know the student's group
  useEffect(() => {
    const gid = getGroupId();
    if (gid) socket.emit('joinGroupQuiz', { groupId: gid });
  }, [studentDetails]);

  // Listen for quiz state updates from socket.io
  useEffect(() => {
    const groupId = getGroupId();
    if (!groupId || !userId) return;
    setSyncing(true);

    // Listen for questionLocked event
    socket.on('questionLocked', ({ questionIdx }) => {
      setLockedQuestions(prev => ({ ...prev, [questionIdx]: true }));
    });

    socket.on('quizState', (state) => {
      setSyncing(false);
      console.log('[SOCKET] quizState received:', JSON.stringify(state.answers));
      if (state.quizActive) {
        setQuizActive(true);
        setCurrentIdx(state.currentQuestionIdx ?? 0);
        // Map answers: for each question, get the answer value and who answered
        if (Array.isArray(state.answers)) {
          // For each question, get { answer: value, by: userId } or null
          const mappedAnswers = state.answers.map(ansObj => {
            if (ansObj && Object.keys(ansObj).length > 0) {
              const by = Object.keys(ansObj)[0];
              return { answer: ansObj[by], by };
            }
            return null;
          });
          setAnswers(mappedAnswers);
          // Set selected if this user answered this question
          const curr = state.currentQuestionIdx ?? 0;
          if (mappedAnswers[curr] && mappedAnswers[curr].by === userId) {
            setSelected(mappedAnswers[curr].answer);
          } else {
            setSelected('');
          }
        }
        setForceUpdate(f => f + 1); // Force re-render on every socket update
      } else {
        setQuizActive(false);
      }
    });
    socket.on('quizInactive', () => {
      setQuizActive(false);
      setSyncing(false);
    });
    socket.on('answerBlocked', ({ questionIdx, answeredBy }) => {
      alert('This question has already been answered by another group member.');
    });
    return () => {
      socket.off('quizState');
      socket.off('quizInactive');
      socket.off('answerBlocked');
      socket.off('questionLocked');
    };
    // eslint-disable-next-line
  }, [studentDetails, forceUpdate]);

  // Track who answered each question
  const [answeredByMap, setAnsweredByMap] = useState({});

  // Helper: is this question already answered by anyone or locked?
  const isAnsweredByAnyone = (idx) => {
    return (answers[idx] !== null && answers[idx] !== undefined) || lockedQuestions[idx];
  };
  // Helper: who answered this question?
  const getAnsweredBy = (idx) => {
    return answers[idx]?.by || null;
  };

  // Emit answer selection to socket
  const handleAnswer = (ans) => {
    if (isAnsweredByAnyone(currentIdx)) {
      alert('Already answered by a group member.');
      return;
    }
    const groupId = getGroupId();
    if (groupId && userId) {
      // Use the correct event name
      socket.emit('answerQuestion', { groupId, questionIdx: currentIdx, answer: ans });
    }
  };

  // Emit navigation to socket
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const groupId = getGroupId();
      if (groupId) socket.emit('navigateQuestion', { groupId, questionIdx: currentIdx + 1 });
      setCurrentIdx(currentIdx + 1);
      setSelected(answers[currentIdx + 1] || '');
    }
  };
  const handlePrev = () => {
    if (currentIdx > 0) {
      const groupId = getGroupId();
      if (groupId) socket.emit('navigateQuestion', { groupId, questionIdx: currentIdx - 1 });
      setCurrentIdx(currentIdx - 1);
      setSelected(answers[currentIdx - 1] || '');
    }
  };

  // End quiz manually
  const handleEndQuiz = () => {
    setQuizActive(false);
    setQuestions([]);
    setAnswers([]);
    setCurrentIdx(0);
    setSelected('');
    setTimer(0);
    alert('Quiz ended. Your answers: ' + JSON.stringify(answers));
  };

  // Auto end quiz when timer runs out
  useEffect(() => {
    if (quizActive && timer === 0) {
      handleEndQuiz();
    }
  }, [quizActive, timer]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="live-quiz-container">
      <h2 className="quiz-title" style={{ color: '#2d3a4b', fontWeight: 700, marginBottom: 24, letterSpacing: 1 }}>
        <span role="img" aria-label="quiz">📝</span> Weekly Live Quiz
      </h2>
      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={handleStartQuiz}
          className="quiz-option-btn"
          style={{ marginRight: 8, background: '#2563eb', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, boxShadow: '0 2px 8px #2563eb22' }}
          disabled={!studentDetails.student || !getGroupId() || quizActive}
        >
          Start Test Quiz
        </button>
        <button
          onClick={handleEndQuiz}
          className="quiz-option-btn"
          style={{ background: '#e11d48', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, boxShadow: '0 2px 8px #e11d4822' }}
          disabled={!quizActive}
        >
          End Test Quiz
        </button>
      </div>
      {!studentDetails.student || !getGroupId() ? (
        <div className="quiz-inactive" style={{ background: '#f8fafc', borderRadius: 12, padding: 32, boxShadow: '0 2px 12px #0001' }}>
          <p style={{ color: '#64748b', fontSize: 18 }}>You must join a group to participate in the live quiz.</p>
        </div>
      ) : quizActive && questions.length > 0 ? (
        <div className="quiz-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 32, maxWidth: 500, margin: '0 auto' }}>
          <div className="quiz-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ color: '#334155', fontWeight: 600, fontSize: 20 }}>Question {currentIdx + 1} of {questions.length}</h4>
            <div className="quiz-timer" style={{ color: '#f59e42', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="timer">⏰</span> {formatTime(timer)}
            </div>
          </div>
          <div className="quiz-question-text" style={{ color: '#1e293b', fontSize: 22, fontWeight: 500, marginBottom: 20, textAlign: 'center' }}>{questions[currentIdx].text}</div>
          <ul className="quiz-options" style={{ padding: 0, background: 'none', border: 'none', marginBottom: 16 }}>
            {questions[currentIdx].options.map(opt => {
              // Only disable if this user or another group member has already answered
              const isLocked = isAnsweredByAnyone(currentIdx) && getAnsweredBy(currentIdx) !== userId;
              const isSelected = selected === opt && getAnsweredBy(currentIdx) === userId;
              return (
                <li key={opt} style={{ margin: '10px 0', listStyle: 'none' }}>
                  <button
                    className={`quiz-option-btn${isSelected ? ' selected' : ''}`}
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      fontSize: 18,
                      borderRadius: 8,
                      border: 'none',
                      background: isSelected ? '#2563eb' : '#f8fafc',
                      color: isSelected ? '#fff' : '#1e293b',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked && !isSelected ? 0.6 : 1,
                      boxShadow: 'none',
                    }}
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) {
                        handleAnswer(opt);
                      }
                    }}
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>
          {selected && getAnsweredBy(currentIdx) === userId && (
            <p className="your-answer" style={{ color: '#16a34a', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Your answer: <b>{selected}</b></p>
          )}
          {isAnsweredByAnyone(currentIdx) && getAnsweredBy(currentIdx) !== userId && (
            <p className="your-answer" style={{ color: '#e11d48', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Answered by another group member.</p>
          )}
          <div className="quiz-nav-btns" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button onClick={handlePrev} disabled={currentIdx === 0} className="quiz-option-btn" style={{ background: '#f1f5f9', color: '#2563eb', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, border: '1px solid #2563eb', opacity: currentIdx === 0 ? 0.5 : 1 }}>Previous</button>
            <button onClick={handleNext} disabled={currentIdx === questions.length - 1} className="quiz-option-btn" style={{ background: '#f1f5f9', color: '#2563eb', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, border: '1px solid #2563eb', opacity: currentIdx === questions.length - 1 ? 0.5 : 1 }}>Next</button>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center', color: '#64748b', fontWeight: 500, fontSize: 16 }}>
            <span>Answered: {answers.filter(a => a !== null && a !== undefined).length} / {questions.length}</span>
          </div>
        </div>
      ) : (
        <div className="quiz-inactive" style={{ background: '#f8fafc', borderRadius: 12, padding: 32, boxShadow: '0 2px 12px #0001' }}>
          <p style={{ color: '#64748b', fontSize: 18 }}>No quiz is live right now. Please check back at <b>8:00 PM Sunday</b>!</p>
          <img src="https://cdn.pixabay.com/photo/2017/01/31/13/14/quiz-2024323_1280.png" alt="Quiz" className="quiz-image" style={{ maxWidth: 220, marginTop: 16, borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
        </div>
      )}
    </div>
  );
}

export default LiveQuiz;
