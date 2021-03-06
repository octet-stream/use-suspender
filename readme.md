# use-suspender

Wraps asynchronous functions allowing to use them with React.Suspense

![ESLint](https://github.com/octet-stream/use-suspender/workflows/ESLint/badge.svg)
![CI](https://github.com/octet-stream/use-suspender/workflows/CI/badge.svg)
[![Code Coverage](https://codecov.io/github/octet-stream/use-suspender/coverage.svg?branch=master)](https://codecov.io/github/octet-stream/use-suspender?branch=master)
[![dependencies Status](https://david-dm.org/octet-stream/use-suspender/status.svg)](https://david-dm.org/octet-stream/use-suspender)
[![devDependencies Status](https://david-dm.org/octet-stream/use-suspender/dev-status.svg)](https://david-dm.org/octet-stream/use-suspender?type=dev)

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

### `createSuspender(suspender[, ctx]) -> {Function}`

Creates a new useSuspender for given function.

- **{Function}** fn – a function that will be used for each useSuspender call.
- **{any}** ctx – thisArg that will be used for each useSuspender call.

### `useSuspender([...args]) -> {any}`

Executes asynchronous action with given arguments.
This function will throw a Promise to notify `React.Suspense`
and resolve a result from suspender.

- **{any[]}** args – arguments to call the suspender with

### `useSuspender.callEarly([...args]) -> {void}`

Calls usesSuspense early a silence Promise first throwing needed to notify `React.Suspense`

- **{any[]}** args – arguments to call the suspender with

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

The `useSuspender` hook can take arguments to use in each suspender function call.
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
