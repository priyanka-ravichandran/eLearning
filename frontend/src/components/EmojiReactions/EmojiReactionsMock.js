import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import like from "../../Images/emoji/like.png";
import love from "../../Images/emoji/love.png";
import care from "../../Images/emoji/care.png";
import laugh from "../../Images/emoji/laugh.png";
import wow from "../../Images/emoji/wow.png";
import sad from "../../Images/emoji/sad.png";
import angry from "../../Images/emoji/angry.png";
import './EmojiReactions.css';

const API_BASE = "http://localhost:3000";

const EmojiReactionsMock = ({ 
  postId, 
  postType = 'answer',
  currentUserId,
  initialReactions = {},
  onReactionUpdate = () => {},
  showCounts = true,
  size = 'md'
}) => {
  const [reactions, setReactions] = useState(initialReactions);
  const [userReaction, setUserReaction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Available emoji reactions with their images
  const emojiOptions = [
    { emoji: like, type: 'like', label: 'Like' },
    { emoji: love, type: 'love', label: 'Love' },
    { emoji: care, type: 'care', label: 'Care' },
    { emoji: laugh, type: 'laugh', label: 'Laugh' },
    { emoji: wow, type: 'wow', label: 'Wow' },
    { emoji: sad, type: 'sad', label: 'Sad' },
    { emoji: angry, type: 'angry', label: 'Angry' }
  ];

  // Size configurations
  const sizeConfig = {
    sm: { emoji: 16, fontSize: '12px', padding: '2px 6px', gap: '4px' },
    md: { emoji: 20, fontSize: '14px', padding: '4px 8px', gap: '6px' },
    lg: { emoji: 24, fontSize: '16px', padding: '6px 10px', gap: '8px' }
  };

  const config = sizeConfig[size];

  // Mock version - no API calls, just local state management
  const handleReaction = async (reactionType) => {
    if (!currentUserId || loading) return;
    
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const newReactions = { ...reactions };
      
      // Remove previous reaction count
      if (userReaction && newReactions[userReaction] !== undefined) {
        newReactions[userReaction] = Math.max(0, (newReactions[userReaction] || 0) - 1);
      }

      // Add new reaction count or remove if same reaction
      if (userReaction === reactionType) {
        // User clicked same reaction - remove it
        setUserReaction(null);
        console.log(`Removed ${reactionType} reaction`);
      } else {
        // User clicked different reaction - add it
        newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
        setUserReaction(reactionType);
        console.log(`Added ${reactionType} reaction`);
      }

      setReactions(newReactions);
      onReactionUpdate(newReactions);
      setLoading(false);
    }, 300);
  };

  // Calculate total reactions
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + (count || 0), 0);

  return (
    <div className={`emoji-reactions emoji-reactions-${size}`} style={{ gap: config.gap }}>
      {emojiOptions.map(({ emoji, type, label }) => {
        const count = reactions[type] || 0;
        const isActive = userReaction === type;
        const hasReactions = count > 0;
        
        // Only show reactions that have counts or the user's active reaction
        if (!showCounts && !isActive && !hasReactions) return null;
        
        return (
          <Button
            key={type}
            variant="link"
            size="sm"
            className={`emoji-reaction-btn ${isActive ? 'active' : ''} ${hasReactions ? 'has-reactions' : ''}`}
            onClick={() => handleReaction(type)}
            disabled={loading}
            title={`${label} (${count})`}
            style={{
              fontSize: config.fontSize,
              padding: config.padding,
              border: isActive ? '2px solid #0d6efd' : '1px solid #dee2e6',
              backgroundColor: isActive ? '#e7f3ff' : 'transparent',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: isActive ? '#0d6efd' : '#6c757d',
              transition: 'all 0.2s ease'
            }}
          >
            <img
              src={emoji}
              alt={label}
              style={{
                width: config.emoji,
                height: config.emoji,
                opacity: loading ? 0.5 : 1
              }}
            />
            {showCounts && count > 0 && (
              <span className="reaction-count" style={{ fontWeight: 'bold' }}>
                {count}
              </span>
            )}
          </Button>
        );
      })}
      
      {/* Total reactions summary (optional) */}
      {showCounts && totalReactions > 0 && (
        <span className="total-reactions" style={{ 
          fontSize: config.fontSize, 
          color: '#6c757d',
          marginLeft: config.gap 
        }}>
          {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

export default EmojiReactionsMock;
