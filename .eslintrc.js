module.exports = {
  env: {
    browser: true
  },
  parserOptions: {
    ecmaFeatures: {
      modules: true,
      jsx: true
    }
  },
  plugins: [
    "ava",
    "markdown"
  ],
  extends: [
    "@octetstream",
    "plugin:ava/recommended",
    "plugin:react/recommended"
  ],
  rules: {
    "ava/no-ignored-test-files": ["error", {
      files: ["*.test.js"]
    }],
    "import/no-unresolved": ["error", {
      ignore: ["use-suspender", "react", "react-dom", "./api/user"]
    }],
    "max-len": ["error", {
      code: 80,
      ignoreComments: true
    }]
  }
}
