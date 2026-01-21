import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import FocusView from "./components/FocusView.jsx";
import StudyFocusUI from "./components/StudyFocusUI.jsx";

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  if (hash === "#dashboard") return <Dashboard />;
  if (hash === "#focus") return <FocusView />;
  return <StudyFocusUI />;
}
