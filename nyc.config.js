module.exports = {
  
  all: true,
  
  include: [
    'src/**/*.js'
  ],

  reporter: [
    'cobertura',
    'html',
    'text',
    'text-summary'
  ],

  checkCoverage: true,

  lines: 80,
  functions: 80,
  branches: 70,
  statements: 80,

  watermarks: {
    lines: [75, 85],
    functions: [75, 85],
    branches: [75, 85],
    statements: [75, 85]
  }
};