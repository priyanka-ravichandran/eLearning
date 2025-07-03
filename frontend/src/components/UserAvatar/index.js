import React from "react";
import Avatar from "react-avatar";

// Reusable UserAvatar component that uses the student's avatar from context or individual user data
const UserAvatar = ({ 
  studentDetails, // For current user from context
  user, // For individual user data (e.g., from answer/comment)
  size = "40", 
  round = true, 
  className = "", 
  style = {},
  fallbackName = "User"
}) => {
  // Get avatar URL from backend-provided data OR build it from avatar config
  let avatarUrl = user?.avatarUrl || studentDetails?.student?.avatarUrl;
  
  // If no ready avatarUrl, try to build it from avatar configuration
  if (!avatarUrl) {
    const avatarConfig = user?.avatar || studentDetails?.student?.avatar;
    if (avatarConfig) {
      // Use the same URL generation logic as the backend
      const baseUrl = 'https://api.dicebear.com/9.x/personas/svg';
      const params = new URLSearchParams();
      
      // Add size parameter to the DiceBear URL
      const avatarSize = typeof size === 'number' ? size : parseInt(size) || 50;
      params.append('size', avatarSize.toString());
      
      // Add seed
      if (avatarConfig.seed) {
        params.append('seed', avatarConfig.seed);
      }
      
      // Add customizations based on Personas style options
      if (avatarConfig.hair) {
        params.append('hair', avatarConfig.hair);
      }
      if (avatarConfig.eyes) {
        params.append('eyes', avatarConfig.eyes);
      }
      if (avatarConfig.facialHair) {
        params.append('facialHair', avatarConfig.facialHair);
      }
      if (avatarConfig.mouth) {
        params.append('mouth', avatarConfig.mouth);
      }
      if (avatarConfig.body) {
        params.append('body', avatarConfig.body);
      }
      
      avatarUrl = `${baseUrl}?${params.toString()}`;
    }
  }

  const userName = user?.name || studentDetails?.student?.name || fallbackName;

  // If we have a custom avatar URL, use an img tag - DO NOT render react-avatar fallback
  if (avatarUrl) {
    return (
      <div 
        className={`user-avatar-container ${className}`}
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          borderRadius: round ? "50%" : "0",
          border: "2px solid #267c5d",
          overflow: "hidden",
          flexShrink: 0,
          display: "inline-block",
          ...style
        }}
      >
        <img
          src={avatarUrl}
          alt={`${userName} Avatar`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block"
          }}
        />
      </div>
    );
  }

  // Only use react-avatar fallback if no custom avatar URL exists
  return (
    <Avatar
      name={userName}
      size={size}
      round={round}
      color="#267c5d"
      className={className}
      style={style}
    />
  );
};

export default UserAvatar;
