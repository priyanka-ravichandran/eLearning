// Test script to verify avatar URLs are being returned by backend
const mongoose = require('mongoose');
require('dotenv').config();

const { Student } = require('./src/model/Student.model');
const { StudentQuestion } = require('./src/model/StudentQuestion.model');
const questionRepo = require('./src/repository/student_question.repository');
const studentRepo = require('./src/repository/student.repository');

async function testAvatarEndpoints() {
  try {
    const dbConnectionString = 'mongodb+srv://eLearning:Y1fVPMsdF6wBkpnv@cluster0.4rgqovz.mongodb.net/eLearningDb?retryWrites=true&w=majority&authSource=admin';
    await mongoose.connect(dbConnectionString);
    console.log('Connected to database');

    // Test 1: Check if students have avatars in database
    console.log('\n=== TEST 1: Students with avatars ===');
    const studentsWithAvatars = await Student.find({ avatar: { $exists: true, $ne: null } })
      .select('name email avatar')
      .limit(3);
    
    console.log('Students with avatars:', studentsWithAvatars);

    // Test 2: Test leaderboard (already working)
    console.log('\n=== TEST 2: Leaderboard response ===');
    const leaderboard = await studentRepo.get_inidividual_leaderboard();
    console.log('Leaderboard sample (first 2 students):', 
      leaderboard.individual_leaderboard.slice(0, 2).map(s => ({
        name: s.name,
        avatar: s.avatar,
        avatarUrl: s.avatarUrl
      }))
    );

    // Test 3: Test question details (Q&A page)
    console.log('\n=== TEST 3: Question details response ===');
    const questions = await StudentQuestion.find()
      .populate('created_by', 'name avatar')
      .limit(1);
    
    if (questions.length > 0) {
      const questionDetails = await questionRepo.get_question_details(questions[0]._id);
      console.log('Question author data:', {
        name: questionDetails.created_by?.name,
        avatar: questionDetails.created_by?.avatar,
        avatarUrl: questionDetails.created_by?.avatarUrl
      });

      if (questionDetails.answers && questionDetails.answers.length > 0) {
        console.log('Answer author data (first answer):', {
          name: questionDetails.answers[0].student_id?.name,
          avatar: questionDetails.answers[0].student_id?.avatar,
          avatarUrl: questionDetails.answers[0].student_id?.avatarUrl
        });
      }
    }

    // Test 4: Test questions for week (Q&A list)
    console.log('\n=== TEST 4: Questions for week response ===');
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    const weekQuestions = await questionRepo.get_questions_for_week(startDate, endDate);
    
    if (weekQuestions.week && weekQuestions.week.created_by) {
      console.log('Week question author:', {
        name: weekQuestions.week.created_by?.name,
        avatar: weekQuestions.week.created_by?.avatar,
        avatarUrl: weekQuestions.week.created_by?.avatarUrl
      });
    }

    // Test 5: Check what frontend might be calling
    console.log('\n=== TEST 5: All questions (what frontend might use) ===');
    const allQuestions = await questionRepo.get_student_questions_posted('All');
    if (allQuestions.length > 0) {
      console.log('First question author:', {
        name: allQuestions[0].created_by?.name,
        avatar: allQuestions[0].created_by?.avatar,
        avatarUrl: allQuestions[0].created_by?.avatarUrl
      });
    }

    await mongoose.disconnect();
    console.log('\n=== Tests completed ===');
  } catch (error) {
    console.error('Test error:', error);
    await mongoose.disconnect();
  }
}

testAvatarEndpoints();
