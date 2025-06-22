import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetStudentDetailsMutation } from "../../redux/api/studentsApi";
import { Card } from "react-bootstrap";
import "./index.css";
import Avatar from "react-avatar";
const UserProfile = () => {

  let student_details123 = JSON.parse(localStorage.getItem('student_details'))
  console.log(student_details123)

  const [student_details,  setStudentDetails] = useState(student_details123);

  // let student_details = null;
  // const userData = useSelector((state) => state.user.user);

  // const [getStudentDetails, { data: student_details }] =
  //   useGetStudentDetailsMutation();
  // useEffect(() => {
  //   getStudentDetails({ student_id: userData?._id });
  // }, []);
  // console.log("studentsData", studentsData);

  useEffect(() => {
    getStudentdetails();
  }, []);

  const getStudentdetails = async () => {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: student_details123.student._id,
        }),
      };

      const response = await fetch(
        'http://localhost:3000' + "/student/get_student_details",
        requestOptions
      );
      const data = await response.json();
      console.log("student details", data.data);
      setStudentDetails(data.data)
      // setStudentDetails(data.data);
      localStorage.setItem("student_details", JSON.stringify(data.data));
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "100px",
        padding: "20px",
      }}
    >
      
      <div class="row gutters-sm p-4" style={{background:'rgba(38, 124, 93, 1)'}}>
        <h2 className="my-4">INDIVIDUAL</h2>
        <div class="col-md-4 mb-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex flex-column align-items-center text-center">
                <div class="mt-3">
                  <h4>
                    Rank:{" "}
                    {student_details?.student?.individual_rank} <br />
                  </h4>
                </div>
              </div>
            </div>
          </div>
          <div class="card mt-3"></div>
        </div>
        <div class="col-md-8">
          <div class="card mb-3 p-3 font-18">
          <Card.Text>
              Name: {student_details?.student?.name} <br />
            </Card.Text>
            <Card.Text>
              Email: {student_details?.student?.email} <br />
            </Card.Text>
            <Card.Text>
              Grade: {student_details?.student?.grade} <br />
            </Card.Text>
            <Card.Text>
              Current Points: {student_details?.student?.current_points}
            </Card.Text>
            <Card.Text>
              Total Points Earned: {student_details?.student?.total_points_earned}
            </Card.Text>
          </div>
        </div>
      </div>

      { student_details.group && (<div class="row gutters-sm p-4" style={{background:'rgba(38, 124, 93, 1)'}}>
        <h2 className="my-4">GROUP</h2>
        <div class="col-md-4 mb-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex flex-column align-items-center text-center">
                <div class="mt-3">
                  <h4>
                    Rank:{" "}
                    {student_details?.group?.group_rank} <br />
                  </h4>
                </div>
              </div>
            </div>
          </div>
          <div class="card mt-3"></div>
        </div>
        <div class="col-md-8">
          <div class="card mb-3 p-3 font-18">
          <Card.Text>
              Group Number: {student_details?.group?.group_no} <br />
            </Card.Text>
            <Card.Text>
              Team Members: {student_details?.group?.team_members[0].name +', ' + student_details?.group?.team_members[1].name +', ' + student_details?.group?.team_members[2].name} <br />
            </Card.Text>
            <Card.Text>
              Village Level: {student_details?.group?.village_level} <br />
            </Card.Text>
            <Card.Text>
              Current Points: {student_details?.group?.current_points}
            </Card.Text>
            <Card.Text>
              Total Points Earned: {student_details?.group?.total_points_earned}
            </Card.Text>
          </div>
        </div>
      </div>)}

      {/* <div class="row gutters-sm p-4" style={{background:'rgba(38, 124, 93, 1)'}}>
        <h2>GROUP</h2>
        <div class="col-md-4 mb-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex flex-column align-items-center text-center">
               
                <div class="mt-3">
                  <h4>{student_details?.data?.student?.name}</h4>
                  <Card.Text>
                    Total Points Earned:{" "}
                    {student_details?.data?.student?.total_points_earned} <br />
                  </Card.Text>
                  
                </div>
              </div>
            </div>
          </div>
          <div class="card mt-3"></div>
        </div>
        <div class="col-md-8">
          <div class="card mb-3 p-3 font-18">
            <Card.Text>
              Email: {student_details?.data?.student?.email} <br />
            </Card.Text>
            <Card.Text>
              Group ID: {student_details?.data?.student?.group_id} <br />
            </Card.Text>
            <Card.Text>
              Individual Rank: {student_details?.data?.student?.individual_rank}{" "}
              <br />
            </Card.Text>
            <Card.Text>
              Current Points: {student_details?.data?.student?.current_points}
            </Card.Text>
            <Card.Text>
              <h4 className="font-bold"> Achievements:</h4>
              {student_details?.data?.student?.achievements?.map(
                (achievement, index) => (
                  <div key={index}>
                    <span className="font-bold" style={{ fontSize: "20px" }}>
                      {index + 1}.
                    </span>{" "}
                    Reason: {achievement.reason} <br />
                    Points: {achievement.points} <br />
                    Type: {achievement.type} <br />
                    Date: {new Date(achievement.date).toLocaleDateString()}
                  </div>
                )
              )}
            </Card.Text>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default UserProfile;
