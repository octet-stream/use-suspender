const pq = require("proxyquire")
const test = require("ava")

const {spy} = require("sinon")

const createSuspender = pq("../use-suspender", {
  react: {
    useEffect() { /* this hook is not necessary outside of react */ }
  }
})

function getPromise(fn) {
  try {
    fn()
  } catch (err) {
    return err
  }
}

test("Throws a promise on the first useSuspender call", t => {
  t.plan(1)

  const useSuspender = createSuspender(() => Promise.resolve())

  t.true(getPromise(useSuspender) instanceof Promise)
})

test("Calls a suspender when useSuspender is called", async t => {
  const suspender = spy(() => Promise.resolve())

  const useSuspender = createSuspender(suspender)

  await getPromise(useSuspender)

  t.true(suspender.called)
})

test("Throws a promise on second call if promise is not resolved", t => {
  const useSuspender = createSuspender(() => Promise.resolve())

  const p1 = getPromise(useSuspender)

  t.true(p1 instanceof Promise)

  const p2 = getPromise(useSuspender)

  t.true(p2 instanceof Promise)

  t.is(p1, p2)
})

test("Throws an error taken from ASYNC suspender", async t => {
  const useSuspender = createSuspender(
    () => Promise.reject(new Error("Error!"))
  )

  await getPromise(useSuspender)

  const err = t.throws(useSuspender)

  t.is(err.message, "Error!")
})

test("Throws an error taken from SYNC suspender", async t => {
  const useSuspender = createSuspender(() => {
    throw new Error("Error!")
  })

  await getPromise(useSuspender)

  const err = t.throws(useSuspender)

  t.is(err.message, "Error!")
})

test("Returns a result from ASYNC suspender on a second call", async t => {
  const expected = 451

  const useSuspender = createSuspender(() => Promise.resolve(expected))

  await getPromise(useSuspender)

  const actual = useSuspender()

  t.is(actual, expected)
})

test("Returns a result from SYNC suspender on a second call", async t => {
  const expected = 451

  const useSuspender = createSuspender(() => expected)

  await getPromise(useSuspender)

  const actual = useSuspender()

  t.is(actual, expected)
})

test("Calls suspender function once per two useSuspender call", async t => {
  const suspender = spy()

  const useSuspender = createSuspender(suspender)

  await getPromise(useSuspender)
  useSuspender()

  t.true(suspender.calledOnce)
})

test("Calls suspender function again on a third call", async t => {
  const suspender = spy()

  const useSuspender = createSuspender(suspender)

  await getPromise(useSuspender)
  useSuspender()

  await getPromise(useSuspender)

  t.true(suspender.calledTwice)
})

test("Calls a suspender with given arguments", async t => {
  const expected = ["Rainbow Dash always dresses in style"]

  const suspender = spy()

  const useSuspender = createSuspender(suspender)

  await getPromise(() => useSuspender(...expected))

  const {args: actual} = suspender.firstCall

  t.deepEqual(actual, expected)
})

test("Calls a suspender with different arguments", async t => {
  const expectedFirst = ["first"]
  const expectedSecond = ["second"]

  const suspender = spy()

  const useSuspender = createSuspender(suspender)

  // Note that useSuspender need to be called twice
  // to reset its internal cache, so you can use the suspender with
  // different arguments
  await getPromise(() => useSuspender(...expectedFirst))
  useSuspender(...expectedFirst)

  await getPromise(() => useSuspender(...expectedSecond))
  useSuspender(...expectedSecond)

  const {args: actualFirst} = suspender.firstCall
  const {args: actualSecond} = suspender.lastCall

  t.deepEqual(actualFirst, expectedFirst)
  t.deepEqual(actualSecond, expectedSecond)
})

test("Call useSuspender when init is called", t => {
  const suspender = spy()

  const {init} = createSuspender(suspender)

  init()

  t.true(suspender.called)
})

test("The init function applies arguments to useSuspender call", t => {
  const expected = ["Some string"]

  const suspender = spy()

  const {init} = createSuspender(suspender)

  init(...expected)

  const {args: actual} = suspender.firstCall

  t.deepEqual(actual, expected)
})

test("Throws an error when given suspender is not a function", t => {
  const err = t.throws(() => createSuspender())

  t.true(err instanceof TypeError)
  t.is(err.message, "Suspender expected to be a function.")
})
