import React, { useEffect } from "react";
// import Header from "../../Components/Header/Header";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";

function LayoutWithHeader() {
  // let isAuthenticated = !!localStorage.getItem("token");
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     navigate("/login");
  //   }
  // }, [isAuthenticated]);

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

export default LayoutWithHeader;
