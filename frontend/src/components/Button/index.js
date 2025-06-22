import React from "react";
import Button from "react-bootstrap/Button";
import "./style.css";

const OutlineButton = ({ text, onClick, ...rest }) => {
  return (
    <button
      style={{
        border: "2px solid rgba(203, 94, 33, 1)",

        //Add padding to the left and right of the button
        padding: "0.5rem 2rem",
      }}
      className="btn-outline"
    >
      {text}
    </button>
  );
};

export default OutlineButton;
