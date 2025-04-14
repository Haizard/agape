/**
 * Demo Subject Combinations for A-Level Form 5
 * 
 * This file contains predefined subject combinations for testing the Form 5 class report feature.
 * Each combination includes principal and subsidiary subjects according to Tanzania's A-Level curriculum.
 */

const demoSubjectCombinations = [
  {
    code: 'PCM',
    name: 'Physics, Chemistry, Mathematics',
    description: 'Science combination for engineering and medical fields',
    subjects: {
      principal: [
        { code: 'PHY', name: 'Physics' },
        { code: 'CHE', name: 'Chemistry' },
        { code: 'MAT', name: 'Mathematics' }
      ],
      subsidiary: [
        { code: 'GS', name: 'General Studies' },
        { code: 'BIT', name: 'Basic Information Technology' }
      ]
    }
  },
  {
    code: 'PCB',
    name: 'Physics, Chemistry, Biology',
    description: 'Science combination for medical fields',
    subjects: {
      principal: [
        { code: 'PHY', name: 'Physics' },
        { code: 'CHE', name: 'Chemistry' },
        { code: 'BIO', name: 'Biology' }
      ],
      subsidiary: [
        { code: 'GS', name: 'General Studies' },
        { code: 'BIT', name: 'Basic Information Technology' }
      ]
    }
  },
  {
    code: 'CBG',
    name: 'Chemistry, Biology, Geography',
    description: 'Science combination for environmental and health sciences',
    subjects: {
      principal: [
        { code: 'CHE', name: 'Chemistry' },
        { code: 'BIO', name: 'Biology' },
        { code: 'GEO', name: 'Geography' }
      ],
      subsidiary: [
        { code: 'GS', name: 'General Studies' },
        { code: 'BIT', name: 'Basic Information Technology' }
      ]
    }
  },
  {
    code: 'HGE',
    name: 'History, Geography, Economics',
    description: 'Arts combination for social sciences',
    subjects: {
      principal: [
        { code: 'HIS', name: 'History' },
        { code: 'GEO', name: 'Geography' },
        { code: 'ECO', name: 'Economics' }
      ],
      subsidiary: [
        { code: 'GS', name: 'General Studies' },
        { code: 'BIT', name: 'Basic Information Technology' }
      ]
    }
  },
  {
    code: 'HKL',
    name: 'History, Kiswahili, Literature',
    description: 'Arts combination for language and humanities',
    subjects: {
      principal: [
        { code: 'HIS', name: 'History' },
        { code: 'KIS', name: 'Kiswahili' },
        { code: 'LIT', name: 'Literature' }
      ],
      subsidiary: [
        { code: 'GS', name: 'General Studies' },
        { code: 'BIT', name: 'Basic Information Technology' }
      ]
    }
  },
  {
    code: 'EGM',
    name: 'Economics, Geography, Mathematics',
    description: 'Mixed combination for business and analytics',
    subjects: {
      principal: [
        { code: 'ECO', name: 'Economics' },
        { code: 'GEO', name: 'Geography' },
        { code: 'MAT', name: 'Mathematics' }
      ],
      subsidiary: [
        { code: 'GS', name: 'General Studies' },
        { code: 'BIT', name: 'Basic Information Technology' }
      ]
    }
  },
  {
    code: 'ECA',
    name: 'Economics, Commerce, Accountancy',
    description: 'Business combination for commerce and finance',
    subjects: {
      principal: [
        { code: 'ECO', name: 'Economics' },
        { code: 'COM', name: 'Commerce' },
        { code: 'ACC', name: 'Accountancy' }
      ],
      subsidiary: [
        { code: 'GS', name: 'General Studies' },
        { code: 'BIT', name: 'Basic Information Technology' }
      ]
    }
  }
];

module.exports = demoSubjectCombinations;
