import React, { useEffect, useMemo, useState } from "react";
import "./LeaderBoard.css";
import shell from "../../Images/nav/shell.png";
import userImage from "../../Images/Leaderboard/userImage.svg";
import UserAvatar from "../../components/UserAvatar";
import {
  useGetGroupDetailsMutation,
  useGetGroupLeaderBoardMutation,
} from "../../redux/api/groupsApi";
import {
  useGetIndividualLeaderBoardMutation,
  useGetStudentAchievementsMutation,
  useGetStudentDetailsMutation,
} from "../../redux/api/studentsApi";
import { useSelector } from "react-redux";
import { Container } from "react-bootstrap";
import { useMyContext } from "../../MyContextProvider";

const leaderBoardIndividualData = [
  {
    no: 2,
    name: "Sarah",
    level: 2,
    points: 70,
  },
  {
    no: 1,
    name: "David",
    level: 6,
    points: 70,
  },
  {
    no: 3,
    name: "John",
    level: 2,
    points: 70,
  },
  {
    no: 4,
    name: "Devon Lane",
    level: 2,
    points: 70,
  },
  {
    no: 5,
    name: "Ronald",
    level: 2,
    points: 70,
  },
  {
    no: 6,
    name: "Eleanor Pena",
    level: 2,
    points: 70,
  },
  {
    no: 7,
    name: "Savannah",
    level: 2,
    points: 70,
  },
];

const leaderBoardGroupData = [
  {
    no: 2,
    students: [
      { name: "Sarah", image: userImage },
      { name: "David", image: userImage },
      { name: "John", image: userImage },
    ],
    groupno: 4,
    level: 2,
    points: 70,
  },
  {
    no: 1,
    students: [
      { name: "Sarah", image: userImage },
      { name: "David", image: userImage },
      { name: "John", image: userImage },
    ],
    groupno: 7,
    level: 2,
    points: 70,
  },
  {
    no: 3,
    students: [
      { name: "Sarah", image: userImage },
      { name: "David", image: userImage },
      { name: "John", image: userImage },
    ],
    groupno: 5,
    level: 2,
    points: 70,
  },
  {
    no: 4,
    students: [
      { name: "Sarah", image: userImage },
      { name: "David", image: userImage },
      { name: "John", image: userImage },
    ],
    groupno: 1,
    level: 2,
    points: 70,
  },
  {
    no: 5,
    students: [
      { name: "Sarah", image: userImage },
      { name: "David", image: userImage },
      { name: "John", image: userImage },
    ],
    groupno: 3,
    level: 2,
    points: 70,
  },
  {
    no: 6,
    students: [
      { name: "Sarah", image: userImage },
      { name: "David", image: userImage },
      { name: "John", image: userImage },
    ],
    groupno: 2,
    level: 2,
    points: 70,
  },
  {
    no: 7,
    students: [
      { name: "Sarah", image: userImage },
      { name: "David", image: userImage },
      { name: "John", image: userImage },
    ],
    groupno: 6,
    level: 2,
    points: 70,
  },
];

