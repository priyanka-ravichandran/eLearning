# Points System Testing Guide

This guide helps you test the points system in the e-learning application, which awards:
- 5 points for posting a question
- 2 points for receiving a thumbs up or heart reaction on an answer

## Testing the Points System

### Prerequisites
1. The e-learning backend server must be running
2. You need valid IDs from your database:
   - A student ID
   - A question ID
   - An answer student ID (the ID of a student who has answered the question)

### Testing Options

#### 1. Using Test Endpoints Directly

The following test endpoints have been added:

- **GET** `/api/v1/test/student/:student_id/points`  
  Returns current points info for a student

- **POST** `/api/v1/test/student/:student_id/award-points`  
  Manually awards points to a student  
  Body: `{ "points": number, "reason": "string" }`

- **POST** `/api/v1/test/simulate-reaction`  
  Simulates a reaction on an answer and awards points  
  Body: `{ "question_id": "id", "reaction_by": "student_id", "reaction_for": "answer_student_id", "reaction": "emoji" }`

#### 2. Using Test Scripts

Two test scripts are provided to automate the testing process:

##### PowerShell Script (Windows)
1. Edit `test_points_system.ps1` and update the following variables:
   - `$BASE_URL` - The URL of your backend server
   - `$STUDENT_ID` - ID of a student in your database
   - `$QUESTION_ID` - ID of a question in your database
   - `$ANSWER_STUDENT_ID` - ID of a student who answered the question

2. Run the script:
   ```
   .\test_points_system.ps1
   ```

##### Bash Script (Linux/Mac/WSL)
1. Edit `test_points_system.sh` and update the following variables:
   - `BASE_URL` - The URL of your backend server
   - `STUDENT_ID` - ID of a student in your database
   - `QUESTION_ID` - ID of a question in your database
   - `ANSWER_STUDENT_ID` - ID of a student who answered the question

2. Make the script executable and run it:
   ```
   chmod +x test_points_system.sh
   ./test_points_system.sh
   ```

## Debug Question Structure

If you're having trouble finding valid IDs for testing, use the debug endpoint:

```
GET /student_question/debug_question/:question_id
```

This returns a simplified structure of a question and its answers, showing both the answer IDs and student IDs.

## Implementation Details

The points system has been implemented with these features:

1. **Question Posting (5 points)**
   - Points are awarded when a student posts a question
   - Added to `points_breakdown.question_posting_points`

2. **Reactions on Answers (2 points)**
   - Points are awarded when an answer receives a thumbs up or heart reaction
   - Added to `points_breakdown.reaction_points`
   - Reactions can be matched by either answer._id or student_id

3. **Robust ID Handling**
   - The backend now tries to match answers by both answer._id and student_id
   - This ensures reactions work regardless of which ID the frontend sends

4. **Improved Points Management**
   - Points updates use `$set` instead of `$inc` to avoid MongoDB operator conflicts
   - Each action has its own breakdown category for better tracking
