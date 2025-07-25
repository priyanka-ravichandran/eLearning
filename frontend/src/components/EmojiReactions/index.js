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
import { useReactToAnswerMutation } from '../../redux/api/questionsApi';
import { toast } from 'react-toastify';

const API_BASE = "http://localhost:3000";

const EmojiReactions = ({ 
  postId, 
  postType = 'answer', // 'answer', 'question', 'comment'
  currentUserId,
  questionId, // Add questionId prop for the existing API
  initialReactions = {},
  userReaction: initialUserReaction = null, // Add prop for initial user reaction
  onReactionUpdate = () => {},
  showCounts = true,
  size = 'md' // 'sm', 'md', 'lg'
}) => {
  const [reactions, setReactions] = useState(initialReactions);
  const [userReaction, setUserReaction] = useState(initialUserReaction);
  const [loading, setLoading] = useState(false);
  
  // Use existing API hook
  const [reactToAnswer] = useReactToAnswerMutation();

  // Update local state when props change
  useEffect(() => {
    setReactions(initialReactions);
    setUserReaction(initialUserReaction);
  }, [initialReactions, initialUserReaction]);

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

  // Handle emoji reaction click using existing API
  const handleReaction = async (reactionType) => {
    if (!currentUserId || loading || !questionId) return;
    
    console.log('🚀 Emoji reaction clicked:', {
      reactionType,
      postId,
      postType,
      currentUserId,
      questionId,
      currentUserReaction: userReaction
    });
    
    try {
      setLoading(true);
      
      // Use existing API that works
      const response = await reactToAnswer({
        question_id: questionId,
        reaction_by: currentUserId,
        reaction_for: postId,
        reaction: reactionType,
      });

      console.log('API Response:', response);

      // Check if backend returned reaction summary
      if (response?.data?.reactionSummary) {
        // Use backend's reaction summary
        setReactions(response.data.reactionSummary);
        setUserReaction(response.data.userReaction);
        onReactionUpdate(response.data.reactionSummary);
        
        console.log('✅ Updated reactions from backend:', {
          reactions: response.data.reactionSummary,
          userReaction: response.data.userReaction
        });
      } else {
        // Fallback to optimistic update
        const newReactions = { ...reactions };
        
        // Remove previous reaction count
        if (userReaction && newReactions[userReaction] !== undefined) {
          newReactions[userReaction] = Math.max(0, (newReactions[userReaction] || 0) - 1);
        }

        // Add new reaction count or remove if same reaction
        if (userReaction === reactionType) {
          // User clicked same reaction - remove it
          setUserReaction(null);
          console.log('✅ Removed reaction:', reactionType);
        } else {
          // User clicked different reaction - add it
          newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
          setUserReaction(reactionType);
          console.log('✅ Added reaction:', reactionType);
        }

        setReactions(newReactions);
        onReactionUpdate(newReactions);
      }

      // Show toast message based on backend response
      if (userReaction === reactionType) {
        toast.success(`Removed ${reactionType} reaction`);
      } else {
        // Check if backend provided points information
        const pointsAwarded = response?.data?.reaction_details?.points_awarded;
        const achievement = response?.data?.achievement;
        
        // Only show points message for like and love reactions
        if ((reactionType === 'like' || reactionType === 'love') && pointsAwarded > 0) {
          // Show message indicating points were awarded to answer author
          toast.success(`Reacted with ${reactionType}! +${pointsAwarded} points awarded to answer author`, {
            autoClose: 4000
          });
          
          // If we have access to refresh function, trigger a global refresh
          // This could be passed as a prop from parent components
          if (window.refreshUserPoints && typeof window.refreshUserPoints === 'function') {
            console.log('🔄 Triggering global points refresh after reaction...');
            window.refreshUserPoints();
          }
        } else if (reactionType === 'like' || reactionType === 'love') {
          // Fallback for thumbs up/heart if backend didn't provide points info
          toast.success(`Reacted with ${reactionType}! The answer author earned +2 points`);
        } else {
          // For other reactions, just show basic message
          toast.success(`Reacted with ${reactionType}`);
        }
      }
      
    } catch (err) {
      console.log('❌ Failed to toggle reaction:', err);
      toast.error('Failed to submit reaction');
    } finally {
      setLoading(false);
    }
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

export default EmojiReactions;
