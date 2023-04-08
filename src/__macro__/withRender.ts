import anyTest from "ava"

import type {ReactElement} from "react"
import type {TestFn, ExecutionContext} from "ava"
import {renderHook, render, queries} from "@testing-library/react"
import type {
  Queries,
  RenderHookOptions,
  RenderHookResult,
  RenderOptions,
  RenderResult
} from "@testing-library/react"

import {createContainerFactory} from "../__helper__/createContainerFactory.js"

type OmitContainer<T> = Omit<T, "container">

type IsolatedRenderHook = <
  TResult,
  TProps,
  TQueries extends Queries = typeof queries,
>(
  fn: (initialProps: TProps) => TResult,
  options?: OmitContainer<RenderHookOptions<TProps, TQueries, HTMLDivElement>>
) => RenderHookResult<TResult, TProps>

type IsolatedRender<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container
> = (
  ui: ReactElement,
  options?: OmitContainer<RenderOptions>
) => RenderResult<Q, Container, BaseElement>

export interface WithRenderContext {
  render: IsolatedRender
  renderHook: IsolatedRenderHook
}

const test = anyTest as TestFn<WithRenderContext>

type Implementation = (t: ExecutionContext<WithRenderContext>) => Promise<void>

export const withRender = test.macro(async (t, impl: Implementation) => {
  const {createContainer, cleanupContainers} = createContainerFactory()

  const isolatedRenderHook: IsolatedRenderHook = (fn, options) => renderHook(
    fn,

    {
      ...options, container: createContainer()
    }
  )

  const isolatedRender = (
    ui: ReactElement,
    options: OmitContainer<RenderOptions> = {}
  ) => render(ui, {
    ...options, container: createContainer()
  })

  t.context.renderHook = isolatedRenderHook
  t.context.render = isolatedRender

  try {
    await impl(t)
  } finally {
    cleanupContainers()
  }
})
