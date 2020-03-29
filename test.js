const test = require("ava")

const {spy} = require("sinon")
const {renderHook} = require("@testing-library/react-hooks")

const createSuspender = require("./use-suspender")

test("Executes a function passed to createSuspender", t => {
  const fn = spy()
  const useSuspender = createSuspender(fn)

  renderHook(() => useSuspender())

  t.true(fn.called)
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

test("Does not call a suspender again on re-render", t => {
  const fn = spy()
  const useSuspender = createSuspender(fn)

  const {rerender} = renderHook(() => useSuspender())

  rerender()

  t.false(fn.calledTwice)
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

// test("", t => {})
