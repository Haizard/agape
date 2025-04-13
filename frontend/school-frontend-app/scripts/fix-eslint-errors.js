const fs = require('fs');
const path = require('path');

// Fix TeacherManagement.jsx
const teacherManagementPath = path.join(__dirname, '..', 'src', 'components', 'TeacherManagement.jsx');
if (fs.existsSync(teacherManagementPath)) {
  console.log('Fixing TeacherManagement.jsx...');
  let content = fs.readFileSync(teacherManagementPath, 'utf8');
  
  // Add resetForm declaration if it doesn't exist
  if (content.includes('resetForm(') && !content.includes('const resetForm')) {
    content = content.replace(
      'const handleSubmit = (e) => {',
      'const resetForm = () => {\n    setFormData(initialFormData);\n  };\n\n  const handleSubmit = (e) => {'
    );
    fs.writeFileSync(teacherManagementPath, content);
    console.log('Fixed resetForm in TeacherManagement.jsx');
  }
}

// Fix ClassManagement.js
const classManagementPath = path.join(__dirname, '..', 'src', 'components', 'academic', 'ClassManagement.js');
if (fs.existsSync(classManagementPath)) {
  console.log('Fixing ClassManagement.js...');
  let content = fs.readFileSync(classManagementPath, 'utf8');
  
  // Add combination declaration if it doesn't exist
  if (content.includes('combination') && !content.includes('const combination')) {
    content = content.replace(
      'const handleSubmit = async (e) => {',
      'const combination = "";\n\n  const handleSubmit = async (e) => {'
    );
    fs.writeFileSync(classManagementPath, content);
    console.log('Fixed combination in ClassManagement.js');
  }
}

// Fix ResultSmsNotification.js
const resultSmsPath = path.join(__dirname, '..', 'src', 'components', 'teacher', 'ResultSmsNotification.js');
if (fs.existsSync(resultSmsPath)) {
  console.log('Fixing ResultSmsNotification.js...');
  let content = fs.readFileSync(resultSmsPath, 'utf8');
  
  // Add axios import if it doesn't exist
  if (content.includes('axios') && !content.includes("import axios")) {
    content = content.replace(
      "import React",
      "import axios from 'axios';\nimport React"
    );
    fs.writeFileSync(resultSmsPath, content);
    console.log('Fixed axios import in ResultSmsNotification.js');
  }
}

console.log('ESLint errors fixed successfully.');
