const React = require("react")
const test = require("ava")

const {render, screen} = require("@testing-library/react")

const ErrorBoundary = require("./__helper__/ErrorBoundary")
const createSuspender = require("../use-suspender")

const {Suspense} = React

test("Renders a component with suspender's result", async t => {
  const expected = "I beat Twilight Sparkle and all "
    + "I got was this lousy t-shirt."

  const useSuspender = createSuspender(() => Promise.resolve(expected))

  function SuspendedComponent() {
    const result = useSuspender()

    return <div>{result}</div>
  }

  const Main = () => (
    <Suspense fallback="Loading...">
      <SuspendedComponent />
    </Suspense>
  )

  render(<Main />)

  const node = await screen.findByText(expected)

  t.truthy(node)
  t.is(node.innerHTML, expected)
})

test("Renders an error thrown by suspender", async t => {
  const useSuspender = createSuspender(
    () => Promise.reject(new Error("Error!"))
  )

  function SuspendedComponent() {
    const result = useSuspender()

    return <div>{result}</div>
  }

  const Main = () => (
    <Suspense fallback="Loading...">
      <ErrorBoundary>
        <SuspendedComponent />
      </ErrorBoundary>
    </Suspense>
  )

  render(<Main />)

  const node = await screen.findByText("Error!")

  t.is(node.innerHTML, "Error!")
})

test("Calls useSuspender with different arguments", async t => {
  const firstExpected = "first"
  const secondExpected = "second"

  const useSuspender = createSuspender(arg => arg)

  function First() {
    const result = useSuspender(firstExpected)

    return <div>{result}</div>
  }

  function Second() {
    const result = useSuspender(secondExpected)

    return <div>{result}</div>
  }

  const Main = () => (
    <Suspense fallback="Loading...">
      <First />

      <Second />
    </Suspense>
  )

  render(<Main />)

  const [firstActual, secondActual] = await Promise.all([
    screen.findByText(firstExpected),

    screen.findByText(secondExpected)
  ])

  t.is(firstActual.innerHTML, firstExpected)
  t.is(secondActual.innerHTML, secondExpected)
})
