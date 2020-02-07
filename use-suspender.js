const isObject = value => typeof value === "object" && value !== null

const isFunction = value => typeof value === "function"

const replacer = (key, value) => String(value)

function createUseSuspender() {
  const cache = new Map()

  /**
   * Executes given suspender function then throws its Promise
   * to await and consume its result with React.Suspense.
   *
   * EXPERIMENTAL!!!
   *
   * @param {string | {[key: string]: any}} id
   * @param {() => Promise<any>} suspender
   * @param {Array<any>} [args = []]
   *
   * @return {any}
   *
   * @throws {Promise} A promise will be thrown when no suspender with
   *  such ID found in cache.
   *
   * @throws {Error} if suspender's Promise has been rejected with an error
   */
  function useSuspender(id, suspender, args = []) {
    if (!id) {
      throw new Error("Suspender ID is required.")
    }

    if (!isFunction(suspender)) {
      throw new TypeError("Expected suspender to be a function.")
    }

    id = isObject(id) ? JSON.stringify(id, replacer) : String(id)

    // Try to resolve a result of an operation if found in cache
    if (cache.has(id)) {
      const {result, error, state, ...operation} = cache.get(id)

      if (state === "rejected") {
        // Probably I should not clean the cache on error
        // because react continues to call useSuspender again and again
        // cache.delete(id)

        throw error
      }

      // Remove entry from the cache then return the result
      if (state === "resolved") {
        // NOTE: I think that cache management probably must be reconsidered
        // due to the fact of how such early operation removal might affect
        // on a further Suspense-dependent components re-renders.
        // I almost thing that the closest Suspense is up the component
        // that called this function, React may call the component again
        // which will cause unnecessary operation's runs.
        cache.delete(id)

        return result
      }

      // Be careful to use this hook when something in a component may throw an
      // error. I probably must put some error boundary to prevent infinite
      // re-renders in such use cases.

      // If there's no result neither error then just throw the operation
      // again since we probably still waiting for the result
      throw operation.suspender
    }

    const operation = {
      error: null,
      result: null,
      state: "pending",
      suspender: Promise.resolve(suspender(...args))
        .then(result => {
          operation.result = result
          operation.state = "resolved"
        })

        .catch(error => {
          operation.error = error
          operation.state = "rejected"
        })
    }

    // Cache the operation
    cache.set(id, operation)

    // Notify React.Suspense
    throw operation.suspender
  }

  return useSuspender
}

module.exports = createUseSuspender()
module.exports.default = module.exports
module.exports.useSuspender = module.exports
module.exports.createUseSuspender = createUseSuspender
