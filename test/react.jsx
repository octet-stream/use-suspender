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

  const useSuspender1 = createSuspender(arg => arg)
  const useSuspender2 = createSuspender(arg => arg)

  function First() {
    const result = useSuspender1(firstExpected)

    return <div>{result}</div>
  }

  function Second() {
    const result = useSuspender2(secondExpected)

    return <div>{result}</div>
  }

  const Main = () => {
    const [count, setCount] = React.useState(0)
    React.useEffect(() => {
      setTimeout(() => {
        setCount(1)
      }, 10)
    }, [])
    return (
      <Suspense fallback="Loading...">
        <First />

        <Second />

        <div>{`count=${count}`}</div>
      </Suspense>
    )
  }

  render(<Main />)

  const [firstActual, secondActual] = await Promise.all([
    screen.findByText(firstExpected),

    screen.findByText(secondExpected),

    screen.findByText("count=1") // wait for re-render
  ])

  t.is(firstActual.innerHTML, firstExpected)
  t.is(secondActual.innerHTML, secondExpected)
})
