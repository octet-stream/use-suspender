import eq from "fast-deep-equal/es6/react.js"

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

interface SuspenderImplementation {
  (...args: any[]): any
}

enum State {
  PENDING,
  RESOLVED,
  REJECTED
}

interface Operation<TResult, TArgs extends unknown[]> {
  state: State
  error: Error | null
  result: TResult | null
  suspender: Promise<void>
  args: TArgs
}

interface SuspenderPublicCache {
  /**
   * Returns cache size
   */
  size: number

  /**
   * Clears cache
   */
  clear(): void
}

export interface SuspenderHook<TResult, TArgs extends unknown[]> {
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
  useSuspender(...args: TArgs): TResult

  /**
   * Calls useSuspense early
   *
   * @param args A list of arguments to execute suspender with
   *
   * @api public
   */
  callEarly(...args: TArgs): void

  /**
   * Returns public cache methods
   */
  cache: SuspenderPublicCache
}

/**
 * Calls a function and returns a Promise that resolves with its result
 *
 * @api private
 */
function getPromise<T extends SuspenderImplementation>(
  implementation: T,
  args: Parameters<T>,
  ctx?: unknown
): Promise<ReturnType<T>> {
  try {
    const result = implementation.apply(ctx, args)

    return result instanceof Promise ? result : Promise.resolve(result)
  } catch (error) {
    return Promise.reject(error)
  }
}

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
 * const {useSuspender} = createSuspender(async (name: string) => {
 *   const response = await fetch(`https://example.com/api/v1/json/users/${name}`)
 *
 *   return response.json()
 * })
 *
 * const Profile: FC = () => {
 *   const user = useSuspender("John Doe")
 *
 *   return <div>Welcome, {user.name}!</div>
 * }
 * ```
 */
export function createSuspender<T extends SuspenderImplementation>(
  implementation: T,
  ctx?: unknown
): SuspenderHook<UnwrapPromise<ReturnType<T>>, Parameters<T>> {
  if (typeof implementation !== "function") {
    throw new TypeError("Suspender implementation must be a function.")
  }

  type TResult = ReturnType<T>
  type TArgs = Parameters<T>

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
  function createOperation(args: TArgs) {
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

  function useSuspender(...args: TArgs): UnwrapPromise<TResult> {
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

      // If the operation is resolved, return its result, delete operation from cache and stop.
      if (operation.state === State.RESOLVED) {
        const {result} = operation

        // Remove the operation from cache
        cache.delete(operation)

        return result as UnwrapPromise<TResult>
      }
    }

    // If the operation is not exists, create a new one
    throw createOperation(args)
  }

  function callEarly(...args: TArgs): void {
    createOperation(args)
  }

  const publicCache: SuspenderPublicCache = {
    get size() {
      return cache.size
    },

    clear() {
      return cache.clear()
    }
  }

  return {useSuspender, callEarly, cache: publicCache}
}
