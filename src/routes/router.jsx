import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ChooseFrame from "@/pages/chooseFrame";
import CapturePage from "@/pages/capturePage";
import ReviewPage from "@/pages/reviewPage";

function AppRoutes() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <Routes>
          <Route path="/" element={<Navigate to="/choose" />} />
          <Route path="/choose" element={<ChooseFrame />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/review" element={<ReviewPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppRoutes;
