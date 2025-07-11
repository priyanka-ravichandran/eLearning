import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import LayoutWithHeader from "./Pages/Layouts/LayoutWithHeader";
import LayoutWithoutHeader from "./Pages/Layouts/LayoutWithoutHeader";
import Register from "./Pages/Auth/Register/Register";
import Login from "./Pages/Auth/Login/Login";
import LandingPage from "./Pages/LandingPage/LandingPage";
import { Provider } from "react-redux";
import store, { persistor } from "./redux/store";
import HelpFriend from "./Pages/HelpFriend/HelpFriend";
import HelpFriendDetails from "./Pages/HelpFriend/HelpFriendDetails";
import QuestionOfTheDayDetail from "./Pages/QuestionOfTheDay/QuestionOfTheDayDetail";
import PostQuestion from "./Pages/PostQuestion/PostQuestion";
import PostQuestionDetail from "./Pages/PostQuestion/PostQuestionDetail";
import QuestionOfTheDay from "./Pages/QuestionOfTheDay/QuestionOfTheDay";
import LeaderBoard from './Pages/Leaderboard/LeaderBoard'
// import LeaderBoard from "./Pages/LeaderBoard/LeaderBoard";
import Achievement from "./Pages/Achievement/Achievement";
import Question from "./Pages/Question/LandingPage/Question";
import QuestionDetail from "./Pages/Question/QuestionDetailPage/QuestionDetail";
import userSlice from "./redux/userSlice";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserProfile from "./Pages/UserProfile";
import { MyContextProvider } from "./MyContextProvider";
import React, { useState, useEffect } from "react";
import LiveQuiz from './Pages/LiveQuiz';

const router = createBrowserRouter([
  {
    element: <LayoutWithHeader />,
    children: [
      // {
      //   path: "/",
      //   element: <LandingPage />,
      // },
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/home",
        element: <LandingPage />,
      },
      {
        path: "question",
        element: <Question />,
      },
      {
        path: "question/:id",
        element: <QuestionDetail />,
      },
      {
        path: "/help-friend",
        element: <HelpFriend />,
      },
      {
        path: "/help-friend-details/:id",
        element: <HelpFriendDetails />,
      },
      {
        path: "/question-of-the-day",
        element: <QuestionOfTheDay />,
      },
      {
        path: "/question-of-the-day/:id",
        element: <QuestionOfTheDayDetail />,
      },
      {
        path: "/post-question",
        element: <PostQuestion />,
      },
      {
        path: "/post-question-details/:id",
        element: <PostQuestionDetail />,
      },
      {
        path: "/leaderboard",
        element: <LeaderBoard />,
      },
      {
        path: "/achievements",
        element: <Achievement />,
      },
      {
        path: "/user-profile",
        element: <UserProfile />,
      },
      {
        path: '/live-quiz',
        element: <LiveQuiz />,
      },
    ],
  },

  {
    element: <LayoutWithoutHeader />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/Register",
        element: <Register />,
      },
    ],
  },
]);
const student_details = JSON.parse(localStorage.getItem("student_details"));
const base_url = process.env.REACT_APP_BASE_URL;

function App() {
  const [studentDetails, setStudentDetails] = useState(() => {
    const stored = localStorage.getItem("student_details");
    return stored ? JSON.parse(stored) : null;
  });
  const getStudentdetails = async () => {
    try {
      // Get the current student details from state or localStorage
      const currentStudentDetails = studentDetails || JSON.parse(localStorage.getItem("student_details"));
      
      if (!currentStudentDetails?.student?._id) {
        console.log("No student ID found for refresh");
        return;
      }

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: currentStudentDetails.student._id,
        }),
      };

      const response = await fetch(
        base_url + "/student/get_student_details",
        requestOptions
      );
      const data = await response.json();
      console.log("🔄 Refreshed student details", data.data);

      setStudentDetails(data.data);
      localStorage.setItem("student_details", JSON.stringify(data.data));
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  };
  
  // Set up global refresh function for reactions and other point updates
  useEffect(() => {
    window.refreshUserPoints = getStudentdetails;
    
    // Listen for localStorage changes (when other components update student details)
    const handleStorageChange = (e) => {
      if (e.key === 'student_details' && e.newValue) {
        try {
          const newStudentDetails = JSON.parse(e.newValue);
          console.log("📱 LocalStorage changed externally, updating student details", newStudentDetails);
          setStudentDetails(newStudentDetails);
        } catch (error) {
          console.error("Error parsing updated student details:", error);
        }
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    const handleCustomStorageUpdate = (e) => {
      if (e.detail?.key === 'student_details' && e.detail?.value) {
        try {
          const newStudentDetails = JSON.parse(e.detail.value);
          console.log("🔄 Custom storage event, updating student details", newStudentDetails);
          setStudentDetails(newStudentDetails);
        } catch (error) {
          console.error("Error parsing updated student details:", error);
        }
      }
    };

    // Listen for group status changes
    const handleGroupStatusChange = (e) => {
      console.log("🏆 App: Group status changed, refreshing student details", e.detail);
      // Refresh student details to ensure context is up-to-date
      getStudentdetails();
    };

    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);
    window.addEventListener('groupStatusChanged', handleGroupStatusChange);
    
    // Cleanup on unmount
    return () => {
      delete window.refreshUserPoints;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
      window.removeEventListener('groupStatusChanged', handleGroupStatusChange);
    };
  }, []);
  
  return (
    <div className="App">
      <Provider store={store}>
        <MyContextProvider value={{ studentDetails, setStudentDetails }}>
          <PersistGate loading={null} persistor={persistor}>
            <RouterProvider router={router} />
          </PersistGate>
        </MyContextProvider>
      </Provider>
      <ToastContainer />
    </div>
  );
}

export default App;
