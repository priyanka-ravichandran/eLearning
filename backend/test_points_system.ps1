# Points System Test Script
# To run this test script, execute it with PowerShell or cmd.exe

# Configuration - EDIT THESE VALUES
$BASE_URL = "http://localhost:3000"  # Change if your server runs on a different port
$STUDENT_ID = "<STUDENT_ID_HERE>"    # Replace with a valid student ID from your database
$QUESTION_ID = "<QUESTION_ID_HERE>"  # Replace with a valid question ID from your database
$ANSWER_STUDENT_ID = "<ANSWER_STUDENT_ID_HERE>"  # ID of student whose answer will receive reaction

# Test 1: Check current student points
Write-Host "TEST 1: Checking student's current points..." -ForegroundColor Blue
$response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/test/student/$STUDENT_ID/points" -Method GET

Write-Host "Current points for student $STUDENT_ID:" -ForegroundColor Green
Write-Host "Current points: $($response.data.current_points)"
Write-Host "Total points earned: $($response.data.total_points_earned)"
Write-Host "Points breakdown: $($response.data.points_breakdown | ConvertTo-Json)"

# Test 2: Award points manually
Write-Host "`nTEST 2: Awarding 10 test points..." -ForegroundColor Blue
$body = @{
    points = 10
    reason = "Test points award"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/test/student/$STUDENT_ID/award-points" `
    -Method POST -Body $body -ContentType "application/json"

Write-Host "Points awarded successfully!" -ForegroundColor Green
Write-Host "New points total: $($response.data.current_points)"
Write-Host "Updated points breakdown: $($response.data.points_breakdown | ConvertTo-Json)"

# Test 3: Simulate a reaction (thumbs up)
Write-Host "`nTEST 3: Simulating a thumbs up reaction..." -ForegroundColor Blue
$body = @{
    question_id = $QUESTION_ID
    reaction_by = $STUDENT_ID
    reaction_for = $ANSWER_STUDENT_ID
    reaction = "👍"  # Thumbs up emoji
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/test/simulate-reaction" `
    -Method POST -Body $body -ContentType "application/json"

Write-Host "Reaction simulation completed!" -ForegroundColor Green
Write-Host "Reaction results: $($response.data.reaction_result | ConvertTo-Json)"
Write-Host "Student points after reaction: $($response.data.student_points | ConvertTo-Json)"

# Test 4: Check final student points
Write-Host "`nTEST 4: Checking final student points..." -ForegroundColor Blue
$response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/test/student/$ANSWER_STUDENT_ID/points" -Method GET

Write-Host "Final points for student $ANSWER_STUDENT_ID:" -ForegroundColor Green
Write-Host "Current points: $($response.data.current_points)"
Write-Host "Total points earned: $($response.data.total_points_earned)"
Write-Host "Points breakdown: $($response.data.points_breakdown | ConvertTo-Json)"

Write-Host "`nAll tests completed!" -ForegroundColor Cyan
