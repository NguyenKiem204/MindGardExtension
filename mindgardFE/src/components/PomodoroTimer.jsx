import { useEffect, useRef, useState } from "react";
import { getLocal } from "../utils/chromeStorage";
import { showSessionCompleteCelebration } from "../utils/celebrations";

export default function PomodoroTimer({ onStartFocus, onComplete }) {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [remaining, setRemaining] = useState(25 * 60);
  const [mode, setMode] = useState("work"); // 'work' | 'break'
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const [taskTitle, setTaskTitle] = useState("Deep work");
  const [error, setError] = useState("");

  useEffect(() => {
    getLocal(["workMin", "breakMin"]).then((d) => {
      const wm = d.workMin ?? 25;
      const bm = d.breakMin ?? 5;
      setWorkMin(wm);
      setBreakMin(bm);
      setRemaining(wm * 60);
    });
    try {
      if (sessionStorage.getItem("autoStartPomodoro") === "1") {
        sessionStorage.removeItem("autoStartPomodoro");
        setTimeout(() => start(), 200);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          const completedMin = mode === "work" ? workMin : breakMin;
          if (mode === "work" && onComplete) {
            try {
              onComplete({ durationMin: completedMin, taskTitle });
            } catch (e) {
              setError("Failed to save session: " + e.message);
            }
          }
          setRunning(false);
          const nextMode = mode === "work" ? "break" : "work";
          setMode(nextMode);
          setRemaining((nextMode === "work" ? workMin : breakMin) * 60);

          // Show celebration for completed work session
          if (mode === "work") {
            showSessionCompleteCelebration();
          }

          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode, workMin, breakMin, onComplete, taskTitle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === "INPUT") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (running) pause();
          else start();
          break;
        case "r":
          e.preventDefault();
          reset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [running]);

  function start() {
    if (!running) {
      setError("");
      setRunning(true);
      if (mode === "work" && onStartFocus) onStartFocus();
    }
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setMode("work");
    setRemaining(workMin * 60);
    setError("");
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between">
        <input
          className="text-black rounded px-3 py-2 bg-white/90"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="What are you working on?"
        />
        <span className="uppercase text-sm opacity-80">{mode} mode</span>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="text-center mt-6">
        <div className="text-6xl font-extrabold tracking-wider">
          {mm}:{ss}
        </div>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={start}
            className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 transition-colors disabled:opacity-50"
            disabled={running}
          >
            {running ? "Running..." : "Start"}
          </button>
          <button
            onClick={pause}
            className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-2 transition-colors disabled:opacity-50"
            disabled={!running}
          >
            Pause
          </button>
          <button
            onClick={reset}
            className="bg-gray-600 hover:bg-gray-700 text-white rounded px-4 py-2 transition-colors"
          >
            Reset
          </button>
        </div>
        <div className="mt-2 text-xs opacity-60">
          Press Space to start/pause, R to reset
        </div>
      </div>
    </div>
  );
}
