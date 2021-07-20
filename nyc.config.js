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

  statements: 85,
  branches: 75,
  functions: 80,
  lines: 85,

  watermarks: {
    statements: [75, 85],
    branches: [75, 85],
    functions: [75, 85],
    lines: [75, 85]
  }
};