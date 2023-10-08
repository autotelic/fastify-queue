declare module '@autotelic/fastify-queue' {
  type InitializerFunc = (key: any, value: any, r: any) => any;
  type ResolverFunc = (key: any, value: any, r: any) => any;
  type OnErrorFunc = (e: Error, r: any) => void;
  type OnResolvedFunc = (resolved: any, r: any) => Promise<void> | void;

  interface FastifyQueueOptions {
    initializer?: InitializerFunc;
    resolver?: ResolverFunc;
    onError?: OnErrorFunc;
    onResolved?: OnResolvedFunc;
    queueName?: string;
    concurrency?: number;
    stopOnError?: boolean;
  }

  interface FastifyQueueInstance {
    add: (key: any, value: any) => void;
    resolve: (cb?: OnResolvedFunc) => Promise<void>;
    contents: any;
    [key: string]: any;
  }

  function fastifyQueue(fastify: any, options: FastifyQueueOptions): void;

  export = fastifyQueue;
}
