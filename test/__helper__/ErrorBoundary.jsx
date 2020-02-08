const {createElement, Component} = require("react")

const {node} = require("prop-types")

class ErrorHandler extends Component {
  static propTypes = {
    children: node.isRequired
  }

  state = {
    error: null
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

module.exports = ErrorHandler
