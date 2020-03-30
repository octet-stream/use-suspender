const STATE_INITIAL = "initial"
const STATE_PENDING = "pending"
const STATE_RESOLVED = "resolved"
const STATE_REJECTED = "rejected"

/**
 * Calls a function and returns a Promise that resolves a result
 *
 * @param {Function} fn
 * @param {any[]} args
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
 * @param {Function} suspender
 * @param {any} [ctx = undefined]
 *
 * @return {Function} useSuspender
 *
 * @api public
 */
function createSuspender(suspender, ctx) {
  if (typeof suspender !== "function") {
    throw new TypeError("Suspender expected to be a function.")
  }

  const operation = {
    state: STATE_INITIAL, // initial | pending | resolved | rejected
    error: null,
    result: null,
    suspender: null
  }

  /**
   * Resets operation the operation
   */
  function reset() {
    operation.suspender = null
    operation.state = STATE_INITIAL
  }

  /**
   * Calls a suspender function and sets its Promise on the operation
   * Takes the same arguments as getPromise function.
   *
   * @return {Promise<void>}
   */
  function call(...args) {
    operation.suspender = getPromise(...args)
      .then(result => {
        operation.result = result
        operation.state = STATE_RESOLVED
      })

      .catch(error => {
        operation.error = error
        operation.state = STATE_REJECTED
      })

    operation.state = STATE_PENDING

    return operation.suspender
  }

  /**
   * Executes a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   *
   * @param {any[]} [args = []] a list of arguments to execute suspender with
   *
   * @return {any} result
   *
   * @throws {Promise} if the Promise haven't been fulfilled yet
   *
   * @throws {Error} if suspender's Promise has been rejected with an error
   *
   * @api public
   */
  function useSuspender(...args) {
    if (operation.state === STATE_REJECTED) {
      operation.suspender = null

      throw operation.error
    }

    if (operation.state === STATE_RESOLVED) {
      reset()

      return operation.result
    }

    if (operation.state === STATE_PENDING) {
      throw operation.suspender
    }

    throw call(suspender, args, ctx)
  }

  /**
   * Calls useSuspense early
   *
   * @param {any[]} [args = []] a list of arguments to execute suspender with
   *
   * @return {void}
   */
  useSuspender.init = function init(...args) {
    call(suspender, args)
  }

  // For those who want to use object destructing on createSuspender result.
  useSuspender.useSuspender = useSuspender

  return useSuspender
}

module.exports = createSuspender
