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

### `createSuspender(suspender: Funcion) -> {Function}`

Creates a new useSuspender for given function.
The returned function will be able to take any arguments.

## Usage

Minimal example:

```js
import React, {Suspense} from "react"
import {render} from "react-dom"

import createSuspender from "use-suspender"

const useGetUser = createSuspender(() => (
  fetch("https://randomuser.me/api")
    .then(response => response.json())
    .then(([result]) => result)
))

function User() {
  const user = useGetUser()

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

The useSuspender hook can take arguments to use in each suspender function call.
Imagine you have some API method, called `getUserByLogin`. It takes a user login
as the only argument. Here's an example of how you can apply this argument to the method:

```js
import createSuspender from "use-suspender"
import React from "react"

import {useParams} from "react-router-dom"

import {getUserByLogin} from "./api/user"

const useGetUserByLogin = createSuspender(getUserByLogin)

function User() {
  const {login} = useParams()

  // Will execute getUserByLogin method with user taken from react-router-dom
  const user = useGetUserByLogin(login)

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

export default User
```
