# use-suspender

Wraps asynchronous functions allowing to use them with React.Suspense

![ESLint](https://github.com/octet-stream/use-suspender/workflows/ESLint/badge.svg)
![CI](https://github.com/octet-stream/use-suspender/workflows/CI/badge.svg)
[![Code Coverage](https://codecov.io/github/octet-stream/use-suspender/coverage.svg?branch=master)](https://codecov.io/github/octet-stream/use-suspender?branch=master)

## Installation

You can take this package both from Yarn:

```sh
yarn add use-suspender
```

Or npm:

```sh
npm i use-suspender
```

Or pnpm

```sh
pnpm add use-suspender
```

## API

### `createSuspender(fn: SuspenderImplementation, ctx?: unknown): SuspenderHook`

Creates a new `useSuspender` hook for given function.

- fn – a function that will be used for each `useSuspender` call.
- ctx – thisArg that will be used for each `useSuspender` call.

### `interface SuspenderImplementation<TResult, TArgs extends unknown[]>`

Implements arbitary function. For TypeScript users this will help to narrow types for implementation's result and its arguments.

So that if you create a function that returns a `User` type by their ID, the `SuspenderHook` will expect the same exact arguments your function is taking and return the same type of the result:

```tsx
import {createSuspender} from "use-suspender"
import type {FC} from "react"

interface User {
  id: string
  fullName: string
  role: string
  age: number
}

async function getUserFromSomewhereById(userId: string): Promise<User> {
  const response = await fetch(`https://example.com/api/v1/json/users/${userId}`)

  return response.json()
}

// This will create a function that implements SuspenderHook<TResult, TArgs> interface.
const {useSuspender: useGetUser} = createSuspender(getUserFromSomewhereById)
// => SuspenderHook<User, [userId: string]>

const Profile: FC = () => {
  // This function will expect the same arguments with the same types as getUserFromSomewhereById
  // In this example, if you call it with just a number - you will get an error from TypeScript.
  const user = useGetUser("42")

  return (
    <div>
      {/* It will also return the same type as getUserFromSomewhereById, so you'll have autocompletions */}
      Welcome, {user.fullName}!
    </div>
  )
}

export default Profile
```

### `interface SuspenderHook<TResult, TArgs extends unknown[]>`

Implements suspender hook, returned by `createSuspender` function.

#### `hook.useSuspender(...args: TArgs): TResult`

Executes asynchronous action with given arguments.
This function will throw a Promise to notify `React.Suspense`
and resolve a result from suspender.

This function should be called inside of your React function component.

- args – arguments to call the suspender with

#### `hook.useSuspender(...args: TArgs): TResult`

A self-reference for `useSuspender` function.

#### `hook.callEarly(...args: TArgs): void`

Calls useSuspense early without throwing a Promise needed to notify `React.Suspense`.

- args – arguments to call the suspender with

## Usage

Minimal example:

```js
import {createSuspender} from "use-suspender"
import {createRoot} from "react-dom/client"
import {Suspense} from "react"

const {useSuspender: useGetUser} = createSuspender(() => (
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

createRoot(root).render(<App />)
```

The `useSuspender` hook can take arguments to use in each suspender function call.
Imagine you have some API method, called `getUserByLogin`. It takes a user login
as the only argument. Here's an example of how you can apply this argument to the method:

```js
import {createSuspender} from "use-suspender"
import {useParams} from "react-router-dom"

import {getUserByLogin} from "./api/user"

const {useSuspender: useGetUserByLogin} = createSuspender(getUserByLogin)

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
