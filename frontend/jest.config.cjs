module.exports = {
  testEnvironment: "jsdom",

  setupFilesAfterEnv: ["<rootDir>/src/test/setup.js"],

  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  moduleFileExtensions: ["js", "jsx"],

  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
};