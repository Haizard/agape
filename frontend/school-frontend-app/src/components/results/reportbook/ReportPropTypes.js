import PropTypes from 'prop-types';

// Define the report prop types structure
const ReportPropTypes = {
  report: PropTypes.shape({
    reportTitle: PropTypes.string,
    schoolName: PropTypes.string,
    schoolLogo: PropTypes.string,
    academicYear: PropTypes.string,
    term: PropTypes.string,
    examName: PropTypes.string,
    examDate: PropTypes.string,
    educationLevel: PropTypes.string,
    formLevel: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    
    studentDetails: PropTypes.shape({
      name: PropTypes.string,
      rollNumber: PropTypes.string,
      class: PropTypes.string,
      gender: PropTypes.string,
      form: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      subjectCombination: PropTypes.string,
      dateOfBirth: PropTypes.string,
      admissionNumber: PropTypes.string,
      parentName: PropTypes.string,
      parentContact: PropTypes.string
    }),
    
    principalSubjects: PropTypes.arrayOf(
      PropTypes.shape({
        subject: PropTypes.string,
        code: PropTypes.string,
        marks: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
        grade: PropTypes.string,
        points: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
        isPrincipal: PropTypes.bool,
        remarks: PropTypes.string
      })
    ),
    
    subsidiarySubjects: PropTypes.arrayOf(
      PropTypes.shape({
        subject: PropTypes.string,
        code: PropTypes.string,
        marks: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
        grade: PropTypes.string,
        points: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
        isPrincipal: PropTypes.bool,
        remarks: PropTypes.string
      })
    ),
    
    allSubjects: PropTypes.arrayOf(
      PropTypes.shape({
        subject: PropTypes.string,
        code: PropTypes.string,
        marks: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
        grade: PropTypes.string,
        points: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
        isPrincipal: PropTypes.bool,
        remarks: PropTypes.string
      })
    ),
    
    summary: PropTypes.shape({
      totalMarks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      averageMarks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      totalPoints: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      bestThreePoints: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      division: PropTypes.string,
      rank: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      totalStudents: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      gradeDistribution: PropTypes.objectOf(PropTypes.number)
    }),
    
    characterAssessment: PropTypes.shape({
      discipline: PropTypes.string,
      attendance: PropTypes.string,
      attitude: PropTypes.string,
      punctuality: PropTypes.string,
      cleanliness: PropTypes.string,
      leadership: PropTypes.string,
      participation: PropTypes.string,
      comments: PropTypes.string
    }),
    
    attendance: PropTypes.shape({
      totalDays: PropTypes.number,
      present: PropTypes.number,
      absent: PropTypes.number,
      late: PropTypes.number,
      excused: PropTypes.number,
      attendancePercentage: PropTypes.number
    }),
    
    teacherComments: PropTypes.shape({
      classTeacher: PropTypes.string,
      principalComments: PropTypes.string,
      academicRecommendations: PropTypes.string,
      characterRecommendations: PropTypes.string,
      nextTermGoals: PropTypes.string
    })
  }).isRequired
};

export default ReportPropTypes;
