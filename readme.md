# use-suspender

Wraps asynchronous function allowing to use it with [`React.Suspense`](https://react.dev/reference/react/Suspense).

![ESLint](https://github.com/octet-stream/use-suspender/workflows/ESLint/badge.svg)
![CI](https://github.com/octet-stream/use-suspender/workflows/CI/badge.svg)
[![Code Coverage](https://codecov.io/github/octet-stream/use-suspender/coverage.svg?branch=master)](https://codecov.io/github/octet-stream/use-suspender?branch=master)

## Installation

Using pnpm:

```sh
pnpm add use-suspender
```

or yarn:

```sh
yarn add use-suspender
```

Or npm:

```sh
npm i use-suspender
```

## API

### `createSuspender(fn[, ctx])`

Creates a new `useSuspender` hook for given function.

Takes following argmuents:

| Name           | Type                                                                         | Required | Default     | Description                                         |
|----------------|:----------------------------------------------------------------------------:|:--------:|:-----------:|-----------------------------------------------------|
| implementation | [`SuspenderImplementation`](#interface-suspenderimplementationtresult-targs) | Yes      | –           | A function to create `useSuspender` hook for        |
| ctx            | `unknown`                                                                    | No       | `undefined` | `thisArg` to use with each `useSuspender` hook call |

Returns a function implementing [`SuspenderHook<TResult, TArgs>`](#interface-usesuspenderhooktresult-targs) interface.

### `interface SuspenderImplementation<TResult, TArgs>`

Implements arbitary function. For TypeScript users this will help to narrow types for implementation's result and its arguments.

Takes following type parameters:

| Name    | Extends              | Required | Default  | Description                                       |
|---------|:--------------------:|:--------:|:--------:|---------------------------------------------------|
| TResult | –                    | Yes      | –        | The result returned by *suspender implementation* |
| TArgs   | `readonly unknown[]` | Yes      | –        | A list of implementation's arguments              |

For example, if you create a function that returns a `User` type, the `useSuspender` hook will expect the same exact arguments your function is taking and return the same type of the result:

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

// This will create a function implementing UseSuspenderHook<TResult, TArgs> interface.
const useGetUser = createSuspender(getUserFromSomewhereById)
// => UseSuspenderHook<User, [userId: string]>

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

### `interface UseSuspenderHook<TResult, TArgs>`

Implements suspender hook, returned by `createSuspender` function.

This interface is a *function* with additional properties.

When called, it executes *suspender implementation* with given arguments.
This function will throw a Promise to notify `React.Suspense`
and resolve a result from suspender.

When called with the same argments, it will find *pending* operation by comparing cached arguments using [`fast-deep-equal`](https://npmjs.com/package/fast-deep-equal) and re-throw a promise to notify `React.Suspense` if matched any.

Takes following type parameters:

| Name    | Extends              | Required | Default  | Description                                       |
|---------|:--------------------:|:--------:|:--------:|---------------------------------------------------|
| TResult | –                    | Yes      | –        | The result returned by *suspender implementation* |
| TArgs   | `readonly unknown[]` | Yes      | –        | A list of implementation's arguments              |

#### `UseSuspenderHook.useSuspender(...args: TArgs): TResult`

Executes *suspender implementation* with given arguments.
This function will throw a Promise to notify `React.Suspense`
and resolve a result from suspender.

When called with the same argments, it will find *pending* operation by comparing cached arguments using [`fast-deep-equal`](https://npmjs.com/package/fast-deep-equal) and re-throw a promise to notify `React.Suspense` if matched any.

This function should be called inside of your React function component.

- args – arguments to call the suspender with

#### `UseSuspenderHook.callEarly(...args: TArgs): void`

Calls useSuspense early without throwing a Promise needed to notify `React.Suspense`.

- args – arguments to call the suspender with

## Usage

Minimal example:

```tsx
import {createSuspender} from "use-suspender"
import {createRoot} from "react-dom/client"
import {Suspense} from "react"

type Nationalities =
  | "br"
  | "ca"
  | "ch"
  | "de"
  | "dk"
  | "es"
  | "fi"
  | "fr"
  | "gb"
  | "ie"
  | "in"
  | "ir"
  | "mx"
  | "nl"
  | "no"
  | "nz"
  | "rs"
  | "tr"
  | "ua"
  | "us"

const useGetRandomUser = createSuspender((nationality: Nationalities) => (
  fetch(`https://randomuser.me/api?results=1&nat=${nationality}`)
    .then(response => response.json())
    .then(([result]) => result)
))

function User() {
  const user = useGetRandomUser("ua")

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

// Alternative way to get useSuspender hook
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
