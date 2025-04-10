// Constants for grade boundaries
const GRADE_BOUNDARIES = {
  A: 75,
  'B+': 65,
  B: 55,
  C: 45,
  D: 35,
  F: 0
};

// Constants for division boundaries
const DIVISION_BOUNDARIES = {
  I: 75,    // Division I: 75-100
  II: 65,   // Division II: 65-74
  III: 45,  // Division III: 45-64
  IV: 35,   // Division IV: 35-44
  0: 0      // Fail: 0-34
};

export const calculateGrade = (marks) => {
  if (typeof marks !== 'number' || marks < 0 || marks > 100) {
    throw new Error('Invalid marks: Must be a number between 0 and 100');
  }

  for (const [grade, boundary] of Object.entries(GRADE_BOUNDARIES)) {
    if (marks >= boundary) return grade;
  }
  return 'F';
};

export const calculateAverageScore = (scores) => {
  if (!Array.isArray(scores) || scores.length === 0) {
    throw new Error('Invalid scores: Must be a non-empty array of numbers');
  }

  const validScores = scores.filter(score => 
    typeof score === 'number' && score >= 0 && score <= 100
  );

  if (validScores.length === 0) {
    throw new Error('No valid scores found');
  }

  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return sum / validScores.length;
};

export const calculateDivision = (scores) => {
  const averageScore = calculateAverageScore(scores);
  
  for (const [division, boundary] of Object.entries(DIVISION_BOUNDARIES)) {
    if (averageScore >= boundary) {
      return {
        division,
        averageScore: averageScore.toFixed(2),
        totalSubjects: scores.length,
        totalScore: scores.reduce((acc, score) => acc + score, 0)
      };
    }
  }
};

export const calculateSubjectGrades = (subjects) => {
  return subjects.map(subject => ({
    ...subject,
    grade: calculateGrade(subject.score),
  }));
};

// Helper function to generate result summary
export const generateResultSummary = (subjects) => {
  const scores = subjects.map(subject => subject.score);
  const divisionResult = calculateDivision(scores);
  const gradedSubjects = calculateSubjectGrades(subjects);
  
  return {
    ...divisionResult,
    subjects: gradedSubjects,
    gradeDistribution: gradedSubjects.reduce((acc, subject) => {
      acc[subject.grade] = (acc[subject.grade] || 0) + 1;
      return acc;
    }, {}),
  };
};
