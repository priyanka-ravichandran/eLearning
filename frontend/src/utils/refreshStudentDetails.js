const base_url = process.env.REACT_APP_BASE_URL;

/**
 * Refreshes student details from the backend and updates both context and localStorage
 * @param {string} studentId - The student ID
 * @param {function} setStudentDetails - Context setter function
 * @returns {Promise<object|null>} - Returns updated student details or null if error
 */
export const refreshStudentDetails = async (studentId, setStudentDetails = null) => {
  try {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
      }),
    };

    const response = await fetch(
      base_url + "/student/get_student_details",
      requestOptions
    );
    const data = await response.json();
    
    if (data.status && data.data && data.data.student) {
      const newStudentDetails = { student: data.data.student };
      
      // Update localStorage
      localStorage.setItem("student_details", JSON.stringify(newStudentDetails));
      
      // Update context if setter is provided
      if (setStudentDetails) {
        setStudentDetails(newStudentDetails);
      }
      
      console.log('Student details refreshed:', {
        currentPoints: data.data.student.current_points,
        totalPoints: data.data.student.total_points_earned
      });
      
      return newStudentDetails;
    } else {
      console.error("Failed to refresh student details:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Error refreshing student details:", error.message);
    return null;
  }
};
