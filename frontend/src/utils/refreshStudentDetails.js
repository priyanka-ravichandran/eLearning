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
        console.log('✅ Context updated with new student details');
      }
      
      console.log('✅ Student details refreshed:', {
        currentPoints: data.data.student.current_points,
        totalPoints: data.data.student.total_points_earned,
        contextUpdated: !!setStudentDetails
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

/**
 * Refreshes points for a specific user if they are the current user
 * This is useful when we know a specific user received points and want to update their UI
 * @param {string} targetUserId - The user who received points
 * @param {string} currentUserId - The current logged-in user
 * @param {function} setStudentDetails - Context setter function
 * @param {string} reason - Reason for the points update (for toast message)
 * @returns {Promise<boolean>} - Returns true if points were refreshed for current user
 */
export const refreshPointsIfCurrentUser = async (targetUserId, currentUserId, setStudentDetails, reason = '') => {
  // Only refresh if the target user is the current user
  if (String(targetUserId) === String(currentUserId)) {
    console.log('🔄 Refreshing points for current user after receiving points...');
    const refreshResult = await refreshStudentDetails(currentUserId, setStudentDetails);
    if (refreshResult) {
      console.log('✅ Current user points refreshed successfully');
      return true;
    }
  } else {
    console.log('Points awarded to different user, no refresh needed for current user');
  }
  return false;
};
