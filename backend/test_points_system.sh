#!/bin/bash
# Points System Test Script
# To run this test script, execute: bash test_points_system.sh

# Configuration - EDIT THESE VALUES
BASE_URL="http://localhost:3000"  # Change if your server runs on a different port
STUDENT_ID="<STUDENT_ID_HERE>"    # Replace with a valid student ID from your database
QUESTION_ID="<QUESTION_ID_HERE>"  # Replace with a valid question ID from your database
ANSWER_STUDENT_ID="<ANSWER_STUDENT_ID_HERE>"  # ID of student whose answer will receive reaction

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test 1: Check current student points
echo -e "${BLUE}TEST 1: Checking student's current points...${NC}"
response=$(curl -s "$BASE_URL/api/v1/test/student/$STUDENT_ID/points")

echo -e "${GREEN}Current points for student $STUDENT_ID:${NC}"
echo "$response" | jq

# Test 2: Award points manually
echo -e "\n${BLUE}TEST 2: Awarding 10 test points...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/v1/test/student/$STUDENT_ID/award-points" \
    -H "Content-Type: application/json" \
    -d "{\"points\": 10, \"reason\": \"Test points award\"}")

echo -e "${GREEN}Points awarded successfully!${NC}"
echo "$response" | jq

# Test 3: Simulate a reaction (thumbs up)
echo -e "\n${BLUE}TEST 3: Simulating a thumbs up reaction...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/v1/test/simulate-reaction" \
    -H "Content-Type: application/json" \
    -d "{\"question_id\": \"$QUESTION_ID\", \"reaction_by\": \"$STUDENT_ID\", \"reaction_for\": \"$ANSWER_STUDENT_ID\", \"reaction\": \"👍\"}")

echo -e "${GREEN}Reaction simulation completed!${NC}"
echo "$response" | jq

# Test 4: Check final student points
echo -e "\n${BLUE}TEST 4: Checking final student points...${NC}"
response=$(curl -s "$BASE_URL/api/v1/test/student/$ANSWER_STUDENT_ID/points")

echo -e "${GREEN}Final points for student $ANSWER_STUDENT_ID:${NC}"
echo "$response" | jq

echo -e "\n${CYAN}All tests completed!${NC}"
