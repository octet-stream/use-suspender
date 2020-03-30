module.exports = {
  files: [
    "test.js"
  ],
  babel: {
    extensions: [
      "js",
      "jsx"
    ],
    testOptions: {
      presets: [
        [
          "@babel/preset-react",
          {
            pragma: "createElement"
          }
        ]
      ]
    }
  }
}
