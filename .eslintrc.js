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
  settings: {
    react: {
      version: "18.x"
    }
  },
  plugins: [
    "ava"
  ],
  extends: [
    "plugin:ava/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "@octetstream"
  ],
  rules: {
    "ava/no-ignored-test-files": ["error", {
      files: ["*.test.js"]
    }]
  }
}
