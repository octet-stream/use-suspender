/* eslint-disable no-redeclare */ // Disabled to allow function overload, TypeScript will handle this rule instead
/* eslint-disable @typescript-eslint/no-throw-literal */ // Disable to supress errors on `throw new Promise`
/* eslint-disable no-shadow */ // Disabled because State exists only on type-level and we don't rely on the thing we override

import isEqual from "react-fast-compare"

// Note: const emum will inline State values as it used. It will be fine while it's private. If this type is ever going to be public - remove the `const` keyword as it might get hazardous.
// See: https://youtu.be/jjMbPt_H3RQ
/**
 * @api private
 */
const enum State {
  PENDING,
  RESOLVED,
  REJECTED
}

/**
 * @api private
 */
interface BaseOperation<
  TState extends State,
  TArgs extends readonly unknown[]
> {
  state: TState
  suspender: Promise<void>
  args: TArgs
}

/**
 * @api private
 */
type PendingOperation<
  TArgs extends readonly unknown[]
> = BaseOperation<State.PENDING, TArgs>

/**
 * @api private
 */
type RejectedOperation<
  TArgs extends readonly unknown[]
> = BaseOperation<State.REJECTED, TArgs> & {error: Error}

/**
 * @api private
 */
type ResolvedOperation<
  TResult,
  TArgs extends readonly unknown[]
> = BaseOperation<State.RESOLVED, TArgs> & {result: TResult}

/**
 * @api private
 */
type Operation<TResult, TArgs extends readonly unknown[]> =
  | PendingOperation<TArgs>
  | RejectedOperation<TArgs>
  | ResolvedOperation<TResult, TArgs>

/**
 * @api private
 */
interface UpdateOperationInputBase<TState extends State> {
  state: TState
}

/**
 * @api private
 */
type UpdateOperationRejectedInput =
  & UpdateOperationInputBase<State.REJECTED>
  & {error: Error}

/**
 * @api private
 */
type UpdateOperationResolvedInput<TResult> =
  & UpdateOperationInputBase<State.RESOLVED>
  & {result: TResult}

/**
 * @api private
 */
type UpdateOperationInput<TResult> =
  | UpdateOperationRejectedInput
  | UpdateOperationResolvedInput<TResult>

/**
 * Updates `uperation` taken as the first argument with the new fields from `input`
 *
 * @api private
 */
function update<TArgs extends readonly unknown[]>(
  operation: PendingOperation<TArgs>,
  input: UpdateOperationRejectedInput
): void
function update<
  TResult,
  TArgs extends readonly unknown[]
>(
  operation: PendingOperation<TArgs>,
  input: UpdateOperationResolvedInput<TResult>
): void
function update<
  TResult, TArgs extends readonly unknown[]
>(
  operation: PendingOperation<TArgs>,
  input: UpdateOperationInput<TResult>
): void {
  Object.assign(operation, input)
}

export type UseSuspenderImplementation<
  TResult,
  TArgs extends readonly unknown[]
> = (...args: TArgs) => TResult

export interface UseSuspenderPublicCache {
  /**
   * Returns cache size
   */
  readonly size: number

  /**
   * Clears cache
   */
  clear(): void
}

export interface UseSuspenderHook<
  TResult,
  TArgs extends readonly unknown[]
> {
  /**
   * Calls a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   * @param args A list of arguments to execute suspender with
   *
   * @throws `Promise<void>` If the Promise haven't been fulfilled yet
   *
   * @throws `Error` If suspender's Promise has been rejected with an error
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
   * @throws `Promise<void>` If the Promise haven't been fulfilled yet
   *
   * @throws `Error` If suspender's Promise has been rejected with an error
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
  cache: UseSuspenderPublicCache
}

/**
 * Calls a function and returns a Promise that resolves with its result
 *
 * @api private
 */
const getPromise = async <
  TResult,
  TArgs extends readonly unknown[]
>(
  implementation: UseSuspenderImplementation<TResult, TArgs>,
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
 * const useGetUser = createSuspender(async (userId: string) => {
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
  TResult,
  TArgs extends readonly unknown[]
>(
  implementation: UseSuspenderImplementation<TResult, TArgs>,
  ctx?: unknown
): UseSuspenderHook<TResult, TArgs> {
  if (typeof implementation !== "function") {
    throw new TypeError("Suspender implementation must be a function.")
  }

  const cache = new Set<Operation<TResult, TArgs>>()

  /**
   * @api private
   */
  function get(args: TArgs): Operation<TResult, TArgs> | undefined {
    for (const operation of cache) {
      if (isEqual(args, operation.args)) {
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
    const operation: PendingOperation<TArgs> = {
      args,
      state: State.PENDING,
      suspender: getPromise(implementation, args, ctx)
        .then(result => update(operation, {state: State.RESOLVED, result}))
        .catch(error => update(operation, {state: State.REJECTED, error}))
    }

    // Add operation to cache
    cache.add(operation)

    return operation.suspender
  }

  const useSuspender: UseSuspenderHook<TResult, TArgs> = (...args) => {
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

  useSuspender.cache = Object.freeze({
    get size() {
      return cache.size
    },

    clear() {
      return cache.clear()
    }
  })

  useSuspender.useSuspender = useSuspender

  return useSuspender
}
