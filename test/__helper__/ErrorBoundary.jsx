const {createElement, Component} = require("react")

const {node} = require("prop-types")

class ErrorBoundary extends Component {
  constructor() {
    super()

    this.state = {
      error: null
    }
  }

  componentDidCatch(error) {
    this.setState(() => ({error}))
  }

  render() {
    const {error} = this.state

    if (!error) {
      return this.props.children
    }

    if (error instanceof Promise) {
      throw error
    }

    return createElement("div", null, error.message)
  }
}

ErrorBoundary.propTypes = {
  children: node.isRequired
}

module.exports = ErrorBoundary
