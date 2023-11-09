/* eslint-disable import/no-extraneous-dependencies */

import {defineConfig} from "tsup"

export default defineConfig(() => ({
  format: ["esm", "cjs"],
  globalName: "useSuspender",
  entry: ["src/useSuspender.ts"],
  outDir: "lib",
  dts: true,
  splitting: false,
  external: ["formdata-node", "busboy"]
}))
