module.exports = {
  hooks: {
    "pre-publish": "npm run coverage && snpm run size"
  }
}
