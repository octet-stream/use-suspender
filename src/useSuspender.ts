/* eslint-disable @typescript-eslint/no-throw-literal */
/* eslint-disable no-shadow */

import eq from "fast-deep-equal/es6/react.js"

type SuspenderImplementation<
  TResult extends unknown,
  TArgs extends readonly unknown[]
> = (...args: TArgs) => TResult

// Note: const emum will inline State values as it used. It will be fine while it's private. If this type is ever going to be public - remove the `const` keyword as it might get hazardous.
// See: https://youtu.be/jjMbPt_H3RQ
const enum State {
  PENDING,
  RESOLVED,
  REJECTED
}

interface Operation<TResult extends unknown, TArgs extends readonly unknown[]> {
  state: State
  error: unknown
  result: TResult | null
  suspender: Promise<void>
  args: TArgs
}

interface SuspenderPublicCache {
  /**
   * Returns cache size
   */
  readonly size: number

  /**
   * Clears cache
   */
  clear(): void
}

export interface CreateSuspenderResult<
  TResult extends unknown,
  TArgs extends readonly unknown[]
> {
  /**
   * Calls a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   * @param args A list of arguments to execute suspender with
   *
   * @throws {Promise<void>} If the Promise haven't been fulfilled yet
   *
   * @throws {Error} If suspender's Promise has been rejected with an error
   *
   * @api public
   */
  (...args: TArgs): Awaited<TResult>

  /**
   * Calls a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   * @param args A list of arguments to execute suspender with
   *
   * @throws {Promise<void>} If the Promise haven't been fulfilled yet
   *
   * @throws {Error} If suspender's Promise has been rejected with an error
   *
   * @api public
   */
  useSuspender(...args: TArgs): Awaited<TResult>

  /**
   * Calls useSuspense early
   *
   * @param args A list of arguments to execute suspender with
   *
   * @api public
   */
  callEarly(...args: TArgs): void

  /**
   * Returns public cache methods for manual cache control.
   *
   * This object expose only two properties: `size` to check on the cache's size, and `clear` to clear the whole data cache.
   */
  cache: SuspenderPublicCache
}

/**
 * Calls a function and returns a Promise that resolves with its result
 *
 * @api private
 */
const getPromise = async <
  TResult extends unknown,
  TArgs extends readonly unknown[]
>(
  implementation: SuspenderImplementation<TResult, TArgs>,
  args: TArgs,
  ctx?: unknown
): Promise<TResult> => implementation.call(ctx, ...args)

/**
 * Creates a new useSuspender hook for given function.
 *
 * @param implementation A function to create a useSuspender hook with
 * @param ctx thisArg value
 *
 * @api public
 *
 * @example
 *
 * ```jsx
 * import {createSuspender} from "use-suspender"
 * import type {FC} from "react"
 *
 * const {useSuspender: useGetUser} = createSuspender(async (userId: string) => {
 *   const response = await fetch(`https://example.com/api/v1/json/users/${userId}`)
 *
 *   return response.json()
 * })
 *
 * const Profile: FC = () => {
 *   const user = useGetUser("42")
 *
 *   return <div>Welcome, {user.name}!</div>
 * }
 * ```
 */
export function createSuspender<
  TResult extends unknown,
  TArgs extends readonly unknown[]
>(
  implementation: SuspenderImplementation<TResult, TArgs>,
  ctx?: unknown
): CreateSuspenderResult<TResult, TArgs> {
  if (typeof implementation !== "function") {
    throw new TypeError("Suspender implementation must be a function.")
  }

  const cache = new Set<Operation<TResult, TArgs>>()

  /**
   * @api private
   */
  function get(args: TArgs): Operation<TResult, TArgs> | undefined {
    for (const operation of cache) {
      if (eq(args, operation.args)) {
        return operation
      }
    }

    return undefined
  }

  /**
   * Calls a suspender function and sets its Promise on the operation
   *
   * @api private
   */
  function createOperation(args: TArgs): Promise<void> {
    const operation: Operation<TResult, TArgs> = {
      args,
      error: null,
      result: null,
      state: State.PENDING,
      suspender: getPromise(implementation, args, ctx)
        // The return statement is useless for this `.then()` callback
        // eslint-disable-next-line promise/always-return
        .then(result => {
          operation.result = result
          operation.state = State.RESOLVED
        })
        .catch(error => {
          operation.error = error
          operation.state = State.REJECTED
        })
    }

    // Add operation to cache
    cache.add(operation)

    return operation.suspender
  }

  const useSuspender: CreateSuspenderResult<TResult, TArgs> = (...args) => {
    // Find an operation that matches given arguments
    const operation = get(args)

    // If the operation exists, check out its state
    if (operation) {
      // If the operation is still pending, re-throw the Promise
      if (operation.state === State.PENDING) {
        throw operation.suspender
      }

      // If the operation is failed, throw its error
      if (operation.state === State.REJECTED) {
        throw operation.error
      }

      // If operation is resolved, return its result, delete operation from cache and stop.
      if (operation.state === State.RESOLVED) {
        // Borrow result, so we can remove operation from cache
        const {result} = operation

        // Remove operation from cache
        cache.delete(operation)

        // We don't care about the result - it could be anything, so just cast to `Awaited<TResult>` to satisfy tsc
        return result as Awaited<TResult>
      }
    }

    // If the operation is not exists, create a new one
    throw createOperation(args)
  }

  useSuspender.callEarly = (...args: TArgs): void => {
    createOperation(args)
  }

  useSuspender.cache = {
    get size() {
      return cache.size
    },

    clear() {
      return cache.clear()
    }
  }

  useSuspender.useSuspender = useSuspender

  return useSuspender
}