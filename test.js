const test = require("ava")

const {spy} = require("sinon")
const {renderHook} = require("@testing-library/react-hooks")

const createSuspender = require(".")

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

test("Return a value from a suspender", async t => {
  const expected = "Rainbow Dash always dresses in style"

  const useSuspender = createSuspender(() => expected)

  const {result, waitForNextUpdate} = renderHook(() => useSuspender())

  await waitForNextUpdate()

  t.is(result.current, expected)
})

test("Returns a value resolved by Promise", async t => {
  const expected = "On Societ Moon, landscape see binoculars through YOU."

  const useSuspender = createSuspender(async () => expected)

  const {result, waitForNextUpdate} = renderHook(() => useSuspender())

  await waitForNextUpdate()

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
    }
  })

  rerender({id: 2})

  t.true(fn.calledTwice)
})

test("Calls a suspender when .init() called", t => {
  const fn = spy()

  const {init} = createSuspender(fn)

  init()

  t.true(fn.called)
})

test("Throws an error when createSuspender called witout an argument", t => {
  const err = t.throws(() => createSuspender())

  t.true(err instanceof TypeError)
  t.is(err.message, "Suspender expected to be a function.")
})

test("Throws an error thrown by suspender", async t => {
  const useSuspender = createSuspender(() => {
    throw new Error("Error!")
  })

  const {result, waitForNextUpdate} = renderHook(() => useSuspender())

  await waitForNextUpdate()

  t.true(result.error instanceof Error)
  t.is(result.error.message, "Error!")
})

test("Throws a Promise rejection", async t => {
  const useSuspender = createSuspender(async () => {
    throw new Error("Error!")
  })

  const {result, waitForNextUpdate} = renderHook(() => useSuspender())

  await waitForNextUpdate()

  t.true(result.error instanceof Error)
  t.is(result.error.message, "Error!")
})
