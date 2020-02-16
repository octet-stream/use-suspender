module.exports = {
  "env": {
    "browser": true
  },
  parserOptions: {
    ecmaFeatures: {
      modules: true,
      jsx: true
    }
  },
  "plugins": [
    "ava",
    "markdown",
    "react"
  ],
  "settings": {
    react: {
      version: "detect",
      pragma: "createElement"
    }
  },
  "extends": [
    "@octetstream",
    "plugin:ava/recommended",
    "plugin:react/recommended"
  ],
  rules: {
    "import/no-unresolved": ["error", {
      "ignore": ["use-suspender", "react", "react-dom", "./api/user"]
    }]
  }
}
