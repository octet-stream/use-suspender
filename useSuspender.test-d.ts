import {expectType as expect} from "tsd"

import {createSuspender, SuspenderImplementation, SuspenderHook} from "."

// Expect createSuspender to be a function
expect<Function>(createSuspender)

// Expect SuspenderImplementation to match any function
expect<SuspenderImplementation>(() => {})

expect<SuspenderImplementation>((a: number, b: number) => a + b)

// Expect createSuspender to return the SuspenderHook when called with a function as a single argument
expect<SuspenderHook>(createSuspender(() => {}))

// Expect SuspenderHook to have callEarly method
expect<Function>(createSuspender(() => {}).callEarly)

// Expect the callEarly to return nothing
expect<void>(createSuspender(() => {}).callEarly())
