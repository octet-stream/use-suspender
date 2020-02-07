# use-suspender

Execute asynchronous actions with React.Suspense

## Installation

You can take this package both from Yarn:

```sh
yarn add use-suspender
```

And NPM:

```sh
npm i use-suspender
```

## API

### `useSuspender(id, suspender[, args]) -> {any}`

Executes given suspender function then throws a Promise
to resolve its result with React.Suspense.

- **{any}** id – an unique identifier for useSuspender.
  This value must be consistent between render function calls
- **{Function}** suspender – a function you want to execute;
- **{Array<any>}** [args = []] – argument to apply to a suspender function call.

### `createUseSuspender() -> {Function}`

Creates a new useSuspender function with separated cache.

## Usage

Minimal example:

```js
import React, {Suspense} from "react"
import {render} from "react-dom"

import useSuspender from "use-suspender"

const getUser = () => (
  fetch("https://randomuser.me/api")
    .then(response => response.json())
    .then(([result]) => result)
)

function User() {
  const user = useSuspender(import.meta.url, getUser)

  return (
    <div>
      <div>
        Name: {user.name.first} {user.name.last}
      </div>

      <div>
        Email: {user.email}
      </div>
    </div>
  )
}

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <User />
  </Suspense>
)

const root = document.querySelector("#root")

render(<App />, root)
```

Note that useSuspender uses simple intermall cache to track which suspender function has a result.
If you want to create a separate cache, use `createUseSuspender` function:

```js
import {createUseSuspender} from "use-suspender"

const firstUseSuspender = createUseSuspender()
const secondUseSuspender = createuseSuspender()
```
