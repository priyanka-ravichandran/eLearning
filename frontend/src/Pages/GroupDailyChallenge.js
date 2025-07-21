import React, { useEffect, useMemo, useState } from "react";
import { useMyContext } from "../MyContextProvider";
import { Wheel } from "react-custom-roulette";

const API_BASE = "http://localhost:3000";

export default function GroupDailyChallenge() {
  const { studentDetails } = useMyContext();
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // wheel
  const wheelData = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        option: `${(i + 1) * 10} Points`,
        style: {
          backgroundColor: [
            "#FF0000",
            "#FFA500",
            "#FFFF00",
            "#00FF00",
            "#00BFFF",
            "#8A2BE2",
            "#FF69B4",
            "#00CED1",
            "#FFD700",
            "#228B22",
          ][i],
        },
      })),
    []
  );

  const [showWheel, setShowWheel] = useState(false);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(null);

  const isPrizeValid =
    Number.isFinite(prizeIndex) && prizeIndex >= 0 && prizeIndex < wheelData.length;

  // Robust group ID extraction
  const groupId = (() => {
    const g = studentDetails?.student?.group;
    if (!g) return "";
    if (typeof g === "string") return g;
    return g._id || g.id || "";
  })();

  useEffect(() => {
    let alive = true;

    const fetchChallenge = async () => {
      try {
        const res = await fetch(`${API_BASE}/daily-challenge/group/today`);
        const data = await res.json();
        if (alive && data.success) setChallenge(data.challenge);
      } catch (_) {
        if (alive) setChallenge(null);
      }
    };

    const fetchSubmission = async () => {
      if (!groupId) return;
      try {
        const res = await fetch(
          `${API_BASE}/daily-challenge/group/submission?groupId=${groupId}`
        );
        const data = await res.json();
        if (!alive) return;

        if (data.success && data.submission) {
          setSubmitted(true);
          setResult({
            isCorrect: data.submission.llm_feedback?.is_correct,
            analysis: data.submission.llm_feedback?.explanation,
            answer: data.submission.answer,
          });
        } else {
          setSubmitted(false);
          setResult(null);
        }
      } catch (_) {
        if (alive) {
          setSubmitted(false);
          setResult(null);
        }
      }
    };

    fetchChallenge();
    fetchSubmission();
    return () => { alive = false; };
  }, [groupId]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/daily-challenge/group/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, answer }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setResult({ isCorrect: data.isCorrect, analysis: data.analysis, answer });

        if (data.isCorrect) {
          const len = wheelData.length;
          if (len) {
            setPrizeIndex(Math.floor(Math.random() * len));
            setShowWheel(true); // Show wheel, but don't spin yet
            setMustSpin(false); // Wait for user click
          }
        } else {
          resetWheel();
        }
      } else {
        alert(data.message || "Submission failed");
      }
    } catch {
      alert("Error submitting answer");
    }
    setLoading(false);
  };

  const resetWheel = () => {
    setShowWheel(false);
    setMustSpin(false);
    setPrizeIndex(null);
  };

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ color: "#2563eb", fontWeight: 700 }}>Group Daily Challenge</h2>
      {!challenge ? (
        <p style={{ color: "#334155", fontSize: 18, marginTop: 16 }}>
          No challenge available for today.
        </p>
      ) : (
        <>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 20, color: "#334155", marginBottom: 16 }}>
              <b>Subject:</b> {challenge.subject || challenge.topic}
              <br />
              <b>Challenge:</b> {challenge.text || challenge.question}
              {challenge.description && (
                <div style={{ color: "#64748b", marginTop: 8 }}>
                  <b>Description:</b> {challenge.description}
                </div>
              )}
            </div>
            {submitted && result ? (
              <div
                style={{
                  marginTop: 24,
                  background: "#f1f5f9",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                {result.isCorrect ? (
                  <>
                    <h4 style={{ color: "#16a34a" }}>
                      🎉 Congrats! Your answer is correct!
                    </h4>
                    <div style={{ color: "#334155", marginTop: 8 }}>
                      <b>Analysis:</b> {result.analysis}
                    </div>
                    <div style={{ color: "#64748b", marginTop: 8 }}>
                      <b>Your Answer:</b> {result.answer}
                    </div>
                    {showWheel && isPrizeValid && (
                      <div
                        style={{
                          marginTop: 32,
                          display: "flex",
                          justifyContent: "center",
                          flexDirection: "column",
                          alignItems: "center"
                        }}
                      >
                        <Wheel
                          mustStartSpinning={mustSpin}
                          prizeNumber={prizeIndex}
                          data={wheelData}
                          onStopSpinning={() => {
                            setMustSpin(false);
                            alert(`You won: ${wheelData[prizeIndex].option}`);
                            resetWheel();
                          }}
                          backgroundColors={[
                            "#2563eb",
                            "#334155",
                            "#64748b",
                            "#16a34a",
                            "#e11d48",
                            "#FFA500",
                            "#FFD700",
                            "#00CED1",
                            "#FF69B4",
                            "#228B22",
                          ]}
                          textColors={["#fff"]}
                        />
                        <button
                          style={{
                            marginTop: 24,
                            background: mustSpin ? "#64748b" : "#2563eb",
                            color: "#fff",
                            fontWeight: 600,
                            borderRadius: 6,
                            padding: "8px 20px",
                            fontSize: 16,
                            boxShadow: "0 2px 8px #2563eb22",
                            border: "none",
                            minWidth: 120,
                            cursor: mustSpin ? "not-allowed" : "pointer"
                          }}
                          onClick={() => setMustSpin(true)}
                          disabled={mustSpin}
                        >
                          Spin the Wheel
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h4 style={{ color: "#e11d48" }}>❌ Incorrect</h4>
                    <div style={{ color: "#334155", marginTop: 8 }}>
                      <b>Analysis:</b> {result.analysis}
                    </div>
                    <div style={{ color: "#64748b", marginTop: 8 }}>
                      <b>Your Answer:</b> {result.answer}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 24 }}>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your group's answer"
                  style={{
                    padding: 8,
                    fontSize: 16,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    width: "100%",
                    maxWidth: 400,
                  }}
                  disabled={loading}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!answer || loading}
                  style={{
                    marginTop: 16,
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 600,
                    borderRadius: 6,
                    padding: "8px 20px",
                    fontSize: 16,
                    boxShadow: "0 2px 8px #2563eb22",
                    border: "none",
                  }}
                >
                  {loading ? "Submitting…" : "Submit Answer"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
