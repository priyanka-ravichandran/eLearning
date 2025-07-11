// Force refresh Priya's student details with group info
const mongoose = require('mongoose');
const { Student } = require('./src/model/Student.model');
const { Group } = require('./src/model/Group.model');

async function getUpdatedStudentDetails() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect('mongodb+srv://eLearning:Y1fVPMsdF6wBkpnv@cluster0.4rgqovz.mongodb.net/eLearningDb?retryWrites=true&w=majority&authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected');

    // Get Priya's complete student details with group populated
    const priya = await Student.findOne({ email: 'pr397332@dal.ca' }).populate('group');
    
    if (priya && priya.group) {
      console.log('\n📋 COMPLETE STUDENT DETAILS FOR FRONTEND:');
      console.log('==========================================');
      
      const studentDetailsForFrontend = {
        student: {
          _id: priya._id,
          first_name: priya.first_name,
          last_name: priya.last_name,
          name: `${priya.first_name || ''} ${priya.last_name || ''}`.trim() || priya.email,
          email: priya.email,
          current_points: priya.current_points,
          total_points_earned: priya.total_points_earned,
          grade: priya.grade,
          individual_rank: priya.individual_rank,
          avatar: priya.avatar,
          group: {
            _id: priya.group._id,
            name: priya.group.name,
            code: priya.group.code,
            group_no: priya.group.group_no,
            current_points: priya.group.current_points,
            total_points_earned: priya.group.total_points_earned,
            group_rank: priya.group.group_rank,
            village_level: priya.group.village_level
          }
        }
      };
      
      console.log('✅ Student Details Object:');
      console.log(JSON.stringify(studentDetailsForFrontend, null, 2));
      
      console.log('\n🔑 KEY POINTS:');
      console.log('- Student ID:', priya._id);
      console.log('- Group ID:', priya.group._id);
      console.log('- Group Name:', priya.group.name);
      console.log('- Group Code:', priya.group.code);
      
      console.log('\n💡 TO FIX FRONTEND:');
      console.log('1. Copy the above JSON object');
      console.log('2. In browser console, run: localStorage.setItem("student_details", JSON.stringify(YOUR_COPIED_OBJECT))');
      console.log('3. Refresh the page');
      
    } else {
      console.log('❌ Student not found or no group assigned');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔚 Closing connection...');
    mongoose.connection.close();
  }
}

getUpdatedStudentDetails();
