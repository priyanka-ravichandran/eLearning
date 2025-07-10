import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const UserDebug = () => {
  const [localStorageData, setLocalStorageData] = useState({});
  const reduxUser = useSelector((state) => state.user);

  useEffect(() => {
    // Get all relevant localStorage data
    const data = {
      student_details: localStorage.getItem("student_details"),
      group_id: localStorage.getItem("group_id"),
      userData: localStorage.getItem("userData"),
      reduxPersist: localStorage.getItem("persist:root")
    };
    setLocalStorageData(data);
  }, []);

  return (
    <div style={{ padding: '10px', backgroundColor: '#f0f0f0', margin: '10px 0', fontSize: '12px' }}>
      <h6>🔍 User Debug Info</h6>
      <div><strong>Redux User:</strong> {JSON.stringify(reduxUser, null, 2)}</div>
      <div><strong>Student Details (LS):</strong> {localStorageData.student_details}</div>
      <div><strong>User Data (LS):</strong> {localStorageData.userData}</div>
      <div><strong>Group ID (LS):</strong> {localStorageData.group_id}</div>
    </div>
  );
};

export default UserDebug;
