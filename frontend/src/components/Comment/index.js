import React from "react";

const Comment = ({ name, date, onReaction, userAvatar, comment }) => {
  return (
    <div className="d-flex">
      <div className="user-avatar">
        <img src={userAvatar} alt="user-avatar" />
      </div>
      <div className="user-info">
        <div>
          <span>{name}</span>
          <span>{date}</span>
        </div>
        <p>{comment}</p>
      </div>
    </div>
  );
};

export default Comment;
