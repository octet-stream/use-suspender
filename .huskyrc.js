module.exports = {
  hooks: {
    "pre-commit": "npm run staged",
    "pre-publish": "npm run coverage && npm run size"
  }
}
