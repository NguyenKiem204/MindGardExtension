import { useEffect, useRef, useState } from "react";
import { getLocal } from "../utils/chromeStorage";
import { showSessionCompleteCelebration } from "../utils/celebrations";

export default function CircularTimer({ onStartFocus, onComplete, autoStart }) {
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

  // Calculate progress for circular progress bar
  const totalSeconds = mode === "work" ? workMin * 60 : breakMin * 60;
  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Mode Tabs */}
      <div className="flex mb-8">
        <button
          onClick={() => {
            setMode("work");
            setRemaining(workMin * 60);
            setRunning(false);
          }}
          className={`px-6 py-2 rounded-l-lg border border-white/20 transition-colors ${
            mode === "work"
              ? "bg-white/20 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/15"
          }`}
        >
          FOCUS
        </button>
        <button
          onClick={() => {
            setMode("break");
            setRemaining(breakMin * 60);
            setRunning(false);
          }}
          className={`px-6 py-2 rounded-r-lg border border-white/20 border-l-0 transition-colors ${
            mode === "break"
              ? "bg-white/20 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/15"
          }`}
        >
          BREAK
        </button>
      </div>

      {/* Circular Timer */}
      <div className="relative mb-8">
        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Timer Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-light text-white mb-2">
            {mm}:{ss}
          </div>
          <div className="text-sm text-white/70 uppercase tracking-wider">
            {mode} mode
          </div>
        </div>
      </div>

      {/* Session Goal Input */}
      <div className="mb-8 w-full max-w-md">
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="I will focus on..."
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={start}
          disabled={running}
          className="px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-colors font-medium"
        >
          {running ? "Running..." : "Start"}
        </button>
        <button
          onClick={pause}
          disabled={!running}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white rounded-lg transition-colors font-medium"
        >
          Pause
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
        >
          Reset
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="mt-6 text-xs text-white/50 text-center">
        Press Space to start/pause, R to reset
      </div>
    </div>
  );
}
