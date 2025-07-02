# Backend Implementation Required for Emoji Reactions

## API Endpoints to Implement

### 1. Get User's Reaction
**POST** `/reactions/user-reaction`
```json
Request: {
  "post_id": "answer_123",
  "post_type": "answer",
  "user_id": "user_456"
}

Response: {
  "status": true,
  "data": {
    "reaction_type": "like" // or null
  }
}
```

### 2. Get Reaction Counts
**POST** `/reactions/counts`
```json
Request: {
  "post_id": "answer_123",
  "post_type": "answer"
}

Response: {
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

### 3. Toggle Reaction
**POST** `/reactions/toggle-reaction`
```json
Request: {
  "post_id": "answer_123",
  "post_type": "answer",
  "user_id": "user_456",
  "reaction_type": "like"
}

Response: {
  "status": true,
  "message": "Reaction toggled successfully",
  "data": {
    "action": "added", // or "removed"
    "reaction_type": "like",
    "new_count": 13
  }
}
```

## Database Schema Needed

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
