import React, { createContext, useContext, useState, useEffect } from "react";
const MyContext = createContext();
export const MyContextProvider = ({ children }) => {
  const [studentDetails, setStudentDetails] = useState(() => {
    const stored = localStorage.getItem("student_details");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const handleLocalStorageUpdate = (event) => {
      if (event.detail && event.detail.key === "student_details") {
        setStudentDetails(JSON.parse(event.detail.value));
      }
    };
    window.addEventListener("localStorageUpdate", handleLocalStorageUpdate);
    return () => window.removeEventListener("localStorageUpdate", handleLocalStorageUpdate);
  }, []);

  // Add refreshStudentDetails to update both localStorage and context, and fire event
  const refreshStudentDetails = async () => {
    const stored = localStorage.getItem("student_details");
    if (stored) {
      setStudentDetails(JSON.parse(stored));
      window.dispatchEvent(
        new CustomEvent("localStorageUpdate", {
          detail: { key: "student_details", value: stored },
        })
      );
    }
  };

  return (
    <MyContext.Provider value={{ studentDetails, refreshStudentDetails }}>
      {children}
    </MyContext.Provider>
  );
};
export const useMyContext = () => {
  return useContext(MyContext);
};
