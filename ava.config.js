export default {
  require: "global-jsdom/register",
  nodeArguments: [
    "--loader=ts-node/esm/transpile-only"
  ],
  extensions: {
    jsx: "module"
  },
  files: [
    "*.test.{js,jsx}"
  ]
}
