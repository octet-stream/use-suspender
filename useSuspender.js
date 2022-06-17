// @ts-check

const eq = require("fast-deep-equal/es6/react")

const STATE_INITIAL = "initial"
const STATE_PENDING = "pending"
const STATE_RESOLVED = "resolved"
const STATE_REJECTED = "rejected"

/**
 * @typedef {"initial" | "pending" | "resolved" | "rejected"} States
 */

/**
 * @typedef {Object} Operation
 * @prop {States} state
 * @prop {Error | null} error
 * @prop {any} result
 * @prop {Promise<void> | null} suspender
 * @prop {any[]} args
 */
/**
 * @type {Operation}
 *
 * @api private
 */
const initialOperationState = {
  state: STATE_INITIAL,
  error: null,
  result: null,
  suspender: null,
  args: []
}

/**
 * Calls a function and returns a Promise that resolves a result
 *
 * @param {(...args: any[]) => any} fn
 * @param {any[]} args
 * @param {unknown} ctx
 *
 * @return {Promise<any>}
 *
 * @api private
 */
function getPromise(fn, args, ctx) {
  try {
    const res = fn.apply(ctx, args)

    return res instanceof Promise ? res : Promise.resolve(res)
  } catch (err) {
    return Promise.reject(err)
  }
}

/**
 * Creates a new useSuspender hook for given function.
 *
 * @param {(...args: any[]) => any} fn A function to create a useSuspender hook with
 * @param {unknown} [ctx = undefined] thisArg value
 *
 * @return {(...args: any[]) => any} useSuspender
 *
 * @api public
 */
function createSuspender(fn, ctx) {
  if (typeof fn !== "function") {
    throw new TypeError("First argument expected to be a function.")
  }

  let operation = {...initialOperationState}

  /**
   * Resets the operation
   *
   * @return {void}
   *
   * @api private
   */
  function reset() {
    operation = {...initialOperationState}
  }

  /**
   * Calls a suspender function and sets its Promise on the operation
   * Takes the same arguments as getPromise function.
   *
   * @param {any[]} args
   *
   * @return {Promise<void>}
   *
   * @api private
   */
  function call(args) {
    operation.suspender = getPromise(fn, args, ctx)
      // The return statement is useless for this `.then()` callback
      // eslint-disable-next-line promise/always-return
      .then(result => {
        operation.result = result
        operation.state = STATE_RESOLVED
      })

      .catch(error => {
        operation.error = error
        operation.state = STATE_REJECTED
      })

    operation.state = STATE_PENDING
    operation.args = args

    return operation.suspender
  }

  /**
   * Calls a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   * @param {any[]} args A list of arguments to execute suspender with
   *
   * @return {any}
   *
   * @throws {Promise<void>} If the Promise haven't been fulfilled yet
   *
   * @throws {Error} If suspender's Promise has been rejected with an error
   *
   * @api public
   */
  function useSuspender(...args) {
    if (operation.state === STATE_PENDING && eq(args, operation.args)) {
      throw operation.suspender
    }

    if (operation.state === STATE_REJECTED) {
      throw operation.error
    }

    if (operation.state === STATE_RESOLVED) {
      const {result} = operation

      reset()

      return result
    }

    throw call(args)
  }

  /**
   * Calls useSuspense early
   *
   * @param {any[]} args A list of arguments to execute suspender with
   *
   * @return {void}
   *
   * @api public
   */
  useSuspender.callEarly = function callEarly(...args) {
    call(args)
  }

  // For those who want to use object destructing on createSuspender result.
  useSuspender.useSuspender = useSuspender

  return useSuspender
}

module.exports = createSuspender
module.exports.default = createSuspender
module.exports.createSuspender = createSuspender
