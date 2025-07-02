# Backend API Endpoints for Emoji Reactions

## Required API Endpoints

### 1. Get User's Reaction for a Post
**POST** `/reactions/user-reaction`

Request Body:
```json
{
  "post_id": "answer_123",
  "post_type": "answer", // "answer", "question", "comment"
  "user_id": "user_456"
}
```

Response:
```json
{
  "status": true,
  "data": {
    "reaction_type": "like" // or null if no reaction
  }
}
```

### 2. Get Reaction Counts for a Post
**POST** `/reactions/counts`

Request Body:
```json
{
  "post_id": "answer_123",
  "post_type": "answer"
}
```

Response:
```json
{
  "status": true,
  "data": {
    "like": 12,
    "love": 8,
    "care": 2,
    "laugh": 5,
    "wow": 3,
    "sad": 1,
    "angry": 0
  }
}
```

### 3. Toggle User Reaction
**POST** `/reactions/toggle-reaction`

Request Body:
```json
{
  "post_id": "answer_123",
  "post_type": "answer",
  "user_id": "user_456",
  "reaction_type": "like"
}
```

Response:
```json
{
  "status": true,
  "message": "Reaction toggled successfully",
  "data": {
    "action": "added", // or "removed"
    "reaction_type": "like",
    "new_count": 13
  }
}
```

## Database Schema Example

### reactions table
```sql
CREATE TABLE reactions (
  id VARCHAR(255) PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  post_type ENUM('answer', 'question', 'comment') NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  reaction_type ENUM('like', 'love', 'care', 'laugh', 'wow', 'sad', 'angry') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_post_reaction (post_id, post_type, user_id),
  INDEX idx_post_reactions (post_id, post_type),
  INDEX idx_user_reactions (user_id)
);
```

## Integration with Existing Data

When returning answers, questions, or comments from your API, include the reactions data:

### Example Answer Response with Reactions
```json
{
  "_id": "answer_123",
  "answer": "The Civil War erupted primarily due to...",
  "student_id": {
    "_id": "student_456",
    "name": "Carol Smith"
  },
  "date": "2025-01-15T10:30:00Z",
  "reactions": {
    "like": 12,
    "love": 8,
    "laugh": 5,
    "wow": 3,
    "care": 2,
    "sad": 1,
    "angry": 0
  },
  "user_reaction": "like", // Current user's reaction (if any)
  "score": 8,
  "explanation": "Good analysis...",
  "solution": "The complete answer should include..."
}
```

## Usage in Frontend Components

### Basic Usage
```jsx
import EmojiReactions from '../components/EmojiReactions';

// In your component
<EmojiReactions
  postId={answer._id}
  postType="answer"
  currentUserId={currentUser._id}
  initialReactions={answer.reactions}
  onReactionUpdate={(newReactions) => {
    // Update parent state if needed
    setAnswers(prev => prev.map(a => 
      a._id === answer._id 
        ? { ...a, reactions: newReactions }
        : a
    ));
  }}
  showCounts={true}
  size="md"
/>
```

### Different Sizes
```jsx
// Small size for compact areas
<EmojiReactions size="sm" showCounts={true} />

// Medium size (default)
<EmojiReactions size="md" showCounts={true} />

// Large size for main content
<EmojiReactions size="lg" showCounts={true} />
```

### Without Counts
```jsx
// Just emoji buttons without counts
<EmojiReactions 
  showCounts={false} 
  size="sm"
/>
```
