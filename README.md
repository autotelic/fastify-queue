# fastify-queue
An async queue for [Fastify](https://www.fastify.io/docs/latest/).

## Usage

```sh
npm i @autotelic/fastify-queue
```
#### Example

```js
import fastifyQueue from '@autotelic/fastify-queue'

function myRoute (fastify, opts) {
  fastify.register(fastifyQueue)

  fastify.post('/example', async (request, reply) => {
    reply.queue.add('async-action-one', reply.asyncAction())
    reply.queue.add('async-action-two', reply.asyncActionTwo())
    reply.queue.add('async-action-three', reply.asyncActionThree())
    // Manual resolution optional - queue will otherwise resolve in onResponse hook.
    const results = await reply.queue.resolve()
    reply.status(200)
  })
}
```

## API

### Plugin `opts`

fastify-queue accepts the following *optional* configuration:

 - #### `initializer`: `(key: PropertyKey, value: unknown, reply: FastifyReply) => unknown | Promise<unknown>`
   - Called each time an item is added to the queue. The value returned will be the value added to the queue.

 - #### `resolver`: `(key: PropertyKey, value: unknown, reply: FastifyReply) => unknown | PromiseLike<unknown>`
   - Called each time an item in the queue is resolved. `value` is the resolved value of an item in the queue.

 - #### `onError`: `(error: Error, reply: FastifyReply) => void`
   - Called if an error occurs while resolving the queue. Defaults to `fastify.log.error(error)`.

- #### `onResolved`: `(result: Map<PropertyKey, unknown>, reply: FastifyReply) => void | Promise<void>`
  - Called after the queue has successfully resolved. `result` is the resolved queue.

- #### `queueName`: `string`
  - Determines the name of the reply decorator added by the plugin. Defaults to `'queue'`.

 - #### `concurrency`: `number`
   - Max number of concurrently pending promises. Defaults to `Infinity`.
   - This value is passed directly to [p-props `options` param](https://github.com/sindresorhus/p-props#options).

 - #### `stopOnError`: `boolean`
   - When set to `false`, errors thrown while resolving items in the queue will be accumulated. Once all items in the queue have settled, a single aggregated error will be thrown.
   - This value is passed directly to [p-props `options` param](https://github.com/sindresorhus/p-props#options).


### Reply Decorator

fastify-queue adds a `queue` (or the value of `opts.queueName`) reply decorator containing the following properties:

- #### `add`: `(key: PropertyKey, value: unknown) => void`
  - Used to add items to the queue.

- #### `resolve`: `(cb?: typeof opts.onResolved) => Promise<void>`
  - Used to manually resolve the queue. `cb` defaults to `opts.onResolved` 
  - If `cb` is provided it will be called instead of `opts.onResolved`
  - `result` param of `cb` is the resolved queue
  - fastify-queue will automatically resolve the queue in an `onResponse` hook, if this has not already been called.

- #### `contents`: `Map<PropertyKey, unknown>`
  - The queue `Map` instance.
