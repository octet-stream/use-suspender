const test = require("ava")

const createSuspender = require("../use-suspender")

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

test("Throws a promise on second call if promise is not resolved" t => {
  const useSuspender = createSuspender(() => Promise.resolve())

  const p1 = getPromise(useSuspender)

  t.true(p1 instanceof Promise)

  const p2 = getPromise(useSuspender)

  t.true(p2 instanceof Promise)

  t.is(p1, p2)
})

test("Throws an error on second call if suspender throws error", async t => {
  const useSuspender = createSuspender(
    () => Promise.reject(new Error("Error!"))
  )

  await getPromise(useSuspender)

  t.throws(useSuspender)
})

test("Returns a result on second call when promise is resolved", async t => {
  const expected = 451

  const useSuspender = createSuspender(() => Promise.resolve(expected))

  await getPromise(useSuspender)

  const actual = useSuspender()

  t.is(actual, expected)
})
