import React from "react";
import "./style.css";
import titleBorder from "../../Images/titleDesign.png";

const PageTitle = ({ text, borderMargin }) => {
  return (
    <div
      style={{
        position: "relative",
        marginBottom: "1rem",
      }}
    >
      <div className="pageTitle">{text}</div>
      <div
        style={{
          position: "absolute",
          top: "2.4rem",
          left: "3rem",
          width: "100%",
        }}
        className="lineWithEllipses"
      >
        <img
          width={"249px"}
          height={"10px"}
          src={titleBorder}
          alt="eLearning Logo"
        />
      </div>
    </div>
  );
};

export default PageTitle;
