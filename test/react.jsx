const React = require("react")
const test = require("ava")

const {render, screen} = require("@testing-library/react")

const createSuspender = require("../use-suspender")

const {Suspense} = React

test("Renders a component with suspender's result", async t => {
  const expected = "I beat Twilight Sparkle and all "
    + "I got was this lousy t-shirt."

  const useSuspender = createSuspender(() => Promise.resolve(expected))

  function Hook() {
    const result = useSuspender()

    return <div>{result}</div>
  }

  const Main = () => (
    <Suspense fallback="Loading...">
      <Hook />
    </Suspense>
  )

  render(<Main />)

  const node = await screen.findByText(expected)

  t.truthy(node)
  t.is(node.innerHTML, expected)
})
