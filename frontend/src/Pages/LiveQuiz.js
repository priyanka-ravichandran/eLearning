import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useMyContext } from '../MyContextProvider';
import UserAvatar from '../components/UserAvatar';
import './LiveQuiz.css';

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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [finalScore, setFinalScore] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
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
  const handleStartQuiz = async (forceJoin = false) => {
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
        if (remaining > 0 && data.questions.length > 0) {
          setTimer(remaining);
          setAnswers(Array.isArray(data.answers) ? data.answers : Array(data.questions.length).fill(null));
          setCurrentIdx(typeof data.currentQuestionIdx === 'number' ? data.currentQuestionIdx : 0);
          setSelected((Array.isArray(data.answers) && data.answers[data.currentQuestionIdx]) ? data.answers[data.currentQuestionIdx].answer || '' : '');
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

  // Listen for real-time answer updates from socket.io (replace old handler)
  useEffect(() => {
    const handler = ({ answers: newAnswers }) => {
      setAnswers(Array.isArray(newAnswers) ? [...newAnswers] : Array(questions.length).fill(null));
      // Also update selection for the current question
      if (Array.isArray(newAnswers) && newAnswers[currentIdx]) {
        setSelected(newAnswers[currentIdx].answer || '');
      } else {
        setSelected('');
      }
    };
    socket.on('answerUpdate', handler);
    return () => {
      socket.off('answerUpdate', handler);
    };
  }, [currentIdx, questions.length]);

  // Listen for real-time navigation updates
  useEffect(() => {
    const handler = ({ questionIdx }) => {
      setCurrentIdx(questionIdx);
      setSelected(answers[questionIdx]?.answer || '');
    };
    socket.on('navigateQuestion', handler);
    return () => {
      socket.off('navigateQuestion', handler);
    };
  }, [answers]);

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

  // --- Fetch group members for name mapping ---
  const [groupMembers, setGroupMembers] = useState([]);
  useEffect(() => {
    const groupId = getGroupId();
    if (!groupId) return;
    fetch(`http://localhost:3000/group/members/${groupId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.members)) {
          setGroupMembers(data.members);
        }
      });
  }, [studentDetails]);

  // Helper: get the name of the student by id (prefer fetched groupMembers)
  const getStudentName = (id) => {
    if (!id) return 'Unknown';
    const found = groupMembers.find((m) => m.id === id || m.id === String(id));
    if (found) return found.name;
    // fallback to context if not found
    const group = studentDetails?.groupMembers || [];
    const fallback = group.find((m) => m._id === id || m.id === id);
    return fallback ? fallback.name || fallback.fullName || fallback.username : id;
  };

  // Remove all disabling logic and allow live selection by any member
  // Real-time answer update
  useEffect(() => {
    const handler = ({ questionIdx, answer, by }) => {
      setAnswers(prev => {
        // Ensure prev is always an array
        const updated = Array.isArray(prev) ? [...prev] : Array(questions.length).fill(null);
        updated[questionIdx] = { answer, by };
        return updated;
      });
      if (questionIdx === currentIdx) {
        setSelected(answer);
      }
    };
    socket.on('answerUpdate', handler);
    return () => {
      socket.off('answerUpdate', handler);
    };
  }, [currentIdx]);

  // When a user selects an answer, emit to all (and sync selection for all)
  const handleAnswer = (ans) => {
    const groupId = getGroupId();
    if (groupId && userId) {
      socket.emit('answerUpdate', { groupId, questionIdx: currentIdx, answer: ans, by: userId });
      setAnswers(prev => {
        const updated = Array.isArray(prev) ? [...prev] : Array(questions.length).fill(null);
        updated[currentIdx] = { answer: ans, by: userId };
        return updated;
      });
      setSelected(ans);
    }
  };

  // On Next, emit navigation to group
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const groupId = getGroupId();
      if (groupId) socket.emit('navigateQuestion', { groupId, questionIdx: currentIdx + 1 });
      setCurrentIdx(currentIdx + 1);
      setSelected(answers[currentIdx + 1]?.answer || '');
    } else if (currentIdx === questions.length - 1) {
      // Last question, show summary automatically
      handleShowSummary();
    }
  };
  const handlePrev = () => {
    if (currentIdx > 0) {
      const groupId = getGroupId();
      if (groupId) socket.emit('navigateQuestion', { groupId, questionIdx: currentIdx - 1 });
      setCurrentIdx(currentIdx - 1);
      setSelected(answers[currentIdx - 1]?.answer || '');
    }
  };

  // Show summary before ending quiz
  const handleShowSummary = () => {
    // Robust name lookup for summary
    const getName = (id) => {
      if (!id) return 'Unknown';
      let found = groupMembers.find((m) => m.id === id || m.id === String(id));
      if (found) return found.name || found.fullName || found.username || id;
      const group = studentDetails?.groupMembers || [];
      found = group.find((m) => m._id === id || m.id === id || String(m._id) === String(id));
      return found ? found.name || found.fullName || found.username || id : id;
    };
    const summary = questions.map((q, idx) => {
      const ansObj = answers[idx];
      return {
        question: q.text,
        answer: ansObj?.answer || '(No answer)',
        by: getName(ansObj?.by)
      };
    });
    setSummaryData(summary);
    setShowSummary(true);
  };

  // Only end the quiz, do not reset state or fetch new quiz until user clicks start
  const handleEndQuiz = () => {
    setQuizActive(false); // Disable button immediately to prevent double submit
    const groupId = getGroupId();
    if (groupId) {
      socket.emit('endGroupQuiz', { groupId });
    }
    // Do NOT reset questions/answers here; let quizInactive event handle it
    setShowSummary(false);
  };

  // Listen for quizInactive event to reset UI for all group members
  useEffect(() => {
    const handler = () => {
      setQuizActive(false);
      setQuestions([]);
      setAnswers([]);
      setCurrentIdx(0);
      setSelected('');
      setTimer(0);
      setShowSummary(false);
    };
    socket.on('quizInactive', handler);
    return () => {
      socket.off('quizInactive', handler);
    };
  }, []);

  // --- AUTO-JOIN OR START QUIZ ON MOUNT ---
  useEffect(() => {
    const groupId = getGroupId();
    if (!groupId) return;
    // Only auto-fetch if quizActive is true (prevents auto-start after end)
    if (!quizActive) return;
    fetch('http://localhost:3000/api/generate-math-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.questions)) {
          socket.emit('joinGroupQuiz', { groupId });
          setQuestions(data.questions);
          const QUIZ_DURATION = 15 * 60; // 15 min in seconds
          const now = Date.now();
          const elapsed = Math.floor((now - data.startTime) / 1000);
          const remaining = QUIZ_DURATION - elapsed;
          if (remaining > 0 && data.questions.length > 0) {
            setTimer(remaining);
            setAnswers(Array.isArray(data.answers) ? data.answers : Array(data.questions.length).fill(null));
            setCurrentIdx(typeof data.currentQuestionIdx === 'number' ? data.currentQuestionIdx : 0);
            setSelected((Array.isArray(data.answers) && data.answers[data.currentQuestionIdx]) ? data.answers[data.currentQuestionIdx].answer || '' : '');
            setQuizActive(true);
          } else {
            setQuizActive(false);
            setQuestions([]);
            setTimer(0);
          }
        } else {
          setQuizActive(false);
        }
      });
    // eslint-disable-next-line
  }, [studentDetails, quizActive]);

  // Listen for quizStarted event to sync all group members instantly
  useEffect(() => {
    const handler = () => {
      handleStartQuiz(); // Always re-fetch quiz data and force UI update
    };
    socket.on('quizStarted', handler);
    return () => socket.off('quizStarted', handler);
  }, []); // No dependencies, always active

  // Listen for quizScore event from backend
  useEffect(() => {
    const handler = (data) => {
      // Only show the score modal if a valid score is present
      const isMine = () => {
        if (!data.userId) return true;
        return String(data.userId) === String(userId);
      };
      if (!isMine()) return;
      console.log('[QUIZ SCORE EVENT]', data); // Debug log
      if (typeof data.score === 'number') {
        setFinalScore(data.score);
        setShowScoreModal(true);
      }
      if (refreshStudentDetails) refreshStudentDetails();
    };
    socket.off('quizScore'); // Remove any previous listeners to avoid duplicates
    socket.on('quizScore', handler);
    return () => socket.off('quizScore', handler);
  }, [userId, refreshStudentDetails]);

  // Timer formatting helper (define before return)
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
      {/* Hide quiz control buttons when score modal is open */}
      {!showScoreModal && (
        <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
          <button
            onClick={() => handleStartQuiz()}
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
            disabled={!quizActive || showScoreModal} // Prevent double click while modal is open
          >
            End Test Quiz
          </button>
        </div>
      )}
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
              const isSelected = selected === opt;
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
                      cursor: 'pointer',
                      opacity: 1,
                      boxShadow: 'none',
                    }}
                    onClick={() => handleAnswer(opt)}
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
            <p className="your-answer" style={{ color: '#e11d48', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              Answered by: <b>{getStudentName(getAnsweredBy(currentIdx))}</b>
            </p>
          )}
          <div className="quiz-nav-btns" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button onClick={handlePrev} disabled={currentIdx === 0} className="quiz-option-btn" style={{ background: '#f1f5f9', color: '#2563eb', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, border: '1px solid #2563eb', opacity: currentIdx === 0 ? 0.5 : 1 }}>Previous</button>
            <button onClick={handleNext} disabled={showSummary || currentIdx === questions.length - 1 && showSummary} className="quiz-option-btn" style={{ background: '#f1f5f9', color: '#2563eb', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, border: '1px solid #2563eb', opacity: currentIdx === questions.length - 1 && showSummary ? 0.5 : 1 }}>Next</button>
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
      {showSummary && (
        <div className="quiz-summary-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 500, width: '100%', boxShadow: '0 4px 24px #0002' }}>
            <h3 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 16 }}>Quiz Summary</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {summaryData.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 12, color: '#334155', fontSize: 17 }}>
                  <b>Q{idx + 1}:</b> {item.question}<br />
                  <span style={{ color: '#2563eb' }}>Answer:</span> {item.answer} <br />
                  <span style={{ color: '#64748b' }}>Submitted by:</span> {item.by}
                </li>
              ))}
            </ul>
            <button onClick={handleEndQuiz} className="quiz-option-btn" style={{ background: '#e11d48', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, marginTop: 16 }}>End Quiz</button>
            <button onClick={() => setShowSummary(false)} className="quiz-option-btn" style={{ background: '#f1f5f9', color: '#2563eb', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, marginTop: 8, marginLeft: 8 }}>Cancel</button>
          </div>
        </div>
      )}
      {showScoreModal && (
        <div className="quiz-summary-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 4px 24px #0002', textAlign: 'center' }}>
            <h2 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 16 }}>Quiz Score</h2>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#16a34a', marginBottom: 16 }}>{finalScore} / 10</div>
            <button onClick={() => setShowScoreModal(false)} className="quiz-option-btn" style={{ background: '#2563eb', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '8px 20px', fontSize: 16, marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveQuiz;
