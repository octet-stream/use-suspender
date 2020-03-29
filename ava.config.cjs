module.exports = {
  files: [
    "test.js"
  ],
  require: [
    "jsdom-global/register"
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
    },
    compileAsTests: [
      "test/__helper__/**"
    ]
  }
}
