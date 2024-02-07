/* eslint-disable @typescript-eslint/no-unused-vars */
import fastify, { FastifyReply } from 'fastify'
// eslint-disable-next-line import/no-unresolved
import { expectAssignable, expectType } from 'tsd'

import type {
  OnQueueResolved,
  QueueInitializer,
  QueueInstance,
  QueuePluginOptions,
  QueueResolver
} from '..'

fastify().get('/', async (req, reply) => {
  expectType<QueueInstance>(reply.queue)

  const getBar = async () => 'bar'
  expectAssignable<void>(reply.queue.add('foo', getBar()))

  expectType<Map<PropertyKey, PromiseLike<unknown>>>(reply.queue.contents)

  expectAssignable<void>(
    await reply.queue.resolve()
  )

  expectAssignable<void>(
    await reply.queue.resolve(
      (resolved, reply) => {
        expectAssignable<Map<PropertyKey, unknown>>(resolved)
        expectAssignable<FastifyReply>(reply)
      }
    )
  )
})

expectType(<QueuePluginOptions>({}))

expectType(<QueuePluginOptions>({
  initializer: (key, value, reply) => {
    expectAssignable<PropertyKey>(key)
    expectAssignable<unknown>(value)
    expectAssignable<FastifyReply>(reply)
  },
  resolver: (key, value, reply) => {
    expectAssignable<PropertyKey>(key)
    expectAssignable<unknown>(value)
    expectAssignable<FastifyReply>(reply)
  },
  onResolved: (resolved, reply) => {
    expectAssignable<Map<PropertyKey, unknown>>(resolved)
    expectAssignable<FastifyReply>(reply)
  },
  onError: (e) => e,
  queueName: 'myQueue',
  concurrency: 9,
  stopOnError: true
}))

expectType(<QueuePluginOptions>({
  initializer: async (key, value, reply) => {
    expectAssignable<PropertyKey>(key)
    expectAssignable<unknown>(value)
    expectAssignable<FastifyReply>(reply)
  },
  resolver: async (key, value, reply) => {
    expectAssignable<PropertyKey>(key)
    expectAssignable<unknown>(value)
    expectAssignable<FastifyReply>(reply)
  },
  onResolved: async (resolved, reply) => {
    expectAssignable<Map<PropertyKey, unknown>>(resolved)
    expectAssignable<FastifyReply>(reply)
  }
}))

type KeyType = string
type ValueType = string[]
type ReturnType = Promise<Record<string, string>>

const initializer: QueueInitializer<ValueType, ReturnType, KeyType> = async (key, value, reply) => {
  expectAssignable<KeyType>(key)
  expectAssignable<ValueType>(value)
  expectAssignable<FastifyReply>(reply)
  return { foo: 'bar' }
}

const resolver: QueueResolver<ValueType, ReturnType, KeyType> = async (key, value, reply) => {
  expectAssignable<KeyType>(key)
  expectAssignable<ValueType>(value)
  expectAssignable<FastifyReply>(reply)
  return { bar: 'baz' }
}

const onResolved: OnQueueResolved<ValueType, KeyType> = async (resolved, reply) => {
  expectAssignable<Map<KeyType, ValueType>>(resolved)
  expectAssignable<FastifyReply>(reply)
}

expectType(<QueuePluginOptions>({
  initializer,
  resolver,
  onResolved
}))
