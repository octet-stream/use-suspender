module.exports = {
  files: [
    "test/**",
    "!test/**/__helper__/**"
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
