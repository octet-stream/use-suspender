import assert from "node:assert"

import anyTest from "ava"

import {Component} from "react"

import {spy} from "sinon"
import type {TestFn} from "ava"
import type {ReactNode, FC} from "react"
import {waitFor} from "@testing-library/react"

import type {WithRenderContext} from "./__macro__/withRender.js"
import {withRender} from "./__macro__/withRender.js"

import {createSuspender} from "./useSuspender.js"

const test = anyTest as TestFn<WithRenderContext>

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps> {
  state: ErrorBoundaryState = {error: null}

  static getDerivedStateFromError(error: Error): ErrorBoundaryState | null {
    return {error}
  }

  render() {
    const {error} = this.state
    const {children} = this.props

    if (error) {
      return (
        <div role="alert">
          {error.message}
        </div>
      )
    }

    return children
  }
}

// Suppress error logs from React in before and after hooks.
const originalConsoleError = console.error

test.before(() => {
  console.error = () => {}
})

test.after.always(() => {
  console.error = originalConsoleError
})

test(
  "Executes a function passed to createSuspender",

  withRender,

  async t => {
    const {renderHook} = t.context

    const fn = spy()

    const useSuspender = createSuspender(fn)

    renderHook(() => useSuspender())

    t.true(fn.called)
  }
)

test(
  "Calls a suspender with undefined as thisArg by default",

  withRender,

  async t => {
    const {renderHook} = t.context

    const fn = spy()

    const useSuspender = createSuspender(fn)

    renderHook(() => useSuspender())

    const {thisValue} = fn.firstCall

    t.is(thisValue, undefined)
  }
)

test(
  "Exposes useSuspender member from returned value",

  withRender,

  async t => {
    const {renderHook} = t.context

    const fn = spy()

    const {useSuspender} = createSuspender(fn)

    t.is(typeof useSuspender, "function")

    renderHook(() => useSuspender())

    const {thisValue} = fn.firstCall

    t.is(thisValue, undefined)
  }
)

test(
  "Calls a suspender with thisArg taken by createSuspender",

  withRender,

  async t => {
    const {renderHook} = t.context

    const expected = new Map()

    const fn = spy(() => {})

    const useSuspender = createSuspender(fn, expected)

    renderHook(() => useSuspender())

    const {thisValue} = fn.firstCall

    t.is(thisValue, expected)
  }
)

test("Returns a value from a suspender", withRender, async t => {
  const {renderHook} = t.context

  const expected = "Rainbow Dash always dresses in style"

  const useSuspender = createSuspender(() => expected)

  const {result} = renderHook(() => useSuspender())

  await waitFor(() => assert(result.current))

  t.is(result.current, expected)
})

test("Returns a value resolved by Promise", withRender, async t => {
  const {renderHook} = t.context

  const expected = "On Societ Moon, landscape see binoculars through YOU."

  const useSuspender = createSuspender(async () => expected)

  const {result} = renderHook(() => useSuspender())

  await waitFor(() => assert(result.current))

  t.is(result.current, expected)
})

test("Calls suspender with given arguments", withRender, async t => {
  const {renderHook} = t.context

  const expected = ["an argument", 42] as const

  const fn = spy((...args: typeof expected) => void args)

  const useSuspender = createSuspender(fn)

  renderHook(() => useSuspender(...expected))

  const {args: actual} = fn.firstCall

  t.deepEqual(actual, expected)
})

test(
  "Does not call a suspender again on re-render if args are the same",

  withRender,

  async t => {
    const {renderHook} = t.context

    const fn = spy()

    const useSuspender = createSuspender(fn)

    const {rerender} = renderHook(() => useSuspender())

    rerender()

    t.false(fn.calledTwice)
  }
)

test("Calls a suspender when the new arguments taken", withRender, async t => {
  const {renderHook} = t.context

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

test("Calls a suspender when .callEarly() called", async t => {
  const fn = spy()

  const {callEarly} = createSuspender(fn)

  callEarly()

  t.true(fn.called)
})

test("Throws an error when createSuspender called witout an argument", t => {
  // @ts-expect-error
  t.throws(() => createSuspender(), {
    instanceOf: TypeError,
    message: "Suspender implementation must be a function."
  })
})

test("Throws an error rejected by a promise", withRender, async t => {
  const {render} = t.context

  const expected = "This error is thrown by asynchronous implementation"

  const useSuspender = createSuspender(async () => {
    throw new Error(expected)
  })

  const NoopComponent: FC = () => {
    useSuspender()

    return null
  }

  const {getByRole} = render(
    <ErrorBoundary>
      <NoopComponent />
    </ErrorBoundary>
  )

  const actual = await waitFor(() => getByRole("alert"))

  t.is(actual.textContent, expected)
})

test(
  "Throws an error thrown by suspender implementation",

  withRender,

  async t => {
    const {render} = t.context

    const expected = "This error is thrown by synchronous implementation"

    const useSuspender = createSuspender(() => {
      throw new Error(expected)
    })

    const NoopComponent: FC = () => {
      useSuspender()

      return null
    }

    const {getByRole} = render(
      <ErrorBoundary>
        <NoopComponent />
      </ErrorBoundary>
    )

    const actual = await waitFor(() => getByRole("alert"))

    t.is(actual.textContent, expected)
  }
)
