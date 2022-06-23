import assert from "node:assert"

import anyTest from "ava"

import {spy} from "sinon"
import {Component} from "react"
import type {TestFn} from "ava"
import type {ReactNode, FC} from "react"
import {renderHook, render, waitFor} from "@testing-library/react"

import {createSuspender} from "./useSuspender.js"

interface Context {
  baseElement: HTMLDivElement
}

const test = anyTest as TestFn<Context>

class ErrorBoundary extends Component<{children?: ReactNode}> {
  state: {error: Error | null} = {error: null}

  static getDerivedStateFromError(error: Error) {
    return {error}
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert">
          {this.state.error.message}
        </div>
      )
    }

    // eslint-disable-next-line react/prop-types
    return this.props.children
  }
}

// Suppress errors from React.
console.error = () => {}

test.beforeEach(t => {
  const element = document.createElement("div")

  t.context.baseElement = document.body.appendChild(element)
})

test.afterEach(t => {
  document.body.removeChild(t.context.baseElement)
})

test("Executes a function passed to createSuspender", t => {
  const fn = spy()

  const {useSuspender} = createSuspender(fn)

  renderHook(() => useSuspender())

  t.true(fn.called)
})

test("Calls a suspender with undefined as thisArg by default", t => {
  const fn = spy()

  const {useSuspender} = createSuspender(fn)

  renderHook(() => useSuspender())

  const {thisValue} = fn.firstCall

  t.is(thisValue, undefined)
})

test("Calls a suspender with thisArg taken by createSuspender", t => {
  const expected = new Map()

  const fn = spy(() => {})

  const {useSuspender} = createSuspender(fn, expected)

  renderHook(() => useSuspender())

  const {thisValue} = fn.firstCall

  t.is(thisValue, expected)
})

test("Returns a value from a suspender", async t => {
  const expected = "Rainbow Dash always dresses in style"

  const {useSuspender} = createSuspender(() => expected)

  const {result} = renderHook(() => useSuspender())

  await waitFor(() => assert(result.current))

  t.is(result.current, expected)
})

test("Returns a value resolved by Promise", async t => {
  const expected = "On Societ Moon, landscape see binoculars through YOU."

  const {useSuspender} = createSuspender(async () => expected)

  const {result} = renderHook(() => useSuspender())

  await waitFor(() => assert(result.current))

  t.is(result.current, expected)
})

test("Calls suspender with given arguments", t => {
  const expected = ["an argument", 42]

  const fn = spy()

  const {useSuspender} = createSuspender(fn)

  renderHook(() => useSuspender(...expected))

  const {args: actual} = fn.firstCall

  t.deepEqual(actual, expected)
})

test("Does not call a suspender again on re-render if args are the same", t => {
  const fn = spy()

  const {useSuspender} = createSuspender(fn)

  const {rerender} = renderHook(() => useSuspender())

  rerender()

  t.false(fn.calledTwice)
})

test("Calls a suspender when the new arguments taken", t => {
  const fn = spy()

  const {useSuspender} = createSuspender(fn)

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
  // @ts-expect-error
  t.throws(() => createSuspender(), {
    instanceOf: TypeError,
    message: "Suspender implementation must be a function."
  })
})

test("Throws an error rejected by a promise", async t => {
  const expected = "This error is thrown by asynchronous implementation"

  const {useSuspender} = createSuspender(async () => {
    throw new Error(expected)
  })

  const NoopComponent = () => {
    useSuspender()

    return null
  }

  const {getByRole} = render(
    <ErrorBoundary>
      <NoopComponent />
    </ErrorBoundary>,

    {
      baseElement: t.context.baseElement
    }
  )

  await waitFor(() => getByRole("alert"))

  t.is(getByRole("alert").textContent, expected)
})

test("Throws an error thrown by suspender implementation", async t => {
  const expected = "This error is thrown by synchronous implementation"

  const {useSuspender} = createSuspender(() => {
    throw new Error(expected)
  })

  const NoopComponent: FC = () => {
    useSuspender()

    return null
  }

  const {getByRole} = render(
    <ErrorBoundary>
      <NoopComponent />
    </ErrorBoundary>,

    {
      baseElement: t.context.baseElement
    }
  )

  await waitFor(() => getByRole("alert"))

  t.is(getByRole("alert").textContent, expected)
})
