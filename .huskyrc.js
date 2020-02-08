module.exports = {
  hooks: {
    "pre-commit": "npm run staged",
    "pre-push": "npm run coverage && npm run size"
  }
}
