const assert = require("node:assert")

const test = require("ava")

const {spy} = require("sinon")
const {Component, createElement} = require("react")
const {renderHook, render, waitFor} = require("@testing-library/react")

const createSuspender = require("./useSuspender")

class ErrorBoundary extends Component {
  constructor() {
    super()

    this.state = {error: null}
  }

  /**
   * @param {Error} error
   */
  static getDerivedStateFromError(error) {
    return {error}
  }

  render() {
    if (this.state.error) {
      return createElement("div", {role: "alert"}, this.state.error.message)
    }

    // eslint-disable-next-line react/prop-types
    return this.props.children
  }
}

// Suppress errors from React.
console.error = () => {}

test.beforeEach(t => {
  const element = document.createElement("div")

  t.context.element = element
  t.context.baseElement = document.body.appendChild(element)
})

test.afterEach(t => {
  document.body.removeChild(t.context.element)
})

test("Executes a function passed to createSuspender", t => {
  const fn = spy()
  const useSuspender = createSuspender(fn)

  renderHook(() => useSuspender())

  t.true(fn.called)
})

test("Calls a suspender with undefined as thisArg by default", t => {
  const fn = spy()
  const useSuspender = createSuspender(fn)

  renderHook(() => useSuspender())

  const {thisValue} = fn.firstCall

  t.is(thisValue, undefined)
})

test("Calls a suspender with thisArg taken by createSuspender", t => {
  const expected = new Map()

  const fn = spy(() => {})
  const useSuspender = createSuspender(fn, expected)

  renderHook(() => useSuspender())

  const {thisValue} = fn.firstCall

  t.is(thisValue, expected)
})

test("Returns a value from a suspender", async t => {
  const expected = "Rainbow Dash always dresses in style"

  const useSuspender = createSuspender(() => expected)

  const {result} = renderHook(() => useSuspender())

  await waitFor(() => assert(result.current))

  t.is(result.current, expected)
})

test("Returns a value resolved by Promise", async t => {
  const expected = "On Societ Moon, landscape see binoculars through YOU."

  const useSuspender = createSuspender(async () => expected)

  const {result} = renderHook(() => useSuspender())

  await waitFor(() => assert(result.current))

  t.is(result.current, expected)
})

test("Calls suspender with given arguments", t => {
  const expected = ["an argument", 42]

  const fn = spy()
  const useSuspender = createSuspender(fn)

  renderHook(() => useSuspender(...expected))

  const {args: actual} = fn.firstCall

  t.deepEqual(actual, expected)
})

test("Does not call a suspender again on re-render if args are the same", t => {
  const fn = spy()
  const useSuspender = createSuspender(fn)

  const {rerender} = renderHook(() => useSuspender())

  rerender()

  t.false(fn.calledTwice)
})

test("Calls a suspender when the new arguments taken", t => {
  const fn = spy()
  const useSuspender = createSuspender(fn)

  const {rerender} = renderHook(({id}) => useSuspender(id), {
    initialProps: {
      id: 1
    },
  })

  rerender({id: 2})

  t.true(fn.calledTwice)
})

test("Calls a suspender when .callEarly() called", t => {
  const fn = spy()

  const {callEarly} = createSuspender(fn)

  callEarly()

  t.true(fn.called)
})

test("Throws an error when createSuspender called witout an argument", t => {
  const err = t.throws(() => createSuspender())

  t.true(err instanceof TypeError)
  t.is(err.message, "First argument expected to be a function.")
})

test("Throws an error rejected by a promise", async t => {
  const expected = "This error is thrown by asynchronous implementation"
  const useSuspender = createSuspender(
    () => Promise.reject(new Error(expected))
  )

  const NoopComponent = () => {
    useSuspender()

    return null
  }

  const {getByRole} = render(
    createElement(ErrorBoundary, {}, createElement(NoopComponent)),

    {
      baseElement: t.context.baseElement
    }
  )

  await waitFor(() => getByRole("alert"))

  t.is(getByRole("alert").textContent, expected)
})

test("Throws an error thrown by suspender implementation", async t => {
  const expected = "This error is thrown by synchronous implementation"
  const useSuspender = createSuspender(() => {
    throw new Error(expected)
  })

  const NoopComponent = () => {
    useSuspender()

    return null
  }

  const {getByRole} = render(
    createElement(ErrorBoundary, {}, createElement(NoopComponent)),

    {
      baseElement: t.context.baseElement
    }
  )

  await waitFor(() => getByRole("alert"))

  t.is(getByRole("alert").textContent, expected)
})