const LeaderBoard = () => {
    const [coord, setCoord] = useState({ x: 0, y: 0 });
    const handleMouseMove = (e) => {
      const newCoords = {x: e.screenX, y: e.screenY}
        setCoord(newCoords);
      };
  const [activeTab, setActiveTab] = useState("individual");

  // Use global context for student details to get real-time updates
  const { studentDetails } = useMyContext();
  const student_details = studentDetails || JSON.parse(localStorage.getItem("student_details"));
  const userData = useSelector((state) => state.user.user);
  const [getGroupDetails, { data: groupDetails }] =
    useGetGroupDetailsMutation();
  const [getGroupLeaderBoard, { data: groupLeaderBoard }] =
    useGetGroupLeaderBoardMutation();

  const [getStudentDetails, { data: studentsData }] =
    useGetStudentDetailsMutation();
  const [
    getIndividualLeaderBoard,
    { data: individualLeaderBoardData, isLoading: leaderLoading },
  ] = useGetIndividualLeaderBoardMutation();

  // Debug: Log the leaderboard data to see if avatarUrl is present
  console.log("Leaderboard Debug - Individual Data:", individualLeaderBoardData?.data?.payload?.individual_leaderboard);
  if (individualLeaderBoardData?.data?.payload?.individual_leaderboard?.length > 0) {
    console.log("First user data:", individualLeaderBoardData.data.payload.individual_leaderboard[0]);
  }

  useEffect(() => {
    getGroupDetails({ group_id: "" });
    getStudentDetails({ student_id: userData?._id });
    getIndividualLeaderBoard({ student_id: userData?._id });
    getGroupLeaderBoard();
  }, []);

  //create function to get only ser which have individual_rank>0 from indivdual_leaderboard
  const getFilteredIndividualLeaderBoardData = () => {
    if (
      individualLeaderBoardData?.data?.payload?.individual_leaderboard &&
      !leaderLoading
    ) {
      return individualLeaderBoardData.data.payload.individual_leaderboard.filter(
        (user) => user.individual_rank > 0
      );
    }
    return [];
  };

  // Debug: Check what data we're getting from the API
  console.log("🔍 LeaderBoard Data Structure:");
  console.log("individualLeaderBoardData:", individualLeaderBoardData);
  console.log("groupLeaderBoard:", groupLeaderBoard);
  
  // Check if individual users have avatarUrl
  if (individualLeaderBoardData?.data?.payload?.individual_leaderboard) {
    console.log("🔍 First user in leaderboard:", individualLeaderBoardData.data.payload.individual_leaderboard[0]);
  }

  return (
    <>
    <Container onMouseMove={handleMouseMove}>
    <div className="home-container">
          <div className="info" style={{marginTop:20, marginLeft:-418}}>
        Mouse coordinates: {coord.x} {coord.y}
         </div>
            
    <div
      className="leader-board"
      style={{
        minHeight: "100vh",
      }}
    >
      
      <div className="leaderboard-hero">
        <div className="leaderbord-title">Leaderboard</div>
        <div className="tab-menu">
          <span
            onClick={() => setActiveTab("individual")}
            className={`${activeTab === "individual" && "active"}`}
          >
            Individual
          </span>
          <span
            onClick={() => setActiveTab("group")}
            className={`${activeTab === "group" && "active"}`}
          >
            Group
          </span>
        </div>
        {activeTab === "individual" ? (
          <div className="tabmenu-content-cards">
            {getFilteredIndividualLeaderBoardData()
              ?.slice(0, 3)
              ?.map((data) => (
                <div key={data?.no} className="leaderboard-card">
                  <div className="leader-card-header">
                    <div className="card-no">{data?.individual_rank}</div>
                    <div>
                      <UserAvatar 
                        user={data}
                        size="60"
                        round={true}
                        className="userImage"
                      />
                    </div>
                    <div className="name">{data?.name}</div>
                  </div>
                  <div className="leader-card-footer d-flex justify-content-center">
                    <div>
                      <img src={shell} alt="shell" style={{ height: "25px" }} />{" "}
                      <span
                        style={{
                          color: "black",
                        }}
                      >
                        {data?.total_points_earned}
                      </span>
                    </div>
                    {/* <div>Level: {data?.level || data?.individual_rank}</div> */}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="tabmenu-content-cards">
            {groupLeaderBoard?.data?.payload?.group_leaderboard
              ?.slice(0, 3)
              ?.map((data) => (
                <div key={data?.group_no} className="leaderboard-card">
                  <div className="leader-card-header">
                    <div className="card-no">{data?.group_rank}</div>
                    <div className="group-users-sec">
                      {data?.team_members?.map((student) => (
                        <div className="group-users" key={student._id}>
                          <img
                            src={userImage}
                            alt="user"
                            className="group-user"
                          />
                          <div>
                            {student?.name}
                            {student?.is_leader && (
                              <div style={{ fontSize: '10px', color: '#f39c12' }}>👑 Leader</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="name group-name">
                      Group {data?.group_no}
                    </div>
                  </div>
                  <div className="leader-card-footer">
                    <div>
                      <img src={shell} alt="shell" style={{ height: "25px" }} />{" "}
                      <span
                        style={{
                          color: "black",
                        }}
                      >
                        {data?.total_points_earned}
                      </span>
                    </div>
                    <div>Village Level: {data?.village_level}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {activeTab === "individual" ? (
        <div className="tabmenu-content-table">
          {getFilteredIndividualLeaderBoardData()
            ?.filter((user) => user?.individual_rank > 3)
            ?.map((data) => (
              <div className="leader-board-single-row">
                <div className="row-left">
                  <div>{data?.individual_rank}</div>
                  <UserAvatar 
                    user={data}
                    size="40"
                    round={true}
                    className="userImage"
                  />
                  <div className="name">{data?.name}</div>
                </div>
                <div className="row-right">
                  <div className="points">
                    <img src={shell} alt="shell" style={{ height: "40px" }} />{" "}
                    <span
                      style={{
                        color: "black",
                      }}
                    >
                      {data?.total_points_earned}
                    </span>
                  </div>
                  {/* <div>Level: {data?.level || data?.individual_rank}</div> */}
                </div>
              </div>
            ))}
        </div>
      ) : groupLeaderBoard?.data?.payload?.group_leaderboard?.filter(
          (user) => user?.group_rank > 3
        )?.length > 1 ? (
        <>
          {groupLeaderBoard?.data?.payload?.group_leaderboard
            ?.filter((user) => user?.group_rank > 3)
            ?.map((data) => (
              <div
                style={{
                  margin: "2rem",
                }}
                className="leader-board-single-row"
              >
                <div className="row-left">
                  <div>{data?.group_rank}</div>
                  <div className="name">Group {data?.group_no}</div>
                  <div className="students-table-users-main">
                    (
                    {data?.team_members?.map((student) => (
                      <div key={student._id}>
                        <div>
                          {student?.name}
                          {student?.is_leader && (
                            <span style={{ fontSize: '12px', color: '#f39c12', marginLeft: '5px' }}>
                              👑
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    )
                  </div>
                </div>
                <div className="row-right">
                  <div className="points">
                    <img src={shell} alt="shell" style={{ height: "40px" }} />{" "}
                    <span
                      style={{
                        color: "black",
                      }}
                    >
                      {data?.total_points_earned}
                    </span>
                  </div>
                  <div>Village Level: {data?.village_level}</div>
                </div>
              </div>
            ))}
        </>
      ) : (
        <></>
      )}
    </div>
    </div>
    </Container>
    
    </>
  );
};

export default LeaderBoard;
