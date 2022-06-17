import {expectType as expect} from "tsd"

import type {SuspenderHook} from "."
import {createSuspender} from "."

// Expect createSuspender to be a function
expect<Function>(createSuspender)

// SuspenderHook has correct result
expect<SuspenderHook<number, []>>(createSuspender(() => 0))

// SuspenderHook unwraps promise result
expect<SuspenderHook<number, []>>(createSuspender(async () => 0))

// SuspenderHook takes arguments from given SuspenderImplementation
expect<SuspenderHook<void, [number, number]>>(createSuspender((a: number, b: number) => a + b))

// Expect SuspenderHook to have callEarly method
expect<() => void>(createSuspender(() => {}).callEarly)
