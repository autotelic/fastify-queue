import { FastifyPluginAsync, FastifyReply } from 'fastify'

declare namespace fastifyQueue {
  export type QueueInitializer<ValueType = unknown, ReturnType = unknown, KeyType = PropertyKey> = (
    key: KeyType,
    value: ValueType,
    reply: FastifyReply
  ) => ReturnType | PromiseLike<ReturnType>

  export type QueueResolver<ValueType = unknown, ReturnType = unknown, KeyType = PropertyKey> = (
    key: KeyType,
    value: ValueType,
    reply: FastifyReply
  ) => ReturnType | PromiseLike<ReturnType>

  export type OnQueueResolved<ValueType = unknown, KeyType = PropertyKey> = (
    resolvedQueue: Map<KeyType, ValueType>,
    reply: FastifyReply
  ) => void | Promise<void>

  export type QueueInstance <InputType = unknown, KeyType = PropertyKey> = {
    add(key: KeyType, value: InputType): void
    resolve(cb?: OnQueueResolved): Promise<void>
    get contents(): Map<KeyType, PromiseLike<InputType>>
  }

  export type QueuePluginOptions = {
    initializer?: QueueInitializer
    resolver?: QueueResolver
    onResolved?: OnQueueResolved
    onError?(e: unknown): void
    queueName?: string
    concurrency?: number
    stopOnError?: boolean
  }

  const fastifyQueue: FastifyPluginAsync<QueuePluginOptions>

  export { fastifyQueue as default }
}

declare module 'fastify' {
  interface FastifyReply {
    queue: fastifyQueue.QueueInstance
  }
}

export = fastifyQueue
