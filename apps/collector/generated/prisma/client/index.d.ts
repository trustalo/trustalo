
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model AgentRun
 * 
 */
export type AgentRun = $Result.DefaultSelection<Prisma.$AgentRunPayload>
/**
 * Model IntegrationConnection
 * 
 */
export type IntegrationConnection = $Result.DefaultSelection<Prisma.$IntegrationConnectionPayload>
/**
 * Model IntegrationCheck
 * 
 */
export type IntegrationCheck = $Result.DefaultSelection<Prisma.$IntegrationCheckPayload>
/**
 * Model IntegrationCheckControl
 * 
 */
export type IntegrationCheckControl = $Result.DefaultSelection<Prisma.$IntegrationCheckControlPayload>
/**
 * Model IntegrationCheckResult
 * 
 */
export type IntegrationCheckResult = $Result.DefaultSelection<Prisma.$IntegrationCheckResultPayload>
/**
 * Model Integration
 * 
 */
export type Integration = $Result.DefaultSelection<Prisma.$IntegrationPayload>
/**
 * Model CollectionJob
 * 
 */
export type CollectionJob = $Result.DefaultSelection<Prisma.$CollectionJobPayload>
/**
 * Model CollectionJobRun
 * 
 */
export type CollectionJobRun = $Result.DefaultSelection<Prisma.$CollectionJobRunPayload>
/**
 * Model CollectionRetry
 * 
 */
export type CollectionRetry = $Result.DefaultSelection<Prisma.$CollectionRetryPayload>
/**
 * Model SecretVault
 * 
 */
export type SecretVault = $Result.DefaultSelection<Prisma.$SecretVaultPayload>
/**
 * Model SyncLog
 * 
 */
export type SyncLog = $Result.DefaultSelection<Prisma.$SyncLogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const AgentRunStatus: {
  pending: 'pending',
  running: 'running',
  succeeded: 'succeeded',
  failed: 'failed',
  cancelled: 'cancelled'
};

export type AgentRunStatus = (typeof AgentRunStatus)[keyof typeof AgentRunStatus]


export const AgentRunTrigger: {
  manual: 'manual',
  scheduled: 'scheduled',
  api: 'api'
};

export type AgentRunTrigger = (typeof AgentRunTrigger)[keyof typeof AgentRunTrigger]


export const ConnectionStatus: {
  connected: 'connected',
  disconnected: 'disconnected',
  error: 'error',
  syncing: 'syncing',
  pending_auth: 'pending_auth'
};

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus]


export const IntegrationCheckStatus: {
  pass: 'pass',
  fail: 'fail',
  error: 'error',
  skipped: 'skipped',
  pending: 'pending'
};

export type IntegrationCheckStatus = (typeof IntegrationCheckStatus)[keyof typeof IntegrationCheckStatus]


export const IntegrationCheckSeverity: {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical'
};

export type IntegrationCheckSeverity = (typeof IntegrationCheckSeverity)[keyof typeof IntegrationCheckSeverity]


export const AuthType: {
  oauth2: 'oauth2',
  api_key: 'api_key',
  iam_role: 'iam_role'
};

export type AuthType = (typeof AuthType)[keyof typeof AuthType]


export const IntegrationCategory: {
  cloud: 'cloud',
  identity: 'identity',
  code_repository: 'code_repository',
  productivity: 'productivity',
  security: 'security',
  hr: 'hr',
  ai: 'ai',
  custom: 'custom'
};

export type IntegrationCategory = (typeof IntegrationCategory)[keyof typeof IntegrationCategory]


export const JobType: {
  scheduled: 'scheduled',
  manual: 'manual',
  triggered: 'triggered'
};

export type JobType = (typeof JobType)[keyof typeof JobType]


export const JobStatus: {
  pending: 'pending',
  queued: 'queued',
  running: 'running',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled'
};

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus]


export const RunStatus: {
  running: 'running',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled'
};

export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus]


export const RetryStatus: {
  pending: 'pending',
  retrying: 'retrying',
  succeeded: 'succeeded',
  failed: 'failed',
  exhausted: 'exhausted'
};

export type RetryStatus = (typeof RetryStatus)[keyof typeof RetryStatus]


export const SecretScope: {
  integration_connection: 'integration_connection',
  webhook: 'webhook',
  ad_hoc: 'ad_hoc'
};

export type SecretScope = (typeof SecretScope)[keyof typeof SecretScope]


export const SyncAction: {
  full_sync: 'full_sync',
  incremental_sync: 'incremental_sync',
  test_connection: 'test_connection',
  credential_refresh: 'credential_refresh'
};

export type SyncAction = (typeof SyncAction)[keyof typeof SyncAction]


export const SyncStatus: {
  started: 'started',
  completed: 'completed',
  failed: 'failed',
  partial: 'partial'
};

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus]

}

export type AgentRunStatus = $Enums.AgentRunStatus

export const AgentRunStatus: typeof $Enums.AgentRunStatus

export type AgentRunTrigger = $Enums.AgentRunTrigger

export const AgentRunTrigger: typeof $Enums.AgentRunTrigger

export type ConnectionStatus = $Enums.ConnectionStatus

export const ConnectionStatus: typeof $Enums.ConnectionStatus

export type IntegrationCheckStatus = $Enums.IntegrationCheckStatus

export const IntegrationCheckStatus: typeof $Enums.IntegrationCheckStatus

export type IntegrationCheckSeverity = $Enums.IntegrationCheckSeverity

export const IntegrationCheckSeverity: typeof $Enums.IntegrationCheckSeverity

export type AuthType = $Enums.AuthType

export const AuthType: typeof $Enums.AuthType

export type IntegrationCategory = $Enums.IntegrationCategory

export const IntegrationCategory: typeof $Enums.IntegrationCategory

export type JobType = $Enums.JobType

export const JobType: typeof $Enums.JobType

export type JobStatus = $Enums.JobStatus

export const JobStatus: typeof $Enums.JobStatus

export type RunStatus = $Enums.RunStatus

export const RunStatus: typeof $Enums.RunStatus

export type RetryStatus = $Enums.RetryStatus

export const RetryStatus: typeof $Enums.RetryStatus

export type SecretScope = $Enums.SecretScope

export const SecretScope: typeof $Enums.SecretScope

export type SyncAction = $Enums.SyncAction

export const SyncAction: typeof $Enums.SyncAction

export type SyncStatus = $Enums.SyncStatus

export const SyncStatus: typeof $Enums.SyncStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more AgentRuns
 * const agentRuns = await prisma.agentRun.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more AgentRuns
   * const agentRuns = await prisma.agentRun.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.agentRun`: Exposes CRUD operations for the **AgentRun** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AgentRuns
    * const agentRuns = await prisma.agentRun.findMany()
    * ```
    */
  get agentRun(): Prisma.AgentRunDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.integrationConnection`: Exposes CRUD operations for the **IntegrationConnection** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IntegrationConnections
    * const integrationConnections = await prisma.integrationConnection.findMany()
    * ```
    */
  get integrationConnection(): Prisma.IntegrationConnectionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.integrationCheck`: Exposes CRUD operations for the **IntegrationCheck** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IntegrationChecks
    * const integrationChecks = await prisma.integrationCheck.findMany()
    * ```
    */
  get integrationCheck(): Prisma.IntegrationCheckDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.integrationCheckControl`: Exposes CRUD operations for the **IntegrationCheckControl** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IntegrationCheckControls
    * const integrationCheckControls = await prisma.integrationCheckControl.findMany()
    * ```
    */
  get integrationCheckControl(): Prisma.IntegrationCheckControlDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.integrationCheckResult`: Exposes CRUD operations for the **IntegrationCheckResult** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IntegrationCheckResults
    * const integrationCheckResults = await prisma.integrationCheckResult.findMany()
    * ```
    */
  get integrationCheckResult(): Prisma.IntegrationCheckResultDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.integration`: Exposes CRUD operations for the **Integration** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Integrations
    * const integrations = await prisma.integration.findMany()
    * ```
    */
  get integration(): Prisma.IntegrationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.collectionJob`: Exposes CRUD operations for the **CollectionJob** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CollectionJobs
    * const collectionJobs = await prisma.collectionJob.findMany()
    * ```
    */
  get collectionJob(): Prisma.CollectionJobDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.collectionJobRun`: Exposes CRUD operations for the **CollectionJobRun** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CollectionJobRuns
    * const collectionJobRuns = await prisma.collectionJobRun.findMany()
    * ```
    */
  get collectionJobRun(): Prisma.CollectionJobRunDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.collectionRetry`: Exposes CRUD operations for the **CollectionRetry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CollectionRetries
    * const collectionRetries = await prisma.collectionRetry.findMany()
    * ```
    */
  get collectionRetry(): Prisma.CollectionRetryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.secretVault`: Exposes CRUD operations for the **SecretVault** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SecretVaults
    * const secretVaults = await prisma.secretVault.findMany()
    * ```
    */
  get secretVault(): Prisma.SecretVaultDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.syncLog`: Exposes CRUD operations for the **SyncLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SyncLogs
    * const syncLogs = await prisma.syncLog.findMany()
    * ```
    */
  get syncLog(): Prisma.SyncLogDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.7.0
   * Query Engine version: 75cbdc1eb7150937890ad5465d861175c6624711
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    AgentRun: 'AgentRun',
    IntegrationConnection: 'IntegrationConnection',
    IntegrationCheck: 'IntegrationCheck',
    IntegrationCheckControl: 'IntegrationCheckControl',
    IntegrationCheckResult: 'IntegrationCheckResult',
    Integration: 'Integration',
    CollectionJob: 'CollectionJob',
    CollectionJobRun: 'CollectionJobRun',
    CollectionRetry: 'CollectionRetry',
    SecretVault: 'SecretVault',
    SyncLog: 'SyncLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "agentRun" | "integrationConnection" | "integrationCheck" | "integrationCheckControl" | "integrationCheckResult" | "integration" | "collectionJob" | "collectionJobRun" | "collectionRetry" | "secretVault" | "syncLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      AgentRun: {
        payload: Prisma.$AgentRunPayload<ExtArgs>
        fields: Prisma.AgentRunFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AgentRunFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgentRunFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>
          }
          findFirst: {
            args: Prisma.AgentRunFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgentRunFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>
          }
          findMany: {
            args: Prisma.AgentRunFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>[]
          }
          create: {
            args: Prisma.AgentRunCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>
          }
          createMany: {
            args: Prisma.AgentRunCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AgentRunCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>[]
          }
          delete: {
            args: Prisma.AgentRunDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>
          }
          update: {
            args: Prisma.AgentRunUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>
          }
          deleteMany: {
            args: Prisma.AgentRunDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AgentRunUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AgentRunUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>[]
          }
          upsert: {
            args: Prisma.AgentRunUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentRunPayload>
          }
          aggregate: {
            args: Prisma.AgentRunAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAgentRun>
          }
          groupBy: {
            args: Prisma.AgentRunGroupByArgs<ExtArgs>
            result: $Utils.Optional<AgentRunGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgentRunCountArgs<ExtArgs>
            result: $Utils.Optional<AgentRunCountAggregateOutputType> | number
          }
        }
      }
      IntegrationConnection: {
        payload: Prisma.$IntegrationConnectionPayload<ExtArgs>
        fields: Prisma.IntegrationConnectionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IntegrationConnectionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IntegrationConnectionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>
          }
          findFirst: {
            args: Prisma.IntegrationConnectionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IntegrationConnectionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>
          }
          findMany: {
            args: Prisma.IntegrationConnectionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>[]
          }
          create: {
            args: Prisma.IntegrationConnectionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>
          }
          createMany: {
            args: Prisma.IntegrationConnectionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IntegrationConnectionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>[]
          }
          delete: {
            args: Prisma.IntegrationConnectionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>
          }
          update: {
            args: Prisma.IntegrationConnectionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>
          }
          deleteMany: {
            args: Prisma.IntegrationConnectionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IntegrationConnectionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IntegrationConnectionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>[]
          }
          upsert: {
            args: Prisma.IntegrationConnectionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationConnectionPayload>
          }
          aggregate: {
            args: Prisma.IntegrationConnectionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIntegrationConnection>
          }
          groupBy: {
            args: Prisma.IntegrationConnectionGroupByArgs<ExtArgs>
            result: $Utils.Optional<IntegrationConnectionGroupByOutputType>[]
          }
          count: {
            args: Prisma.IntegrationConnectionCountArgs<ExtArgs>
            result: $Utils.Optional<IntegrationConnectionCountAggregateOutputType> | number
          }
        }
      }
      IntegrationCheck: {
        payload: Prisma.$IntegrationCheckPayload<ExtArgs>
        fields: Prisma.IntegrationCheckFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IntegrationCheckFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IntegrationCheckFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>
          }
          findFirst: {
            args: Prisma.IntegrationCheckFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IntegrationCheckFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>
          }
          findMany: {
            args: Prisma.IntegrationCheckFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>[]
          }
          create: {
            args: Prisma.IntegrationCheckCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>
          }
          createMany: {
            args: Prisma.IntegrationCheckCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IntegrationCheckCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>[]
          }
          delete: {
            args: Prisma.IntegrationCheckDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>
          }
          update: {
            args: Prisma.IntegrationCheckUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>
          }
          deleteMany: {
            args: Prisma.IntegrationCheckDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IntegrationCheckUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IntegrationCheckUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>[]
          }
          upsert: {
            args: Prisma.IntegrationCheckUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckPayload>
          }
          aggregate: {
            args: Prisma.IntegrationCheckAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIntegrationCheck>
          }
          groupBy: {
            args: Prisma.IntegrationCheckGroupByArgs<ExtArgs>
            result: $Utils.Optional<IntegrationCheckGroupByOutputType>[]
          }
          count: {
            args: Prisma.IntegrationCheckCountArgs<ExtArgs>
            result: $Utils.Optional<IntegrationCheckCountAggregateOutputType> | number
          }
        }
      }
      IntegrationCheckControl: {
        payload: Prisma.$IntegrationCheckControlPayload<ExtArgs>
        fields: Prisma.IntegrationCheckControlFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IntegrationCheckControlFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IntegrationCheckControlFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>
          }
          findFirst: {
            args: Prisma.IntegrationCheckControlFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IntegrationCheckControlFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>
          }
          findMany: {
            args: Prisma.IntegrationCheckControlFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>[]
          }
          create: {
            args: Prisma.IntegrationCheckControlCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>
          }
          createMany: {
            args: Prisma.IntegrationCheckControlCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IntegrationCheckControlCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>[]
          }
          delete: {
            args: Prisma.IntegrationCheckControlDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>
          }
          update: {
            args: Prisma.IntegrationCheckControlUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>
          }
          deleteMany: {
            args: Prisma.IntegrationCheckControlDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IntegrationCheckControlUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IntegrationCheckControlUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>[]
          }
          upsert: {
            args: Prisma.IntegrationCheckControlUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckControlPayload>
          }
          aggregate: {
            args: Prisma.IntegrationCheckControlAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIntegrationCheckControl>
          }
          groupBy: {
            args: Prisma.IntegrationCheckControlGroupByArgs<ExtArgs>
            result: $Utils.Optional<IntegrationCheckControlGroupByOutputType>[]
          }
          count: {
            args: Prisma.IntegrationCheckControlCountArgs<ExtArgs>
            result: $Utils.Optional<IntegrationCheckControlCountAggregateOutputType> | number
          }
        }
      }
      IntegrationCheckResult: {
        payload: Prisma.$IntegrationCheckResultPayload<ExtArgs>
        fields: Prisma.IntegrationCheckResultFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IntegrationCheckResultFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IntegrationCheckResultFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>
          }
          findFirst: {
            args: Prisma.IntegrationCheckResultFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IntegrationCheckResultFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>
          }
          findMany: {
            args: Prisma.IntegrationCheckResultFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>[]
          }
          create: {
            args: Prisma.IntegrationCheckResultCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>
          }
          createMany: {
            args: Prisma.IntegrationCheckResultCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IntegrationCheckResultCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>[]
          }
          delete: {
            args: Prisma.IntegrationCheckResultDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>
          }
          update: {
            args: Prisma.IntegrationCheckResultUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>
          }
          deleteMany: {
            args: Prisma.IntegrationCheckResultDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IntegrationCheckResultUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IntegrationCheckResultUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>[]
          }
          upsert: {
            args: Prisma.IntegrationCheckResultUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationCheckResultPayload>
          }
          aggregate: {
            args: Prisma.IntegrationCheckResultAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIntegrationCheckResult>
          }
          groupBy: {
            args: Prisma.IntegrationCheckResultGroupByArgs<ExtArgs>
            result: $Utils.Optional<IntegrationCheckResultGroupByOutputType>[]
          }
          count: {
            args: Prisma.IntegrationCheckResultCountArgs<ExtArgs>
            result: $Utils.Optional<IntegrationCheckResultCountAggregateOutputType> | number
          }
        }
      }
      Integration: {
        payload: Prisma.$IntegrationPayload<ExtArgs>
        fields: Prisma.IntegrationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IntegrationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IntegrationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>
          }
          findFirst: {
            args: Prisma.IntegrationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IntegrationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>
          }
          findMany: {
            args: Prisma.IntegrationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>[]
          }
          create: {
            args: Prisma.IntegrationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>
          }
          createMany: {
            args: Prisma.IntegrationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IntegrationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>[]
          }
          delete: {
            args: Prisma.IntegrationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>
          }
          update: {
            args: Prisma.IntegrationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>
          }
          deleteMany: {
            args: Prisma.IntegrationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IntegrationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IntegrationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>[]
          }
          upsert: {
            args: Prisma.IntegrationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IntegrationPayload>
          }
          aggregate: {
            args: Prisma.IntegrationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIntegration>
          }
          groupBy: {
            args: Prisma.IntegrationGroupByArgs<ExtArgs>
            result: $Utils.Optional<IntegrationGroupByOutputType>[]
          }
          count: {
            args: Prisma.IntegrationCountArgs<ExtArgs>
            result: $Utils.Optional<IntegrationCountAggregateOutputType> | number
          }
        }
      }
      CollectionJob: {
        payload: Prisma.$CollectionJobPayload<ExtArgs>
        fields: Prisma.CollectionJobFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CollectionJobFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CollectionJobFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>
          }
          findFirst: {
            args: Prisma.CollectionJobFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CollectionJobFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>
          }
          findMany: {
            args: Prisma.CollectionJobFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>[]
          }
          create: {
            args: Prisma.CollectionJobCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>
          }
          createMany: {
            args: Prisma.CollectionJobCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CollectionJobCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>[]
          }
          delete: {
            args: Prisma.CollectionJobDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>
          }
          update: {
            args: Prisma.CollectionJobUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>
          }
          deleteMany: {
            args: Prisma.CollectionJobDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CollectionJobUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CollectionJobUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>[]
          }
          upsert: {
            args: Prisma.CollectionJobUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobPayload>
          }
          aggregate: {
            args: Prisma.CollectionJobAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCollectionJob>
          }
          groupBy: {
            args: Prisma.CollectionJobGroupByArgs<ExtArgs>
            result: $Utils.Optional<CollectionJobGroupByOutputType>[]
          }
          count: {
            args: Prisma.CollectionJobCountArgs<ExtArgs>
            result: $Utils.Optional<CollectionJobCountAggregateOutputType> | number
          }
        }
      }
      CollectionJobRun: {
        payload: Prisma.$CollectionJobRunPayload<ExtArgs>
        fields: Prisma.CollectionJobRunFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CollectionJobRunFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CollectionJobRunFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>
          }
          findFirst: {
            args: Prisma.CollectionJobRunFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CollectionJobRunFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>
          }
          findMany: {
            args: Prisma.CollectionJobRunFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>[]
          }
          create: {
            args: Prisma.CollectionJobRunCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>
          }
          createMany: {
            args: Prisma.CollectionJobRunCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CollectionJobRunCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>[]
          }
          delete: {
            args: Prisma.CollectionJobRunDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>
          }
          update: {
            args: Prisma.CollectionJobRunUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>
          }
          deleteMany: {
            args: Prisma.CollectionJobRunDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CollectionJobRunUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CollectionJobRunUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>[]
          }
          upsert: {
            args: Prisma.CollectionJobRunUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionJobRunPayload>
          }
          aggregate: {
            args: Prisma.CollectionJobRunAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCollectionJobRun>
          }
          groupBy: {
            args: Prisma.CollectionJobRunGroupByArgs<ExtArgs>
            result: $Utils.Optional<CollectionJobRunGroupByOutputType>[]
          }
          count: {
            args: Prisma.CollectionJobRunCountArgs<ExtArgs>
            result: $Utils.Optional<CollectionJobRunCountAggregateOutputType> | number
          }
        }
      }
      CollectionRetry: {
        payload: Prisma.$CollectionRetryPayload<ExtArgs>
        fields: Prisma.CollectionRetryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CollectionRetryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CollectionRetryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>
          }
          findFirst: {
            args: Prisma.CollectionRetryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CollectionRetryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>
          }
          findMany: {
            args: Prisma.CollectionRetryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>[]
          }
          create: {
            args: Prisma.CollectionRetryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>
          }
          createMany: {
            args: Prisma.CollectionRetryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CollectionRetryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>[]
          }
          delete: {
            args: Prisma.CollectionRetryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>
          }
          update: {
            args: Prisma.CollectionRetryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>
          }
          deleteMany: {
            args: Prisma.CollectionRetryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CollectionRetryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CollectionRetryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>[]
          }
          upsert: {
            args: Prisma.CollectionRetryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CollectionRetryPayload>
          }
          aggregate: {
            args: Prisma.CollectionRetryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCollectionRetry>
          }
          groupBy: {
            args: Prisma.CollectionRetryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CollectionRetryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CollectionRetryCountArgs<ExtArgs>
            result: $Utils.Optional<CollectionRetryCountAggregateOutputType> | number
          }
        }
      }
      SecretVault: {
        payload: Prisma.$SecretVaultPayload<ExtArgs>
        fields: Prisma.SecretVaultFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SecretVaultFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SecretVaultFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>
          }
          findFirst: {
            args: Prisma.SecretVaultFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SecretVaultFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>
          }
          findMany: {
            args: Prisma.SecretVaultFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>[]
          }
          create: {
            args: Prisma.SecretVaultCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>
          }
          createMany: {
            args: Prisma.SecretVaultCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SecretVaultCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>[]
          }
          delete: {
            args: Prisma.SecretVaultDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>
          }
          update: {
            args: Prisma.SecretVaultUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>
          }
          deleteMany: {
            args: Prisma.SecretVaultDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SecretVaultUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SecretVaultUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>[]
          }
          upsert: {
            args: Prisma.SecretVaultUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretVaultPayload>
          }
          aggregate: {
            args: Prisma.SecretVaultAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSecretVault>
          }
          groupBy: {
            args: Prisma.SecretVaultGroupByArgs<ExtArgs>
            result: $Utils.Optional<SecretVaultGroupByOutputType>[]
          }
          count: {
            args: Prisma.SecretVaultCountArgs<ExtArgs>
            result: $Utils.Optional<SecretVaultCountAggregateOutputType> | number
          }
        }
      }
      SyncLog: {
        payload: Prisma.$SyncLogPayload<ExtArgs>
        fields: Prisma.SyncLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SyncLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SyncLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>
          }
          findFirst: {
            args: Prisma.SyncLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SyncLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>
          }
          findMany: {
            args: Prisma.SyncLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>[]
          }
          create: {
            args: Prisma.SyncLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>
          }
          createMany: {
            args: Prisma.SyncLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SyncLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>[]
          }
          delete: {
            args: Prisma.SyncLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>
          }
          update: {
            args: Prisma.SyncLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>
          }
          deleteMany: {
            args: Prisma.SyncLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SyncLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SyncLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>[]
          }
          upsert: {
            args: Prisma.SyncLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncLogPayload>
          }
          aggregate: {
            args: Prisma.SyncLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSyncLog>
          }
          groupBy: {
            args: Prisma.SyncLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<SyncLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.SyncLogCountArgs<ExtArgs>
            result: $Utils.Optional<SyncLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    agentRun?: AgentRunOmit
    integrationConnection?: IntegrationConnectionOmit
    integrationCheck?: IntegrationCheckOmit
    integrationCheckControl?: IntegrationCheckControlOmit
    integrationCheckResult?: IntegrationCheckResultOmit
    integration?: IntegrationOmit
    collectionJob?: CollectionJobOmit
    collectionJobRun?: CollectionJobRunOmit
    collectionRetry?: CollectionRetryOmit
    secretVault?: SecretVaultOmit
    syncLog?: SyncLogOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type IntegrationConnectionCountOutputType
   */

  export type IntegrationConnectionCountOutputType = {
    jobs: number
    syncLogs: number
    checks: number
    checkControls: number
    checkResults: number
  }

  export type IntegrationConnectionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobs?: boolean | IntegrationConnectionCountOutputTypeCountJobsArgs
    syncLogs?: boolean | IntegrationConnectionCountOutputTypeCountSyncLogsArgs
    checks?: boolean | IntegrationConnectionCountOutputTypeCountChecksArgs
    checkControls?: boolean | IntegrationConnectionCountOutputTypeCountCheckControlsArgs
    checkResults?: boolean | IntegrationConnectionCountOutputTypeCountCheckResultsArgs
  }

  // Custom InputTypes
  /**
   * IntegrationConnectionCountOutputType without action
   */
  export type IntegrationConnectionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnectionCountOutputType
     */
    select?: IntegrationConnectionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * IntegrationConnectionCountOutputType without action
   */
  export type IntegrationConnectionCountOutputTypeCountJobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CollectionJobWhereInput
  }

  /**
   * IntegrationConnectionCountOutputType without action
   */
  export type IntegrationConnectionCountOutputTypeCountSyncLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SyncLogWhereInput
  }

  /**
   * IntegrationConnectionCountOutputType without action
   */
  export type IntegrationConnectionCountOutputTypeCountChecksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckWhereInput
  }

  /**
   * IntegrationConnectionCountOutputType without action
   */
  export type IntegrationConnectionCountOutputTypeCountCheckControlsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckControlWhereInput
  }

  /**
   * IntegrationConnectionCountOutputType without action
   */
  export type IntegrationConnectionCountOutputTypeCountCheckResultsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckResultWhereInput
  }


  /**
   * Count Type IntegrationCheckCountOutputType
   */

  export type IntegrationCheckCountOutputType = {
    controls: number
    results: number
  }

  export type IntegrationCheckCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    controls?: boolean | IntegrationCheckCountOutputTypeCountControlsArgs
    results?: boolean | IntegrationCheckCountOutputTypeCountResultsArgs
  }

  // Custom InputTypes
  /**
   * IntegrationCheckCountOutputType without action
   */
  export type IntegrationCheckCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckCountOutputType
     */
    select?: IntegrationCheckCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * IntegrationCheckCountOutputType without action
   */
  export type IntegrationCheckCountOutputTypeCountControlsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckControlWhereInput
  }

  /**
   * IntegrationCheckCountOutputType without action
   */
  export type IntegrationCheckCountOutputTypeCountResultsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckResultWhereInput
  }


  /**
   * Count Type IntegrationCountOutputType
   */

  export type IntegrationCountOutputType = {
    connections: number
    checks: number
  }

  export type IntegrationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connections?: boolean | IntegrationCountOutputTypeCountConnectionsArgs
    checks?: boolean | IntegrationCountOutputTypeCountChecksArgs
  }

  // Custom InputTypes
  /**
   * IntegrationCountOutputType without action
   */
  export type IntegrationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCountOutputType
     */
    select?: IntegrationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * IntegrationCountOutputType without action
   */
  export type IntegrationCountOutputTypeCountConnectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationConnectionWhereInput
  }

  /**
   * IntegrationCountOutputType without action
   */
  export type IntegrationCountOutputTypeCountChecksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckWhereInput
  }


  /**
   * Count Type CollectionJobCountOutputType
   */

  export type CollectionJobCountOutputType = {
    runs: number
  }

  export type CollectionJobCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    runs?: boolean | CollectionJobCountOutputTypeCountRunsArgs
  }

  // Custom InputTypes
  /**
   * CollectionJobCountOutputType without action
   */
  export type CollectionJobCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobCountOutputType
     */
    select?: CollectionJobCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CollectionJobCountOutputType without action
   */
  export type CollectionJobCountOutputTypeCountRunsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CollectionJobRunWhereInput
  }


  /**
   * Count Type CollectionJobRunCountOutputType
   */

  export type CollectionJobRunCountOutputType = {
    retries: number
  }

  export type CollectionJobRunCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    retries?: boolean | CollectionJobRunCountOutputTypeCountRetriesArgs
  }

  // Custom InputTypes
  /**
   * CollectionJobRunCountOutputType without action
   */
  export type CollectionJobRunCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRunCountOutputType
     */
    select?: CollectionJobRunCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CollectionJobRunCountOutputType without action
   */
  export type CollectionJobRunCountOutputTypeCountRetriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CollectionRetryWhereInput
  }


  /**
   * Models
   */

  /**
   * Model AgentRun
   */

  export type AggregateAgentRun = {
    _count: AgentRunCountAggregateOutputType | null
    _avg: AgentRunAvgAggregateOutputType | null
    _sum: AgentRunSumAggregateOutputType | null
    _min: AgentRunMinAggregateOutputType | null
    _max: AgentRunMaxAggregateOutputType | null
  }

  export type AgentRunAvgAggregateOutputType = {
    evidenceCount: number | null
    errorCount: number | null
    durationMs: number | null
  }

  export type AgentRunSumAggregateOutputType = {
    evidenceCount: number | null
    errorCount: number | null
    durationMs: number | null
  }

  export type AgentRunMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    controlId: string | null
    controlTitle: string | null
    trigger: $Enums.AgentRunTrigger | null
    status: $Enums.AgentRunStatus | null
    instructions: string | null
    aiProvider: string | null
    aiModel: string | null
    aiCredentialsEncrypted: string | null
    evidenceCount: number | null
    errorCount: number | null
    errorMessage: string | null
    summary: string | null
    startedAt: Date | null
    completedAt: Date | null
    durationMs: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AgentRunMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    controlId: string | null
    controlTitle: string | null
    trigger: $Enums.AgentRunTrigger | null
    status: $Enums.AgentRunStatus | null
    instructions: string | null
    aiProvider: string | null
    aiModel: string | null
    aiCredentialsEncrypted: string | null
    evidenceCount: number | null
    errorCount: number | null
    errorMessage: string | null
    summary: string | null
    startedAt: Date | null
    completedAt: Date | null
    durationMs: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AgentRunCountAggregateOutputType = {
    id: number
    tenantId: number
    controlId: number
    controlTitle: number
    trigger: number
    status: number
    instructions: number
    toolConnectionIds: number
    aiProvider: number
    aiModel: number
    aiCredentialsEncrypted: number
    evidenceCount: number
    errorCount: number
    errorMessage: number
    transcript: number
    summary: number
    toolCallSummary: number
    startedAt: number
    completedAt: number
    durationMs: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AgentRunAvgAggregateInputType = {
    evidenceCount?: true
    errorCount?: true
    durationMs?: true
  }

  export type AgentRunSumAggregateInputType = {
    evidenceCount?: true
    errorCount?: true
    durationMs?: true
  }

  export type AgentRunMinAggregateInputType = {
    id?: true
    tenantId?: true
    controlId?: true
    controlTitle?: true
    trigger?: true
    status?: true
    instructions?: true
    aiProvider?: true
    aiModel?: true
    aiCredentialsEncrypted?: true
    evidenceCount?: true
    errorCount?: true
    errorMessage?: true
    summary?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AgentRunMaxAggregateInputType = {
    id?: true
    tenantId?: true
    controlId?: true
    controlTitle?: true
    trigger?: true
    status?: true
    instructions?: true
    aiProvider?: true
    aiModel?: true
    aiCredentialsEncrypted?: true
    evidenceCount?: true
    errorCount?: true
    errorMessage?: true
    summary?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AgentRunCountAggregateInputType = {
    id?: true
    tenantId?: true
    controlId?: true
    controlTitle?: true
    trigger?: true
    status?: true
    instructions?: true
    toolConnectionIds?: true
    aiProvider?: true
    aiModel?: true
    aiCredentialsEncrypted?: true
    evidenceCount?: true
    errorCount?: true
    errorMessage?: true
    transcript?: true
    summary?: true
    toolCallSummary?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AgentRunAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentRun to aggregate.
     */
    where?: AgentRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentRuns to fetch.
     */
    orderBy?: AgentRunOrderByWithRelationInput | AgentRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgentRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AgentRuns
    **/
    _count?: true | AgentRunCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AgentRunAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AgentRunSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgentRunMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgentRunMaxAggregateInputType
  }

  export type GetAgentRunAggregateType<T extends AgentRunAggregateArgs> = {
        [P in keyof T & keyof AggregateAgentRun]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgentRun[P]>
      : GetScalarType<T[P], AggregateAgentRun[P]>
  }




  export type AgentRunGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentRunWhereInput
    orderBy?: AgentRunOrderByWithAggregationInput | AgentRunOrderByWithAggregationInput[]
    by: AgentRunScalarFieldEnum[] | AgentRunScalarFieldEnum
    having?: AgentRunScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgentRunCountAggregateInputType | true
    _avg?: AgentRunAvgAggregateInputType
    _sum?: AgentRunSumAggregateInputType
    _min?: AgentRunMinAggregateInputType
    _max?: AgentRunMaxAggregateInputType
  }

  export type AgentRunGroupByOutputType = {
    id: string
    tenantId: string
    controlId: string
    controlTitle: string | null
    trigger: $Enums.AgentRunTrigger
    status: $Enums.AgentRunStatus
    instructions: string
    toolConnectionIds: string[]
    aiProvider: string | null
    aiModel: string | null
    aiCredentialsEncrypted: string | null
    evidenceCount: number
    errorCount: number
    errorMessage: string | null
    transcript: JsonValue | null
    summary: string | null
    toolCallSummary: JsonValue | null
    startedAt: Date | null
    completedAt: Date | null
    durationMs: number | null
    createdAt: Date
    updatedAt: Date
    _count: AgentRunCountAggregateOutputType | null
    _avg: AgentRunAvgAggregateOutputType | null
    _sum: AgentRunSumAggregateOutputType | null
    _min: AgentRunMinAggregateOutputType | null
    _max: AgentRunMaxAggregateOutputType | null
  }

  type GetAgentRunGroupByPayload<T extends AgentRunGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AgentRunGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgentRunGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgentRunGroupByOutputType[P]>
            : GetScalarType<T[P], AgentRunGroupByOutputType[P]>
        }
      >
    >


  export type AgentRunSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    controlId?: boolean
    controlTitle?: boolean
    trigger?: boolean
    status?: boolean
    instructions?: boolean
    toolConnectionIds?: boolean
    aiProvider?: boolean
    aiModel?: boolean
    aiCredentialsEncrypted?: boolean
    evidenceCount?: boolean
    errorCount?: boolean
    errorMessage?: boolean
    transcript?: boolean
    summary?: boolean
    toolCallSummary?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["agentRun"]>

  export type AgentRunSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    controlId?: boolean
    controlTitle?: boolean
    trigger?: boolean
    status?: boolean
    instructions?: boolean
    toolConnectionIds?: boolean
    aiProvider?: boolean
    aiModel?: boolean
    aiCredentialsEncrypted?: boolean
    evidenceCount?: boolean
    errorCount?: boolean
    errorMessage?: boolean
    transcript?: boolean
    summary?: boolean
    toolCallSummary?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["agentRun"]>

  export type AgentRunSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    controlId?: boolean
    controlTitle?: boolean
    trigger?: boolean
    status?: boolean
    instructions?: boolean
    toolConnectionIds?: boolean
    aiProvider?: boolean
    aiModel?: boolean
    aiCredentialsEncrypted?: boolean
    evidenceCount?: boolean
    errorCount?: boolean
    errorMessage?: boolean
    transcript?: boolean
    summary?: boolean
    toolCallSummary?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["agentRun"]>

  export type AgentRunSelectScalar = {
    id?: boolean
    tenantId?: boolean
    controlId?: boolean
    controlTitle?: boolean
    trigger?: boolean
    status?: boolean
    instructions?: boolean
    toolConnectionIds?: boolean
    aiProvider?: boolean
    aiModel?: boolean
    aiCredentialsEncrypted?: boolean
    evidenceCount?: boolean
    errorCount?: boolean
    errorMessage?: boolean
    transcript?: boolean
    summary?: boolean
    toolCallSummary?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AgentRunOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "controlId" | "controlTitle" | "trigger" | "status" | "instructions" | "toolConnectionIds" | "aiProvider" | "aiModel" | "aiCredentialsEncrypted" | "evidenceCount" | "errorCount" | "errorMessage" | "transcript" | "summary" | "toolCallSummary" | "startedAt" | "completedAt" | "durationMs" | "createdAt" | "updatedAt", ExtArgs["result"]["agentRun"]>

  export type $AgentRunPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AgentRun"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      controlId: string
      controlTitle: string | null
      trigger: $Enums.AgentRunTrigger
      status: $Enums.AgentRunStatus
      instructions: string
      toolConnectionIds: string[]
      aiProvider: string | null
      aiModel: string | null
      aiCredentialsEncrypted: string | null
      evidenceCount: number
      errorCount: number
      errorMessage: string | null
      transcript: Prisma.JsonValue | null
      summary: string | null
      toolCallSummary: Prisma.JsonValue | null
      startedAt: Date | null
      completedAt: Date | null
      durationMs: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["agentRun"]>
    composites: {}
  }

  type AgentRunGetPayload<S extends boolean | null | undefined | AgentRunDefaultArgs> = $Result.GetResult<Prisma.$AgentRunPayload, S>

  type AgentRunCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AgentRunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AgentRunCountAggregateInputType | true
    }

  export interface AgentRunDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AgentRun'], meta: { name: 'AgentRun' } }
    /**
     * Find zero or one AgentRun that matches the filter.
     * @param {AgentRunFindUniqueArgs} args - Arguments to find a AgentRun
     * @example
     * // Get one AgentRun
     * const agentRun = await prisma.agentRun.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AgentRunFindUniqueArgs>(args: SelectSubset<T, AgentRunFindUniqueArgs<ExtArgs>>): Prisma__AgentRunClient<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AgentRun that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AgentRunFindUniqueOrThrowArgs} args - Arguments to find a AgentRun
     * @example
     * // Get one AgentRun
     * const agentRun = await prisma.agentRun.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AgentRunFindUniqueOrThrowArgs>(args: SelectSubset<T, AgentRunFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AgentRunClient<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AgentRun that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentRunFindFirstArgs} args - Arguments to find a AgentRun
     * @example
     * // Get one AgentRun
     * const agentRun = await prisma.agentRun.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AgentRunFindFirstArgs>(args?: SelectSubset<T, AgentRunFindFirstArgs<ExtArgs>>): Prisma__AgentRunClient<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AgentRun that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentRunFindFirstOrThrowArgs} args - Arguments to find a AgentRun
     * @example
     * // Get one AgentRun
     * const agentRun = await prisma.agentRun.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AgentRunFindFirstOrThrowArgs>(args?: SelectSubset<T, AgentRunFindFirstOrThrowArgs<ExtArgs>>): Prisma__AgentRunClient<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AgentRuns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentRunFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AgentRuns
     * const agentRuns = await prisma.agentRun.findMany()
     * 
     * // Get first 10 AgentRuns
     * const agentRuns = await prisma.agentRun.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agentRunWithIdOnly = await prisma.agentRun.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AgentRunFindManyArgs>(args?: SelectSubset<T, AgentRunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AgentRun.
     * @param {AgentRunCreateArgs} args - Arguments to create a AgentRun.
     * @example
     * // Create one AgentRun
     * const AgentRun = await prisma.agentRun.create({
     *   data: {
     *     // ... data to create a AgentRun
     *   }
     * })
     * 
     */
    create<T extends AgentRunCreateArgs>(args: SelectSubset<T, AgentRunCreateArgs<ExtArgs>>): Prisma__AgentRunClient<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AgentRuns.
     * @param {AgentRunCreateManyArgs} args - Arguments to create many AgentRuns.
     * @example
     * // Create many AgentRuns
     * const agentRun = await prisma.agentRun.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AgentRunCreateManyArgs>(args?: SelectSubset<T, AgentRunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AgentRuns and returns the data saved in the database.
     * @param {AgentRunCreateManyAndReturnArgs} args - Arguments to create many AgentRuns.
     * @example
     * // Create many AgentRuns
     * const agentRun = await prisma.agentRun.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AgentRuns and only return the `id`
     * const agentRunWithIdOnly = await prisma.agentRun.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AgentRunCreateManyAndReturnArgs>(args?: SelectSubset<T, AgentRunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AgentRun.
     * @param {AgentRunDeleteArgs} args - Arguments to delete one AgentRun.
     * @example
     * // Delete one AgentRun
     * const AgentRun = await prisma.agentRun.delete({
     *   where: {
     *     // ... filter to delete one AgentRun
     *   }
     * })
     * 
     */
    delete<T extends AgentRunDeleteArgs>(args: SelectSubset<T, AgentRunDeleteArgs<ExtArgs>>): Prisma__AgentRunClient<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AgentRun.
     * @param {AgentRunUpdateArgs} args - Arguments to update one AgentRun.
     * @example
     * // Update one AgentRun
     * const agentRun = await prisma.agentRun.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AgentRunUpdateArgs>(args: SelectSubset<T, AgentRunUpdateArgs<ExtArgs>>): Prisma__AgentRunClient<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AgentRuns.
     * @param {AgentRunDeleteManyArgs} args - Arguments to filter AgentRuns to delete.
     * @example
     * // Delete a few AgentRuns
     * const { count } = await prisma.agentRun.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AgentRunDeleteManyArgs>(args?: SelectSubset<T, AgentRunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentRunUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AgentRuns
     * const agentRun = await prisma.agentRun.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AgentRunUpdateManyArgs>(args: SelectSubset<T, AgentRunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentRuns and returns the data updated in the database.
     * @param {AgentRunUpdateManyAndReturnArgs} args - Arguments to update many AgentRuns.
     * @example
     * // Update many AgentRuns
     * const agentRun = await prisma.agentRun.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AgentRuns and only return the `id`
     * const agentRunWithIdOnly = await prisma.agentRun.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AgentRunUpdateManyAndReturnArgs>(args: SelectSubset<T, AgentRunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AgentRun.
     * @param {AgentRunUpsertArgs} args - Arguments to update or create a AgentRun.
     * @example
     * // Update or create a AgentRun
     * const agentRun = await prisma.agentRun.upsert({
     *   create: {
     *     // ... data to create a AgentRun
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AgentRun we want to update
     *   }
     * })
     */
    upsert<T extends AgentRunUpsertArgs>(args: SelectSubset<T, AgentRunUpsertArgs<ExtArgs>>): Prisma__AgentRunClient<$Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AgentRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentRunCountArgs} args - Arguments to filter AgentRuns to count.
     * @example
     * // Count the number of AgentRuns
     * const count = await prisma.agentRun.count({
     *   where: {
     *     // ... the filter for the AgentRuns we want to count
     *   }
     * })
    **/
    count<T extends AgentRunCountArgs>(
      args?: Subset<T, AgentRunCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgentRunCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AgentRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentRunAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgentRunAggregateArgs>(args: Subset<T, AgentRunAggregateArgs>): Prisma.PrismaPromise<GetAgentRunAggregateType<T>>

    /**
     * Group by AgentRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentRunGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgentRunGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgentRunGroupByArgs['orderBy'] }
        : { orderBy?: AgentRunGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgentRunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AgentRun model
   */
  readonly fields: AgentRunFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AgentRun.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AgentRunClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AgentRun model
   */
  interface AgentRunFieldRefs {
    readonly id: FieldRef<"AgentRun", 'String'>
    readonly tenantId: FieldRef<"AgentRun", 'String'>
    readonly controlId: FieldRef<"AgentRun", 'String'>
    readonly controlTitle: FieldRef<"AgentRun", 'String'>
    readonly trigger: FieldRef<"AgentRun", 'AgentRunTrigger'>
    readonly status: FieldRef<"AgentRun", 'AgentRunStatus'>
    readonly instructions: FieldRef<"AgentRun", 'String'>
    readonly toolConnectionIds: FieldRef<"AgentRun", 'String[]'>
    readonly aiProvider: FieldRef<"AgentRun", 'String'>
    readonly aiModel: FieldRef<"AgentRun", 'String'>
    readonly aiCredentialsEncrypted: FieldRef<"AgentRun", 'String'>
    readonly evidenceCount: FieldRef<"AgentRun", 'Int'>
    readonly errorCount: FieldRef<"AgentRun", 'Int'>
    readonly errorMessage: FieldRef<"AgentRun", 'String'>
    readonly transcript: FieldRef<"AgentRun", 'Json'>
    readonly summary: FieldRef<"AgentRun", 'String'>
    readonly toolCallSummary: FieldRef<"AgentRun", 'Json'>
    readonly startedAt: FieldRef<"AgentRun", 'DateTime'>
    readonly completedAt: FieldRef<"AgentRun", 'DateTime'>
    readonly durationMs: FieldRef<"AgentRun", 'Int'>
    readonly createdAt: FieldRef<"AgentRun", 'DateTime'>
    readonly updatedAt: FieldRef<"AgentRun", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AgentRun findUnique
   */
  export type AgentRunFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * Filter, which AgentRun to fetch.
     */
    where: AgentRunWhereUniqueInput
  }

  /**
   * AgentRun findUniqueOrThrow
   */
  export type AgentRunFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * Filter, which AgentRun to fetch.
     */
    where: AgentRunWhereUniqueInput
  }

  /**
   * AgentRun findFirst
   */
  export type AgentRunFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * Filter, which AgentRun to fetch.
     */
    where?: AgentRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentRuns to fetch.
     */
    orderBy?: AgentRunOrderByWithRelationInput | AgentRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentRuns.
     */
    cursor?: AgentRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentRuns.
     */
    distinct?: AgentRunScalarFieldEnum | AgentRunScalarFieldEnum[]
  }

  /**
   * AgentRun findFirstOrThrow
   */
  export type AgentRunFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * Filter, which AgentRun to fetch.
     */
    where?: AgentRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentRuns to fetch.
     */
    orderBy?: AgentRunOrderByWithRelationInput | AgentRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentRuns.
     */
    cursor?: AgentRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentRuns.
     */
    distinct?: AgentRunScalarFieldEnum | AgentRunScalarFieldEnum[]
  }

  /**
   * AgentRun findMany
   */
  export type AgentRunFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * Filter, which AgentRuns to fetch.
     */
    where?: AgentRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentRuns to fetch.
     */
    orderBy?: AgentRunOrderByWithRelationInput | AgentRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AgentRuns.
     */
    cursor?: AgentRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentRuns.
     */
    distinct?: AgentRunScalarFieldEnum | AgentRunScalarFieldEnum[]
  }

  /**
   * AgentRun create
   */
  export type AgentRunCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * The data needed to create a AgentRun.
     */
    data: XOR<AgentRunCreateInput, AgentRunUncheckedCreateInput>
  }

  /**
   * AgentRun createMany
   */
  export type AgentRunCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AgentRuns.
     */
    data: AgentRunCreateManyInput | AgentRunCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AgentRun createManyAndReturn
   */
  export type AgentRunCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * The data used to create many AgentRuns.
     */
    data: AgentRunCreateManyInput | AgentRunCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AgentRun update
   */
  export type AgentRunUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * The data needed to update a AgentRun.
     */
    data: XOR<AgentRunUpdateInput, AgentRunUncheckedUpdateInput>
    /**
     * Choose, which AgentRun to update.
     */
    where: AgentRunWhereUniqueInput
  }

  /**
   * AgentRun updateMany
   */
  export type AgentRunUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AgentRuns.
     */
    data: XOR<AgentRunUpdateManyMutationInput, AgentRunUncheckedUpdateManyInput>
    /**
     * Filter which AgentRuns to update
     */
    where?: AgentRunWhereInput
    /**
     * Limit how many AgentRuns to update.
     */
    limit?: number
  }

  /**
   * AgentRun updateManyAndReturn
   */
  export type AgentRunUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * The data used to update AgentRuns.
     */
    data: XOR<AgentRunUpdateManyMutationInput, AgentRunUncheckedUpdateManyInput>
    /**
     * Filter which AgentRuns to update
     */
    where?: AgentRunWhereInput
    /**
     * Limit how many AgentRuns to update.
     */
    limit?: number
  }

  /**
   * AgentRun upsert
   */
  export type AgentRunUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * The filter to search for the AgentRun to update in case it exists.
     */
    where: AgentRunWhereUniqueInput
    /**
     * In case the AgentRun found by the `where` argument doesn't exist, create a new AgentRun with this data.
     */
    create: XOR<AgentRunCreateInput, AgentRunUncheckedCreateInput>
    /**
     * In case the AgentRun was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgentRunUpdateInput, AgentRunUncheckedUpdateInput>
  }

  /**
   * AgentRun delete
   */
  export type AgentRunDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
    /**
     * Filter which AgentRun to delete.
     */
    where: AgentRunWhereUniqueInput
  }

  /**
   * AgentRun deleteMany
   */
  export type AgentRunDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentRuns to delete
     */
    where?: AgentRunWhereInput
    /**
     * Limit how many AgentRuns to delete.
     */
    limit?: number
  }

  /**
   * AgentRun without action
   */
  export type AgentRunDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentRun
     */
    select?: AgentRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentRun
     */
    omit?: AgentRunOmit<ExtArgs> | null
  }


  /**
   * Model IntegrationConnection
   */

  export type AggregateIntegrationConnection = {
    _count: IntegrationConnectionCountAggregateOutputType | null
    _avg: IntegrationConnectionAvgAggregateOutputType | null
    _sum: IntegrationConnectionSumAggregateOutputType | null
    _min: IntegrationConnectionMinAggregateOutputType | null
    _max: IntegrationConnectionMaxAggregateOutputType | null
  }

  export type IntegrationConnectionAvgAggregateOutputType = {
    syncFrequencyMinutes: number | null
  }

  export type IntegrationConnectionSumAggregateOutputType = {
    syncFrequencyMinutes: number | null
  }

  export type IntegrationConnectionMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    integrationId: string | null
    name: string | null
    status: $Enums.ConnectionStatus | null
    secretId: string | null
    lastSyncAt: Date | null
    lastErrorMessage: string | null
    syncFrequencyMinutes: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type IntegrationConnectionMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    integrationId: string | null
    name: string | null
    status: $Enums.ConnectionStatus | null
    secretId: string | null
    lastSyncAt: Date | null
    lastErrorMessage: string | null
    syncFrequencyMinutes: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type IntegrationConnectionCountAggregateOutputType = {
    id: number
    tenantId: number
    integrationId: number
    name: number
    status: number
    secretId: number
    config: number
    lastSyncAt: number
    lastErrorMessage: number
    syncFrequencyMinutes: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type IntegrationConnectionAvgAggregateInputType = {
    syncFrequencyMinutes?: true
  }

  export type IntegrationConnectionSumAggregateInputType = {
    syncFrequencyMinutes?: true
  }

  export type IntegrationConnectionMinAggregateInputType = {
    id?: true
    tenantId?: true
    integrationId?: true
    name?: true
    status?: true
    secretId?: true
    lastSyncAt?: true
    lastErrorMessage?: true
    syncFrequencyMinutes?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type IntegrationConnectionMaxAggregateInputType = {
    id?: true
    tenantId?: true
    integrationId?: true
    name?: true
    status?: true
    secretId?: true
    lastSyncAt?: true
    lastErrorMessage?: true
    syncFrequencyMinutes?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type IntegrationConnectionCountAggregateInputType = {
    id?: true
    tenantId?: true
    integrationId?: true
    name?: true
    status?: true
    secretId?: true
    config?: true
    lastSyncAt?: true
    lastErrorMessage?: true
    syncFrequencyMinutes?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type IntegrationConnectionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IntegrationConnection to aggregate.
     */
    where?: IntegrationConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationConnections to fetch.
     */
    orderBy?: IntegrationConnectionOrderByWithRelationInput | IntegrationConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IntegrationConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IntegrationConnections
    **/
    _count?: true | IntegrationConnectionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: IntegrationConnectionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: IntegrationConnectionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IntegrationConnectionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IntegrationConnectionMaxAggregateInputType
  }

  export type GetIntegrationConnectionAggregateType<T extends IntegrationConnectionAggregateArgs> = {
        [P in keyof T & keyof AggregateIntegrationConnection]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIntegrationConnection[P]>
      : GetScalarType<T[P], AggregateIntegrationConnection[P]>
  }




  export type IntegrationConnectionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationConnectionWhereInput
    orderBy?: IntegrationConnectionOrderByWithAggregationInput | IntegrationConnectionOrderByWithAggregationInput[]
    by: IntegrationConnectionScalarFieldEnum[] | IntegrationConnectionScalarFieldEnum
    having?: IntegrationConnectionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IntegrationConnectionCountAggregateInputType | true
    _avg?: IntegrationConnectionAvgAggregateInputType
    _sum?: IntegrationConnectionSumAggregateInputType
    _min?: IntegrationConnectionMinAggregateInputType
    _max?: IntegrationConnectionMaxAggregateInputType
  }

  export type IntegrationConnectionGroupByOutputType = {
    id: string
    tenantId: string
    integrationId: string
    name: string
    status: $Enums.ConnectionStatus
    secretId: string | null
    config: JsonValue | null
    lastSyncAt: Date | null
    lastErrorMessage: string | null
    syncFrequencyMinutes: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: IntegrationConnectionCountAggregateOutputType | null
    _avg: IntegrationConnectionAvgAggregateOutputType | null
    _sum: IntegrationConnectionSumAggregateOutputType | null
    _min: IntegrationConnectionMinAggregateOutputType | null
    _max: IntegrationConnectionMaxAggregateOutputType | null
  }

  type GetIntegrationConnectionGroupByPayload<T extends IntegrationConnectionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IntegrationConnectionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IntegrationConnectionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IntegrationConnectionGroupByOutputType[P]>
            : GetScalarType<T[P], IntegrationConnectionGroupByOutputType[P]>
        }
      >
    >


  export type IntegrationConnectionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationId?: boolean
    name?: boolean
    status?: boolean
    secretId?: boolean
    config?: boolean
    lastSyncAt?: boolean
    lastErrorMessage?: boolean
    syncFrequencyMinutes?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
    jobs?: boolean | IntegrationConnection$jobsArgs<ExtArgs>
    syncLogs?: boolean | IntegrationConnection$syncLogsArgs<ExtArgs>
    checks?: boolean | IntegrationConnection$checksArgs<ExtArgs>
    checkControls?: boolean | IntegrationConnection$checkControlsArgs<ExtArgs>
    checkResults?: boolean | IntegrationConnection$checkResultsArgs<ExtArgs>
    _count?: boolean | IntegrationConnectionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationConnection"]>

  export type IntegrationConnectionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationId?: boolean
    name?: boolean
    status?: boolean
    secretId?: boolean
    config?: boolean
    lastSyncAt?: boolean
    lastErrorMessage?: boolean
    syncFrequencyMinutes?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationConnection"]>

  export type IntegrationConnectionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationId?: boolean
    name?: boolean
    status?: boolean
    secretId?: boolean
    config?: boolean
    lastSyncAt?: boolean
    lastErrorMessage?: boolean
    syncFrequencyMinutes?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationConnection"]>

  export type IntegrationConnectionSelectScalar = {
    id?: boolean
    tenantId?: boolean
    integrationId?: boolean
    name?: boolean
    status?: boolean
    secretId?: boolean
    config?: boolean
    lastSyncAt?: boolean
    lastErrorMessage?: boolean
    syncFrequencyMinutes?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type IntegrationConnectionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "integrationId" | "name" | "status" | "secretId" | "config" | "lastSyncAt" | "lastErrorMessage" | "syncFrequencyMinutes" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["integrationConnection"]>
  export type IntegrationConnectionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
    jobs?: boolean | IntegrationConnection$jobsArgs<ExtArgs>
    syncLogs?: boolean | IntegrationConnection$syncLogsArgs<ExtArgs>
    checks?: boolean | IntegrationConnection$checksArgs<ExtArgs>
    checkControls?: boolean | IntegrationConnection$checkControlsArgs<ExtArgs>
    checkResults?: boolean | IntegrationConnection$checkResultsArgs<ExtArgs>
    _count?: boolean | IntegrationConnectionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type IntegrationConnectionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
  }
  export type IntegrationConnectionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
  }

  export type $IntegrationConnectionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IntegrationConnection"
    objects: {
      integration: Prisma.$IntegrationPayload<ExtArgs>
      jobs: Prisma.$CollectionJobPayload<ExtArgs>[]
      syncLogs: Prisma.$SyncLogPayload<ExtArgs>[]
      checks: Prisma.$IntegrationCheckPayload<ExtArgs>[]
      checkControls: Prisma.$IntegrationCheckControlPayload<ExtArgs>[]
      checkResults: Prisma.$IntegrationCheckResultPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      integrationId: string
      name: string
      status: $Enums.ConnectionStatus
      secretId: string | null
      config: Prisma.JsonValue | null
      lastSyncAt: Date | null
      lastErrorMessage: string | null
      syncFrequencyMinutes: number
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["integrationConnection"]>
    composites: {}
  }

  type IntegrationConnectionGetPayload<S extends boolean | null | undefined | IntegrationConnectionDefaultArgs> = $Result.GetResult<Prisma.$IntegrationConnectionPayload, S>

  type IntegrationConnectionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IntegrationConnectionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IntegrationConnectionCountAggregateInputType | true
    }

  export interface IntegrationConnectionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IntegrationConnection'], meta: { name: 'IntegrationConnection' } }
    /**
     * Find zero or one IntegrationConnection that matches the filter.
     * @param {IntegrationConnectionFindUniqueArgs} args - Arguments to find a IntegrationConnection
     * @example
     * // Get one IntegrationConnection
     * const integrationConnection = await prisma.integrationConnection.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IntegrationConnectionFindUniqueArgs>(args: SelectSubset<T, IntegrationConnectionFindUniqueArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IntegrationConnection that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IntegrationConnectionFindUniqueOrThrowArgs} args - Arguments to find a IntegrationConnection
     * @example
     * // Get one IntegrationConnection
     * const integrationConnection = await prisma.integrationConnection.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IntegrationConnectionFindUniqueOrThrowArgs>(args: SelectSubset<T, IntegrationConnectionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IntegrationConnection that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationConnectionFindFirstArgs} args - Arguments to find a IntegrationConnection
     * @example
     * // Get one IntegrationConnection
     * const integrationConnection = await prisma.integrationConnection.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IntegrationConnectionFindFirstArgs>(args?: SelectSubset<T, IntegrationConnectionFindFirstArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IntegrationConnection that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationConnectionFindFirstOrThrowArgs} args - Arguments to find a IntegrationConnection
     * @example
     * // Get one IntegrationConnection
     * const integrationConnection = await prisma.integrationConnection.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IntegrationConnectionFindFirstOrThrowArgs>(args?: SelectSubset<T, IntegrationConnectionFindFirstOrThrowArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IntegrationConnections that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationConnectionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IntegrationConnections
     * const integrationConnections = await prisma.integrationConnection.findMany()
     * 
     * // Get first 10 IntegrationConnections
     * const integrationConnections = await prisma.integrationConnection.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const integrationConnectionWithIdOnly = await prisma.integrationConnection.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IntegrationConnectionFindManyArgs>(args?: SelectSubset<T, IntegrationConnectionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IntegrationConnection.
     * @param {IntegrationConnectionCreateArgs} args - Arguments to create a IntegrationConnection.
     * @example
     * // Create one IntegrationConnection
     * const IntegrationConnection = await prisma.integrationConnection.create({
     *   data: {
     *     // ... data to create a IntegrationConnection
     *   }
     * })
     * 
     */
    create<T extends IntegrationConnectionCreateArgs>(args: SelectSubset<T, IntegrationConnectionCreateArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IntegrationConnections.
     * @param {IntegrationConnectionCreateManyArgs} args - Arguments to create many IntegrationConnections.
     * @example
     * // Create many IntegrationConnections
     * const integrationConnection = await prisma.integrationConnection.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IntegrationConnectionCreateManyArgs>(args?: SelectSubset<T, IntegrationConnectionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IntegrationConnections and returns the data saved in the database.
     * @param {IntegrationConnectionCreateManyAndReturnArgs} args - Arguments to create many IntegrationConnections.
     * @example
     * // Create many IntegrationConnections
     * const integrationConnection = await prisma.integrationConnection.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IntegrationConnections and only return the `id`
     * const integrationConnectionWithIdOnly = await prisma.integrationConnection.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IntegrationConnectionCreateManyAndReturnArgs>(args?: SelectSubset<T, IntegrationConnectionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IntegrationConnection.
     * @param {IntegrationConnectionDeleteArgs} args - Arguments to delete one IntegrationConnection.
     * @example
     * // Delete one IntegrationConnection
     * const IntegrationConnection = await prisma.integrationConnection.delete({
     *   where: {
     *     // ... filter to delete one IntegrationConnection
     *   }
     * })
     * 
     */
    delete<T extends IntegrationConnectionDeleteArgs>(args: SelectSubset<T, IntegrationConnectionDeleteArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IntegrationConnection.
     * @param {IntegrationConnectionUpdateArgs} args - Arguments to update one IntegrationConnection.
     * @example
     * // Update one IntegrationConnection
     * const integrationConnection = await prisma.integrationConnection.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IntegrationConnectionUpdateArgs>(args: SelectSubset<T, IntegrationConnectionUpdateArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IntegrationConnections.
     * @param {IntegrationConnectionDeleteManyArgs} args - Arguments to filter IntegrationConnections to delete.
     * @example
     * // Delete a few IntegrationConnections
     * const { count } = await prisma.integrationConnection.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IntegrationConnectionDeleteManyArgs>(args?: SelectSubset<T, IntegrationConnectionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IntegrationConnections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationConnectionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IntegrationConnections
     * const integrationConnection = await prisma.integrationConnection.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IntegrationConnectionUpdateManyArgs>(args: SelectSubset<T, IntegrationConnectionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IntegrationConnections and returns the data updated in the database.
     * @param {IntegrationConnectionUpdateManyAndReturnArgs} args - Arguments to update many IntegrationConnections.
     * @example
     * // Update many IntegrationConnections
     * const integrationConnection = await prisma.integrationConnection.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IntegrationConnections and only return the `id`
     * const integrationConnectionWithIdOnly = await prisma.integrationConnection.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IntegrationConnectionUpdateManyAndReturnArgs>(args: SelectSubset<T, IntegrationConnectionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IntegrationConnection.
     * @param {IntegrationConnectionUpsertArgs} args - Arguments to update or create a IntegrationConnection.
     * @example
     * // Update or create a IntegrationConnection
     * const integrationConnection = await prisma.integrationConnection.upsert({
     *   create: {
     *     // ... data to create a IntegrationConnection
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IntegrationConnection we want to update
     *   }
     * })
     */
    upsert<T extends IntegrationConnectionUpsertArgs>(args: SelectSubset<T, IntegrationConnectionUpsertArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IntegrationConnections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationConnectionCountArgs} args - Arguments to filter IntegrationConnections to count.
     * @example
     * // Count the number of IntegrationConnections
     * const count = await prisma.integrationConnection.count({
     *   where: {
     *     // ... the filter for the IntegrationConnections we want to count
     *   }
     * })
    **/
    count<T extends IntegrationConnectionCountArgs>(
      args?: Subset<T, IntegrationConnectionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IntegrationConnectionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IntegrationConnection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationConnectionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IntegrationConnectionAggregateArgs>(args: Subset<T, IntegrationConnectionAggregateArgs>): Prisma.PrismaPromise<GetIntegrationConnectionAggregateType<T>>

    /**
     * Group by IntegrationConnection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationConnectionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IntegrationConnectionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IntegrationConnectionGroupByArgs['orderBy'] }
        : { orderBy?: IntegrationConnectionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IntegrationConnectionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIntegrationConnectionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IntegrationConnection model
   */
  readonly fields: IntegrationConnectionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IntegrationConnection.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IntegrationConnectionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    integration<T extends IntegrationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationDefaultArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    jobs<T extends IntegrationConnection$jobsArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnection$jobsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    syncLogs<T extends IntegrationConnection$syncLogsArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnection$syncLogsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    checks<T extends IntegrationConnection$checksArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnection$checksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    checkControls<T extends IntegrationConnection$checkControlsArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnection$checkControlsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    checkResults<T extends IntegrationConnection$checkResultsArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnection$checkResultsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IntegrationConnection model
   */
  interface IntegrationConnectionFieldRefs {
    readonly id: FieldRef<"IntegrationConnection", 'String'>
    readonly tenantId: FieldRef<"IntegrationConnection", 'String'>
    readonly integrationId: FieldRef<"IntegrationConnection", 'String'>
    readonly name: FieldRef<"IntegrationConnection", 'String'>
    readonly status: FieldRef<"IntegrationConnection", 'ConnectionStatus'>
    readonly secretId: FieldRef<"IntegrationConnection", 'String'>
    readonly config: FieldRef<"IntegrationConnection", 'Json'>
    readonly lastSyncAt: FieldRef<"IntegrationConnection", 'DateTime'>
    readonly lastErrorMessage: FieldRef<"IntegrationConnection", 'String'>
    readonly syncFrequencyMinutes: FieldRef<"IntegrationConnection", 'Int'>
    readonly isActive: FieldRef<"IntegrationConnection", 'Boolean'>
    readonly createdAt: FieldRef<"IntegrationConnection", 'DateTime'>
    readonly updatedAt: FieldRef<"IntegrationConnection", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IntegrationConnection findUnique
   */
  export type IntegrationConnectionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationConnection to fetch.
     */
    where: IntegrationConnectionWhereUniqueInput
  }

  /**
   * IntegrationConnection findUniqueOrThrow
   */
  export type IntegrationConnectionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationConnection to fetch.
     */
    where: IntegrationConnectionWhereUniqueInput
  }

  /**
   * IntegrationConnection findFirst
   */
  export type IntegrationConnectionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationConnection to fetch.
     */
    where?: IntegrationConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationConnections to fetch.
     */
    orderBy?: IntegrationConnectionOrderByWithRelationInput | IntegrationConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IntegrationConnections.
     */
    cursor?: IntegrationConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationConnections.
     */
    distinct?: IntegrationConnectionScalarFieldEnum | IntegrationConnectionScalarFieldEnum[]
  }

  /**
   * IntegrationConnection findFirstOrThrow
   */
  export type IntegrationConnectionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationConnection to fetch.
     */
    where?: IntegrationConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationConnections to fetch.
     */
    orderBy?: IntegrationConnectionOrderByWithRelationInput | IntegrationConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IntegrationConnections.
     */
    cursor?: IntegrationConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationConnections.
     */
    distinct?: IntegrationConnectionScalarFieldEnum | IntegrationConnectionScalarFieldEnum[]
  }

  /**
   * IntegrationConnection findMany
   */
  export type IntegrationConnectionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationConnections to fetch.
     */
    where?: IntegrationConnectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationConnections to fetch.
     */
    orderBy?: IntegrationConnectionOrderByWithRelationInput | IntegrationConnectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IntegrationConnections.
     */
    cursor?: IntegrationConnectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationConnections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationConnections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationConnections.
     */
    distinct?: IntegrationConnectionScalarFieldEnum | IntegrationConnectionScalarFieldEnum[]
  }

  /**
   * IntegrationConnection create
   */
  export type IntegrationConnectionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * The data needed to create a IntegrationConnection.
     */
    data: XOR<IntegrationConnectionCreateInput, IntegrationConnectionUncheckedCreateInput>
  }

  /**
   * IntegrationConnection createMany
   */
  export type IntegrationConnectionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IntegrationConnections.
     */
    data: IntegrationConnectionCreateManyInput | IntegrationConnectionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * IntegrationConnection createManyAndReturn
   */
  export type IntegrationConnectionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * The data used to create many IntegrationConnections.
     */
    data: IntegrationConnectionCreateManyInput | IntegrationConnectionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * IntegrationConnection update
   */
  export type IntegrationConnectionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * The data needed to update a IntegrationConnection.
     */
    data: XOR<IntegrationConnectionUpdateInput, IntegrationConnectionUncheckedUpdateInput>
    /**
     * Choose, which IntegrationConnection to update.
     */
    where: IntegrationConnectionWhereUniqueInput
  }

  /**
   * IntegrationConnection updateMany
   */
  export type IntegrationConnectionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IntegrationConnections.
     */
    data: XOR<IntegrationConnectionUpdateManyMutationInput, IntegrationConnectionUncheckedUpdateManyInput>
    /**
     * Filter which IntegrationConnections to update
     */
    where?: IntegrationConnectionWhereInput
    /**
     * Limit how many IntegrationConnections to update.
     */
    limit?: number
  }

  /**
   * IntegrationConnection updateManyAndReturn
   */
  export type IntegrationConnectionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * The data used to update IntegrationConnections.
     */
    data: XOR<IntegrationConnectionUpdateManyMutationInput, IntegrationConnectionUncheckedUpdateManyInput>
    /**
     * Filter which IntegrationConnections to update
     */
    where?: IntegrationConnectionWhereInput
    /**
     * Limit how many IntegrationConnections to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * IntegrationConnection upsert
   */
  export type IntegrationConnectionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * The filter to search for the IntegrationConnection to update in case it exists.
     */
    where: IntegrationConnectionWhereUniqueInput
    /**
     * In case the IntegrationConnection found by the `where` argument doesn't exist, create a new IntegrationConnection with this data.
     */
    create: XOR<IntegrationConnectionCreateInput, IntegrationConnectionUncheckedCreateInput>
    /**
     * In case the IntegrationConnection was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IntegrationConnectionUpdateInput, IntegrationConnectionUncheckedUpdateInput>
  }

  /**
   * IntegrationConnection delete
   */
  export type IntegrationConnectionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    /**
     * Filter which IntegrationConnection to delete.
     */
    where: IntegrationConnectionWhereUniqueInput
  }

  /**
   * IntegrationConnection deleteMany
   */
  export type IntegrationConnectionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IntegrationConnections to delete
     */
    where?: IntegrationConnectionWhereInput
    /**
     * Limit how many IntegrationConnections to delete.
     */
    limit?: number
  }

  /**
   * IntegrationConnection.jobs
   */
  export type IntegrationConnection$jobsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    where?: CollectionJobWhereInput
    orderBy?: CollectionJobOrderByWithRelationInput | CollectionJobOrderByWithRelationInput[]
    cursor?: CollectionJobWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CollectionJobScalarFieldEnum | CollectionJobScalarFieldEnum[]
  }

  /**
   * IntegrationConnection.syncLogs
   */
  export type IntegrationConnection$syncLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    where?: SyncLogWhereInput
    orderBy?: SyncLogOrderByWithRelationInput | SyncLogOrderByWithRelationInput[]
    cursor?: SyncLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SyncLogScalarFieldEnum | SyncLogScalarFieldEnum[]
  }

  /**
   * IntegrationConnection.checks
   */
  export type IntegrationConnection$checksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    where?: IntegrationCheckWhereInput
    orderBy?: IntegrationCheckOrderByWithRelationInput | IntegrationCheckOrderByWithRelationInput[]
    cursor?: IntegrationCheckWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IntegrationCheckScalarFieldEnum | IntegrationCheckScalarFieldEnum[]
  }

  /**
   * IntegrationConnection.checkControls
   */
  export type IntegrationConnection$checkControlsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    where?: IntegrationCheckControlWhereInput
    orderBy?: IntegrationCheckControlOrderByWithRelationInput | IntegrationCheckControlOrderByWithRelationInput[]
    cursor?: IntegrationCheckControlWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IntegrationCheckControlScalarFieldEnum | IntegrationCheckControlScalarFieldEnum[]
  }

  /**
   * IntegrationConnection.checkResults
   */
  export type IntegrationConnection$checkResultsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    where?: IntegrationCheckResultWhereInput
    orderBy?: IntegrationCheckResultOrderByWithRelationInput | IntegrationCheckResultOrderByWithRelationInput[]
    cursor?: IntegrationCheckResultWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IntegrationCheckResultScalarFieldEnum | IntegrationCheckResultScalarFieldEnum[]
  }

  /**
   * IntegrationConnection without action
   */
  export type IntegrationConnectionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
  }


  /**
   * Model IntegrationCheck
   */

  export type AggregateIntegrationCheck = {
    _count: IntegrationCheckCountAggregateOutputType | null
    _min: IntegrationCheckMinAggregateOutputType | null
    _max: IntegrationCheckMaxAggregateOutputType | null
  }

  export type IntegrationCheckMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    connectionId: string | null
    integrationId: string | null
    manifestKey: string | null
    title: string | null
    description: string | null
    severity: $Enums.IntegrationCheckSeverity | null
    schedule: string | null
    isEnabled: boolean | null
    runner: string | null
    aiPrompt: string | null
    aiModel: string | null
    lastStatus: $Enums.IntegrationCheckStatus | null
    lastRunAt: Date | null
    lastEvidenceId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type IntegrationCheckMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    connectionId: string | null
    integrationId: string | null
    manifestKey: string | null
    title: string | null
    description: string | null
    severity: $Enums.IntegrationCheckSeverity | null
    schedule: string | null
    isEnabled: boolean | null
    runner: string | null
    aiPrompt: string | null
    aiModel: string | null
    lastStatus: $Enums.IntegrationCheckStatus | null
    lastRunAt: Date | null
    lastEvidenceId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type IntegrationCheckCountAggregateOutputType = {
    id: number
    tenantId: number
    connectionId: number
    integrationId: number
    manifestKey: number
    title: number
    description: number
    severity: number
    schedule: number
    isEnabled: number
    runner: number
    spec: number
    aiPrompt: number
    aiModel: number
    lastStatus: number
    lastRunAt: number
    lastEvidenceId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type IntegrationCheckMinAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    integrationId?: true
    manifestKey?: true
    title?: true
    description?: true
    severity?: true
    schedule?: true
    isEnabled?: true
    runner?: true
    aiPrompt?: true
    aiModel?: true
    lastStatus?: true
    lastRunAt?: true
    lastEvidenceId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type IntegrationCheckMaxAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    integrationId?: true
    manifestKey?: true
    title?: true
    description?: true
    severity?: true
    schedule?: true
    isEnabled?: true
    runner?: true
    aiPrompt?: true
    aiModel?: true
    lastStatus?: true
    lastRunAt?: true
    lastEvidenceId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type IntegrationCheckCountAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    integrationId?: true
    manifestKey?: true
    title?: true
    description?: true
    severity?: true
    schedule?: true
    isEnabled?: true
    runner?: true
    spec?: true
    aiPrompt?: true
    aiModel?: true
    lastStatus?: true
    lastRunAt?: true
    lastEvidenceId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type IntegrationCheckAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IntegrationCheck to aggregate.
     */
    where?: IntegrationCheckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationChecks to fetch.
     */
    orderBy?: IntegrationCheckOrderByWithRelationInput | IntegrationCheckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IntegrationCheckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationChecks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationChecks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IntegrationChecks
    **/
    _count?: true | IntegrationCheckCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IntegrationCheckMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IntegrationCheckMaxAggregateInputType
  }

  export type GetIntegrationCheckAggregateType<T extends IntegrationCheckAggregateArgs> = {
        [P in keyof T & keyof AggregateIntegrationCheck]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIntegrationCheck[P]>
      : GetScalarType<T[P], AggregateIntegrationCheck[P]>
  }




  export type IntegrationCheckGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckWhereInput
    orderBy?: IntegrationCheckOrderByWithAggregationInput | IntegrationCheckOrderByWithAggregationInput[]
    by: IntegrationCheckScalarFieldEnum[] | IntegrationCheckScalarFieldEnum
    having?: IntegrationCheckScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IntegrationCheckCountAggregateInputType | true
    _min?: IntegrationCheckMinAggregateInputType
    _max?: IntegrationCheckMaxAggregateInputType
  }

  export type IntegrationCheckGroupByOutputType = {
    id: string
    tenantId: string
    connectionId: string
    integrationId: string
    manifestKey: string
    title: string
    description: string | null
    severity: $Enums.IntegrationCheckSeverity
    schedule: string
    isEnabled: boolean
    runner: string
    spec: JsonValue | null
    aiPrompt: string | null
    aiModel: string | null
    lastStatus: $Enums.IntegrationCheckStatus
    lastRunAt: Date | null
    lastEvidenceId: string | null
    createdAt: Date
    updatedAt: Date
    _count: IntegrationCheckCountAggregateOutputType | null
    _min: IntegrationCheckMinAggregateOutputType | null
    _max: IntegrationCheckMaxAggregateOutputType | null
  }

  type GetIntegrationCheckGroupByPayload<T extends IntegrationCheckGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IntegrationCheckGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IntegrationCheckGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IntegrationCheckGroupByOutputType[P]>
            : GetScalarType<T[P], IntegrationCheckGroupByOutputType[P]>
        }
      >
    >


  export type IntegrationCheckSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    integrationId?: boolean
    manifestKey?: boolean
    title?: boolean
    description?: boolean
    severity?: boolean
    schedule?: boolean
    isEnabled?: boolean
    runner?: boolean
    spec?: boolean
    aiPrompt?: boolean
    aiModel?: boolean
    lastStatus?: boolean
    lastRunAt?: boolean
    lastEvidenceId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
    controls?: boolean | IntegrationCheck$controlsArgs<ExtArgs>
    results?: boolean | IntegrationCheck$resultsArgs<ExtArgs>
    _count?: boolean | IntegrationCheckCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheck"]>

  export type IntegrationCheckSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    integrationId?: boolean
    manifestKey?: boolean
    title?: boolean
    description?: boolean
    severity?: boolean
    schedule?: boolean
    isEnabled?: boolean
    runner?: boolean
    spec?: boolean
    aiPrompt?: boolean
    aiModel?: boolean
    lastStatus?: boolean
    lastRunAt?: boolean
    lastEvidenceId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheck"]>

  export type IntegrationCheckSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    integrationId?: boolean
    manifestKey?: boolean
    title?: boolean
    description?: boolean
    severity?: boolean
    schedule?: boolean
    isEnabled?: boolean
    runner?: boolean
    spec?: boolean
    aiPrompt?: boolean
    aiModel?: boolean
    lastStatus?: boolean
    lastRunAt?: boolean
    lastEvidenceId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheck"]>

  export type IntegrationCheckSelectScalar = {
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    integrationId?: boolean
    manifestKey?: boolean
    title?: boolean
    description?: boolean
    severity?: boolean
    schedule?: boolean
    isEnabled?: boolean
    runner?: boolean
    spec?: boolean
    aiPrompt?: boolean
    aiModel?: boolean
    lastStatus?: boolean
    lastRunAt?: boolean
    lastEvidenceId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type IntegrationCheckOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "connectionId" | "integrationId" | "manifestKey" | "title" | "description" | "severity" | "schedule" | "isEnabled" | "runner" | "spec" | "aiPrompt" | "aiModel" | "lastStatus" | "lastRunAt" | "lastEvidenceId" | "createdAt" | "updatedAt", ExtArgs["result"]["integrationCheck"]>
  export type IntegrationCheckInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
    controls?: boolean | IntegrationCheck$controlsArgs<ExtArgs>
    results?: boolean | IntegrationCheck$resultsArgs<ExtArgs>
    _count?: boolean | IntegrationCheckCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type IntegrationCheckIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
  }
  export type IntegrationCheckIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
    integration?: boolean | IntegrationDefaultArgs<ExtArgs>
  }

  export type $IntegrationCheckPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IntegrationCheck"
    objects: {
      connection: Prisma.$IntegrationConnectionPayload<ExtArgs>
      integration: Prisma.$IntegrationPayload<ExtArgs>
      controls: Prisma.$IntegrationCheckControlPayload<ExtArgs>[]
      results: Prisma.$IntegrationCheckResultPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      connectionId: string
      integrationId: string
      manifestKey: string
      title: string
      description: string | null
      severity: $Enums.IntegrationCheckSeverity
      schedule: string
      isEnabled: boolean
      runner: string
      spec: Prisma.JsonValue | null
      aiPrompt: string | null
      aiModel: string | null
      lastStatus: $Enums.IntegrationCheckStatus
      lastRunAt: Date | null
      lastEvidenceId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["integrationCheck"]>
    composites: {}
  }

  type IntegrationCheckGetPayload<S extends boolean | null | undefined | IntegrationCheckDefaultArgs> = $Result.GetResult<Prisma.$IntegrationCheckPayload, S>

  type IntegrationCheckCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IntegrationCheckFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IntegrationCheckCountAggregateInputType | true
    }

  export interface IntegrationCheckDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IntegrationCheck'], meta: { name: 'IntegrationCheck' } }
    /**
     * Find zero or one IntegrationCheck that matches the filter.
     * @param {IntegrationCheckFindUniqueArgs} args - Arguments to find a IntegrationCheck
     * @example
     * // Get one IntegrationCheck
     * const integrationCheck = await prisma.integrationCheck.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IntegrationCheckFindUniqueArgs>(args: SelectSubset<T, IntegrationCheckFindUniqueArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IntegrationCheck that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IntegrationCheckFindUniqueOrThrowArgs} args - Arguments to find a IntegrationCheck
     * @example
     * // Get one IntegrationCheck
     * const integrationCheck = await prisma.integrationCheck.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IntegrationCheckFindUniqueOrThrowArgs>(args: SelectSubset<T, IntegrationCheckFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IntegrationCheck that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckFindFirstArgs} args - Arguments to find a IntegrationCheck
     * @example
     * // Get one IntegrationCheck
     * const integrationCheck = await prisma.integrationCheck.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IntegrationCheckFindFirstArgs>(args?: SelectSubset<T, IntegrationCheckFindFirstArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IntegrationCheck that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckFindFirstOrThrowArgs} args - Arguments to find a IntegrationCheck
     * @example
     * // Get one IntegrationCheck
     * const integrationCheck = await prisma.integrationCheck.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IntegrationCheckFindFirstOrThrowArgs>(args?: SelectSubset<T, IntegrationCheckFindFirstOrThrowArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IntegrationChecks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IntegrationChecks
     * const integrationChecks = await prisma.integrationCheck.findMany()
     * 
     * // Get first 10 IntegrationChecks
     * const integrationChecks = await prisma.integrationCheck.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const integrationCheckWithIdOnly = await prisma.integrationCheck.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IntegrationCheckFindManyArgs>(args?: SelectSubset<T, IntegrationCheckFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IntegrationCheck.
     * @param {IntegrationCheckCreateArgs} args - Arguments to create a IntegrationCheck.
     * @example
     * // Create one IntegrationCheck
     * const IntegrationCheck = await prisma.integrationCheck.create({
     *   data: {
     *     // ... data to create a IntegrationCheck
     *   }
     * })
     * 
     */
    create<T extends IntegrationCheckCreateArgs>(args: SelectSubset<T, IntegrationCheckCreateArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IntegrationChecks.
     * @param {IntegrationCheckCreateManyArgs} args - Arguments to create many IntegrationChecks.
     * @example
     * // Create many IntegrationChecks
     * const integrationCheck = await prisma.integrationCheck.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IntegrationCheckCreateManyArgs>(args?: SelectSubset<T, IntegrationCheckCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IntegrationChecks and returns the data saved in the database.
     * @param {IntegrationCheckCreateManyAndReturnArgs} args - Arguments to create many IntegrationChecks.
     * @example
     * // Create many IntegrationChecks
     * const integrationCheck = await prisma.integrationCheck.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IntegrationChecks and only return the `id`
     * const integrationCheckWithIdOnly = await prisma.integrationCheck.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IntegrationCheckCreateManyAndReturnArgs>(args?: SelectSubset<T, IntegrationCheckCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IntegrationCheck.
     * @param {IntegrationCheckDeleteArgs} args - Arguments to delete one IntegrationCheck.
     * @example
     * // Delete one IntegrationCheck
     * const IntegrationCheck = await prisma.integrationCheck.delete({
     *   where: {
     *     // ... filter to delete one IntegrationCheck
     *   }
     * })
     * 
     */
    delete<T extends IntegrationCheckDeleteArgs>(args: SelectSubset<T, IntegrationCheckDeleteArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IntegrationCheck.
     * @param {IntegrationCheckUpdateArgs} args - Arguments to update one IntegrationCheck.
     * @example
     * // Update one IntegrationCheck
     * const integrationCheck = await prisma.integrationCheck.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IntegrationCheckUpdateArgs>(args: SelectSubset<T, IntegrationCheckUpdateArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IntegrationChecks.
     * @param {IntegrationCheckDeleteManyArgs} args - Arguments to filter IntegrationChecks to delete.
     * @example
     * // Delete a few IntegrationChecks
     * const { count } = await prisma.integrationCheck.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IntegrationCheckDeleteManyArgs>(args?: SelectSubset<T, IntegrationCheckDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IntegrationChecks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IntegrationChecks
     * const integrationCheck = await prisma.integrationCheck.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IntegrationCheckUpdateManyArgs>(args: SelectSubset<T, IntegrationCheckUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IntegrationChecks and returns the data updated in the database.
     * @param {IntegrationCheckUpdateManyAndReturnArgs} args - Arguments to update many IntegrationChecks.
     * @example
     * // Update many IntegrationChecks
     * const integrationCheck = await prisma.integrationCheck.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IntegrationChecks and only return the `id`
     * const integrationCheckWithIdOnly = await prisma.integrationCheck.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IntegrationCheckUpdateManyAndReturnArgs>(args: SelectSubset<T, IntegrationCheckUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IntegrationCheck.
     * @param {IntegrationCheckUpsertArgs} args - Arguments to update or create a IntegrationCheck.
     * @example
     * // Update or create a IntegrationCheck
     * const integrationCheck = await prisma.integrationCheck.upsert({
     *   create: {
     *     // ... data to create a IntegrationCheck
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IntegrationCheck we want to update
     *   }
     * })
     */
    upsert<T extends IntegrationCheckUpsertArgs>(args: SelectSubset<T, IntegrationCheckUpsertArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IntegrationChecks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckCountArgs} args - Arguments to filter IntegrationChecks to count.
     * @example
     * // Count the number of IntegrationChecks
     * const count = await prisma.integrationCheck.count({
     *   where: {
     *     // ... the filter for the IntegrationChecks we want to count
     *   }
     * })
    **/
    count<T extends IntegrationCheckCountArgs>(
      args?: Subset<T, IntegrationCheckCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IntegrationCheckCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IntegrationCheck.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IntegrationCheckAggregateArgs>(args: Subset<T, IntegrationCheckAggregateArgs>): Prisma.PrismaPromise<GetIntegrationCheckAggregateType<T>>

    /**
     * Group by IntegrationCheck.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IntegrationCheckGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IntegrationCheckGroupByArgs['orderBy'] }
        : { orderBy?: IntegrationCheckGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IntegrationCheckGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIntegrationCheckGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IntegrationCheck model
   */
  readonly fields: IntegrationCheckFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IntegrationCheck.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IntegrationCheckClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    connection<T extends IntegrationConnectionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnectionDefaultArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    integration<T extends IntegrationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationDefaultArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    controls<T extends IntegrationCheck$controlsArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationCheck$controlsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    results<T extends IntegrationCheck$resultsArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationCheck$resultsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IntegrationCheck model
   */
  interface IntegrationCheckFieldRefs {
    readonly id: FieldRef<"IntegrationCheck", 'String'>
    readonly tenantId: FieldRef<"IntegrationCheck", 'String'>
    readonly connectionId: FieldRef<"IntegrationCheck", 'String'>
    readonly integrationId: FieldRef<"IntegrationCheck", 'String'>
    readonly manifestKey: FieldRef<"IntegrationCheck", 'String'>
    readonly title: FieldRef<"IntegrationCheck", 'String'>
    readonly description: FieldRef<"IntegrationCheck", 'String'>
    readonly severity: FieldRef<"IntegrationCheck", 'IntegrationCheckSeverity'>
    readonly schedule: FieldRef<"IntegrationCheck", 'String'>
    readonly isEnabled: FieldRef<"IntegrationCheck", 'Boolean'>
    readonly runner: FieldRef<"IntegrationCheck", 'String'>
    readonly spec: FieldRef<"IntegrationCheck", 'Json'>
    readonly aiPrompt: FieldRef<"IntegrationCheck", 'String'>
    readonly aiModel: FieldRef<"IntegrationCheck", 'String'>
    readonly lastStatus: FieldRef<"IntegrationCheck", 'IntegrationCheckStatus'>
    readonly lastRunAt: FieldRef<"IntegrationCheck", 'DateTime'>
    readonly lastEvidenceId: FieldRef<"IntegrationCheck", 'String'>
    readonly createdAt: FieldRef<"IntegrationCheck", 'DateTime'>
    readonly updatedAt: FieldRef<"IntegrationCheck", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IntegrationCheck findUnique
   */
  export type IntegrationCheckFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheck to fetch.
     */
    where: IntegrationCheckWhereUniqueInput
  }

  /**
   * IntegrationCheck findUniqueOrThrow
   */
  export type IntegrationCheckFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheck to fetch.
     */
    where: IntegrationCheckWhereUniqueInput
  }

  /**
   * IntegrationCheck findFirst
   */
  export type IntegrationCheckFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheck to fetch.
     */
    where?: IntegrationCheckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationChecks to fetch.
     */
    orderBy?: IntegrationCheckOrderByWithRelationInput | IntegrationCheckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IntegrationChecks.
     */
    cursor?: IntegrationCheckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationChecks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationChecks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationChecks.
     */
    distinct?: IntegrationCheckScalarFieldEnum | IntegrationCheckScalarFieldEnum[]
  }

  /**
   * IntegrationCheck findFirstOrThrow
   */
  export type IntegrationCheckFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheck to fetch.
     */
    where?: IntegrationCheckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationChecks to fetch.
     */
    orderBy?: IntegrationCheckOrderByWithRelationInput | IntegrationCheckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IntegrationChecks.
     */
    cursor?: IntegrationCheckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationChecks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationChecks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationChecks.
     */
    distinct?: IntegrationCheckScalarFieldEnum | IntegrationCheckScalarFieldEnum[]
  }

  /**
   * IntegrationCheck findMany
   */
  export type IntegrationCheckFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationChecks to fetch.
     */
    where?: IntegrationCheckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationChecks to fetch.
     */
    orderBy?: IntegrationCheckOrderByWithRelationInput | IntegrationCheckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IntegrationChecks.
     */
    cursor?: IntegrationCheckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationChecks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationChecks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationChecks.
     */
    distinct?: IntegrationCheckScalarFieldEnum | IntegrationCheckScalarFieldEnum[]
  }

  /**
   * IntegrationCheck create
   */
  export type IntegrationCheckCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * The data needed to create a IntegrationCheck.
     */
    data: XOR<IntegrationCheckCreateInput, IntegrationCheckUncheckedCreateInput>
  }

  /**
   * IntegrationCheck createMany
   */
  export type IntegrationCheckCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IntegrationChecks.
     */
    data: IntegrationCheckCreateManyInput | IntegrationCheckCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * IntegrationCheck createManyAndReturn
   */
  export type IntegrationCheckCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * The data used to create many IntegrationChecks.
     */
    data: IntegrationCheckCreateManyInput | IntegrationCheckCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * IntegrationCheck update
   */
  export type IntegrationCheckUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * The data needed to update a IntegrationCheck.
     */
    data: XOR<IntegrationCheckUpdateInput, IntegrationCheckUncheckedUpdateInput>
    /**
     * Choose, which IntegrationCheck to update.
     */
    where: IntegrationCheckWhereUniqueInput
  }

  /**
   * IntegrationCheck updateMany
   */
  export type IntegrationCheckUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IntegrationChecks.
     */
    data: XOR<IntegrationCheckUpdateManyMutationInput, IntegrationCheckUncheckedUpdateManyInput>
    /**
     * Filter which IntegrationChecks to update
     */
    where?: IntegrationCheckWhereInput
    /**
     * Limit how many IntegrationChecks to update.
     */
    limit?: number
  }

  /**
   * IntegrationCheck updateManyAndReturn
   */
  export type IntegrationCheckUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * The data used to update IntegrationChecks.
     */
    data: XOR<IntegrationCheckUpdateManyMutationInput, IntegrationCheckUncheckedUpdateManyInput>
    /**
     * Filter which IntegrationChecks to update
     */
    where?: IntegrationCheckWhereInput
    /**
     * Limit how many IntegrationChecks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * IntegrationCheck upsert
   */
  export type IntegrationCheckUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * The filter to search for the IntegrationCheck to update in case it exists.
     */
    where: IntegrationCheckWhereUniqueInput
    /**
     * In case the IntegrationCheck found by the `where` argument doesn't exist, create a new IntegrationCheck with this data.
     */
    create: XOR<IntegrationCheckCreateInput, IntegrationCheckUncheckedCreateInput>
    /**
     * In case the IntegrationCheck was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IntegrationCheckUpdateInput, IntegrationCheckUncheckedUpdateInput>
  }

  /**
   * IntegrationCheck delete
   */
  export type IntegrationCheckDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    /**
     * Filter which IntegrationCheck to delete.
     */
    where: IntegrationCheckWhereUniqueInput
  }

  /**
   * IntegrationCheck deleteMany
   */
  export type IntegrationCheckDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IntegrationChecks to delete
     */
    where?: IntegrationCheckWhereInput
    /**
     * Limit how many IntegrationChecks to delete.
     */
    limit?: number
  }

  /**
   * IntegrationCheck.controls
   */
  export type IntegrationCheck$controlsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    where?: IntegrationCheckControlWhereInput
    orderBy?: IntegrationCheckControlOrderByWithRelationInput | IntegrationCheckControlOrderByWithRelationInput[]
    cursor?: IntegrationCheckControlWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IntegrationCheckControlScalarFieldEnum | IntegrationCheckControlScalarFieldEnum[]
  }

  /**
   * IntegrationCheck.results
   */
  export type IntegrationCheck$resultsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    where?: IntegrationCheckResultWhereInput
    orderBy?: IntegrationCheckResultOrderByWithRelationInput | IntegrationCheckResultOrderByWithRelationInput[]
    cursor?: IntegrationCheckResultWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IntegrationCheckResultScalarFieldEnum | IntegrationCheckResultScalarFieldEnum[]
  }

  /**
   * IntegrationCheck without action
   */
  export type IntegrationCheckDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
  }


  /**
   * Model IntegrationCheckControl
   */

  export type AggregateIntegrationCheckControl = {
    _count: IntegrationCheckControlCountAggregateOutputType | null
    _min: IntegrationCheckControlMinAggregateOutputType | null
    _max: IntegrationCheckControlMaxAggregateOutputType | null
  }

  export type IntegrationCheckControlMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    integrationCheckId: string | null
    connectionId: string | null
    controlId: string | null
    createdAt: Date | null
  }

  export type IntegrationCheckControlMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    integrationCheckId: string | null
    connectionId: string | null
    controlId: string | null
    createdAt: Date | null
  }

  export type IntegrationCheckControlCountAggregateOutputType = {
    id: number
    tenantId: number
    integrationCheckId: number
    connectionId: number
    controlId: number
    createdAt: number
    _all: number
  }


  export type IntegrationCheckControlMinAggregateInputType = {
    id?: true
    tenantId?: true
    integrationCheckId?: true
    connectionId?: true
    controlId?: true
    createdAt?: true
  }

  export type IntegrationCheckControlMaxAggregateInputType = {
    id?: true
    tenantId?: true
    integrationCheckId?: true
    connectionId?: true
    controlId?: true
    createdAt?: true
  }

  export type IntegrationCheckControlCountAggregateInputType = {
    id?: true
    tenantId?: true
    integrationCheckId?: true
    connectionId?: true
    controlId?: true
    createdAt?: true
    _all?: true
  }

  export type IntegrationCheckControlAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IntegrationCheckControl to aggregate.
     */
    where?: IntegrationCheckControlWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationCheckControls to fetch.
     */
    orderBy?: IntegrationCheckControlOrderByWithRelationInput | IntegrationCheckControlOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IntegrationCheckControlWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationCheckControls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationCheckControls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IntegrationCheckControls
    **/
    _count?: true | IntegrationCheckControlCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IntegrationCheckControlMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IntegrationCheckControlMaxAggregateInputType
  }

  export type GetIntegrationCheckControlAggregateType<T extends IntegrationCheckControlAggregateArgs> = {
        [P in keyof T & keyof AggregateIntegrationCheckControl]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIntegrationCheckControl[P]>
      : GetScalarType<T[P], AggregateIntegrationCheckControl[P]>
  }




  export type IntegrationCheckControlGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckControlWhereInput
    orderBy?: IntegrationCheckControlOrderByWithAggregationInput | IntegrationCheckControlOrderByWithAggregationInput[]
    by: IntegrationCheckControlScalarFieldEnum[] | IntegrationCheckControlScalarFieldEnum
    having?: IntegrationCheckControlScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IntegrationCheckControlCountAggregateInputType | true
    _min?: IntegrationCheckControlMinAggregateInputType
    _max?: IntegrationCheckControlMaxAggregateInputType
  }

  export type IntegrationCheckControlGroupByOutputType = {
    id: string
    tenantId: string
    integrationCheckId: string
    connectionId: string
    controlId: string
    createdAt: Date
    _count: IntegrationCheckControlCountAggregateOutputType | null
    _min: IntegrationCheckControlMinAggregateOutputType | null
    _max: IntegrationCheckControlMaxAggregateOutputType | null
  }

  type GetIntegrationCheckControlGroupByPayload<T extends IntegrationCheckControlGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IntegrationCheckControlGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IntegrationCheckControlGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IntegrationCheckControlGroupByOutputType[P]>
            : GetScalarType<T[P], IntegrationCheckControlGroupByOutputType[P]>
        }
      >
    >


  export type IntegrationCheckControlSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationCheckId?: boolean
    connectionId?: boolean
    controlId?: boolean
    createdAt?: boolean
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheckControl"]>

  export type IntegrationCheckControlSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationCheckId?: boolean
    connectionId?: boolean
    controlId?: boolean
    createdAt?: boolean
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheckControl"]>

  export type IntegrationCheckControlSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationCheckId?: boolean
    connectionId?: boolean
    controlId?: boolean
    createdAt?: boolean
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheckControl"]>

  export type IntegrationCheckControlSelectScalar = {
    id?: boolean
    tenantId?: boolean
    integrationCheckId?: boolean
    connectionId?: boolean
    controlId?: boolean
    createdAt?: boolean
  }

  export type IntegrationCheckControlOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "integrationCheckId" | "connectionId" | "controlId" | "createdAt", ExtArgs["result"]["integrationCheckControl"]>
  export type IntegrationCheckControlInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }
  export type IntegrationCheckControlIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }
  export type IntegrationCheckControlIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }

  export type $IntegrationCheckControlPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IntegrationCheckControl"
    objects: {
      integrationCheck: Prisma.$IntegrationCheckPayload<ExtArgs>
      connection: Prisma.$IntegrationConnectionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      integrationCheckId: string
      connectionId: string
      controlId: string
      createdAt: Date
    }, ExtArgs["result"]["integrationCheckControl"]>
    composites: {}
  }

  type IntegrationCheckControlGetPayload<S extends boolean | null | undefined | IntegrationCheckControlDefaultArgs> = $Result.GetResult<Prisma.$IntegrationCheckControlPayload, S>

  type IntegrationCheckControlCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IntegrationCheckControlFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IntegrationCheckControlCountAggregateInputType | true
    }

  export interface IntegrationCheckControlDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IntegrationCheckControl'], meta: { name: 'IntegrationCheckControl' } }
    /**
     * Find zero or one IntegrationCheckControl that matches the filter.
     * @param {IntegrationCheckControlFindUniqueArgs} args - Arguments to find a IntegrationCheckControl
     * @example
     * // Get one IntegrationCheckControl
     * const integrationCheckControl = await prisma.integrationCheckControl.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IntegrationCheckControlFindUniqueArgs>(args: SelectSubset<T, IntegrationCheckControlFindUniqueArgs<ExtArgs>>): Prisma__IntegrationCheckControlClient<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IntegrationCheckControl that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IntegrationCheckControlFindUniqueOrThrowArgs} args - Arguments to find a IntegrationCheckControl
     * @example
     * // Get one IntegrationCheckControl
     * const integrationCheckControl = await prisma.integrationCheckControl.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IntegrationCheckControlFindUniqueOrThrowArgs>(args: SelectSubset<T, IntegrationCheckControlFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IntegrationCheckControlClient<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IntegrationCheckControl that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckControlFindFirstArgs} args - Arguments to find a IntegrationCheckControl
     * @example
     * // Get one IntegrationCheckControl
     * const integrationCheckControl = await prisma.integrationCheckControl.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IntegrationCheckControlFindFirstArgs>(args?: SelectSubset<T, IntegrationCheckControlFindFirstArgs<ExtArgs>>): Prisma__IntegrationCheckControlClient<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IntegrationCheckControl that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckControlFindFirstOrThrowArgs} args - Arguments to find a IntegrationCheckControl
     * @example
     * // Get one IntegrationCheckControl
     * const integrationCheckControl = await prisma.integrationCheckControl.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IntegrationCheckControlFindFirstOrThrowArgs>(args?: SelectSubset<T, IntegrationCheckControlFindFirstOrThrowArgs<ExtArgs>>): Prisma__IntegrationCheckControlClient<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IntegrationCheckControls that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckControlFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IntegrationCheckControls
     * const integrationCheckControls = await prisma.integrationCheckControl.findMany()
     * 
     * // Get first 10 IntegrationCheckControls
     * const integrationCheckControls = await prisma.integrationCheckControl.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const integrationCheckControlWithIdOnly = await prisma.integrationCheckControl.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IntegrationCheckControlFindManyArgs>(args?: SelectSubset<T, IntegrationCheckControlFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IntegrationCheckControl.
     * @param {IntegrationCheckControlCreateArgs} args - Arguments to create a IntegrationCheckControl.
     * @example
     * // Create one IntegrationCheckControl
     * const IntegrationCheckControl = await prisma.integrationCheckControl.create({
     *   data: {
     *     // ... data to create a IntegrationCheckControl
     *   }
     * })
     * 
     */
    create<T extends IntegrationCheckControlCreateArgs>(args: SelectSubset<T, IntegrationCheckControlCreateArgs<ExtArgs>>): Prisma__IntegrationCheckControlClient<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IntegrationCheckControls.
     * @param {IntegrationCheckControlCreateManyArgs} args - Arguments to create many IntegrationCheckControls.
     * @example
     * // Create many IntegrationCheckControls
     * const integrationCheckControl = await prisma.integrationCheckControl.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IntegrationCheckControlCreateManyArgs>(args?: SelectSubset<T, IntegrationCheckControlCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IntegrationCheckControls and returns the data saved in the database.
     * @param {IntegrationCheckControlCreateManyAndReturnArgs} args - Arguments to create many IntegrationCheckControls.
     * @example
     * // Create many IntegrationCheckControls
     * const integrationCheckControl = await prisma.integrationCheckControl.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IntegrationCheckControls and only return the `id`
     * const integrationCheckControlWithIdOnly = await prisma.integrationCheckControl.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IntegrationCheckControlCreateManyAndReturnArgs>(args?: SelectSubset<T, IntegrationCheckControlCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IntegrationCheckControl.
     * @param {IntegrationCheckControlDeleteArgs} args - Arguments to delete one IntegrationCheckControl.
     * @example
     * // Delete one IntegrationCheckControl
     * const IntegrationCheckControl = await prisma.integrationCheckControl.delete({
     *   where: {
     *     // ... filter to delete one IntegrationCheckControl
     *   }
     * })
     * 
     */
    delete<T extends IntegrationCheckControlDeleteArgs>(args: SelectSubset<T, IntegrationCheckControlDeleteArgs<ExtArgs>>): Prisma__IntegrationCheckControlClient<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IntegrationCheckControl.
     * @param {IntegrationCheckControlUpdateArgs} args - Arguments to update one IntegrationCheckControl.
     * @example
     * // Update one IntegrationCheckControl
     * const integrationCheckControl = await prisma.integrationCheckControl.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IntegrationCheckControlUpdateArgs>(args: SelectSubset<T, IntegrationCheckControlUpdateArgs<ExtArgs>>): Prisma__IntegrationCheckControlClient<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IntegrationCheckControls.
     * @param {IntegrationCheckControlDeleteManyArgs} args - Arguments to filter IntegrationCheckControls to delete.
     * @example
     * // Delete a few IntegrationCheckControls
     * const { count } = await prisma.integrationCheckControl.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IntegrationCheckControlDeleteManyArgs>(args?: SelectSubset<T, IntegrationCheckControlDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IntegrationCheckControls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckControlUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IntegrationCheckControls
     * const integrationCheckControl = await prisma.integrationCheckControl.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IntegrationCheckControlUpdateManyArgs>(args: SelectSubset<T, IntegrationCheckControlUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IntegrationCheckControls and returns the data updated in the database.
     * @param {IntegrationCheckControlUpdateManyAndReturnArgs} args - Arguments to update many IntegrationCheckControls.
     * @example
     * // Update many IntegrationCheckControls
     * const integrationCheckControl = await prisma.integrationCheckControl.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IntegrationCheckControls and only return the `id`
     * const integrationCheckControlWithIdOnly = await prisma.integrationCheckControl.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IntegrationCheckControlUpdateManyAndReturnArgs>(args: SelectSubset<T, IntegrationCheckControlUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IntegrationCheckControl.
     * @param {IntegrationCheckControlUpsertArgs} args - Arguments to update or create a IntegrationCheckControl.
     * @example
     * // Update or create a IntegrationCheckControl
     * const integrationCheckControl = await prisma.integrationCheckControl.upsert({
     *   create: {
     *     // ... data to create a IntegrationCheckControl
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IntegrationCheckControl we want to update
     *   }
     * })
     */
    upsert<T extends IntegrationCheckControlUpsertArgs>(args: SelectSubset<T, IntegrationCheckControlUpsertArgs<ExtArgs>>): Prisma__IntegrationCheckControlClient<$Result.GetResult<Prisma.$IntegrationCheckControlPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IntegrationCheckControls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckControlCountArgs} args - Arguments to filter IntegrationCheckControls to count.
     * @example
     * // Count the number of IntegrationCheckControls
     * const count = await prisma.integrationCheckControl.count({
     *   where: {
     *     // ... the filter for the IntegrationCheckControls we want to count
     *   }
     * })
    **/
    count<T extends IntegrationCheckControlCountArgs>(
      args?: Subset<T, IntegrationCheckControlCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IntegrationCheckControlCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IntegrationCheckControl.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckControlAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IntegrationCheckControlAggregateArgs>(args: Subset<T, IntegrationCheckControlAggregateArgs>): Prisma.PrismaPromise<GetIntegrationCheckControlAggregateType<T>>

    /**
     * Group by IntegrationCheckControl.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckControlGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IntegrationCheckControlGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IntegrationCheckControlGroupByArgs['orderBy'] }
        : { orderBy?: IntegrationCheckControlGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IntegrationCheckControlGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIntegrationCheckControlGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IntegrationCheckControl model
   */
  readonly fields: IntegrationCheckControlFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IntegrationCheckControl.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IntegrationCheckControlClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    integrationCheck<T extends IntegrationCheckDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationCheckDefaultArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    connection<T extends IntegrationConnectionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnectionDefaultArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IntegrationCheckControl model
   */
  interface IntegrationCheckControlFieldRefs {
    readonly id: FieldRef<"IntegrationCheckControl", 'String'>
    readonly tenantId: FieldRef<"IntegrationCheckControl", 'String'>
    readonly integrationCheckId: FieldRef<"IntegrationCheckControl", 'String'>
    readonly connectionId: FieldRef<"IntegrationCheckControl", 'String'>
    readonly controlId: FieldRef<"IntegrationCheckControl", 'String'>
    readonly createdAt: FieldRef<"IntegrationCheckControl", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IntegrationCheckControl findUnique
   */
  export type IntegrationCheckControlFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckControl to fetch.
     */
    where: IntegrationCheckControlWhereUniqueInput
  }

  /**
   * IntegrationCheckControl findUniqueOrThrow
   */
  export type IntegrationCheckControlFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckControl to fetch.
     */
    where: IntegrationCheckControlWhereUniqueInput
  }

  /**
   * IntegrationCheckControl findFirst
   */
  export type IntegrationCheckControlFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckControl to fetch.
     */
    where?: IntegrationCheckControlWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationCheckControls to fetch.
     */
    orderBy?: IntegrationCheckControlOrderByWithRelationInput | IntegrationCheckControlOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IntegrationCheckControls.
     */
    cursor?: IntegrationCheckControlWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationCheckControls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationCheckControls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationCheckControls.
     */
    distinct?: IntegrationCheckControlScalarFieldEnum | IntegrationCheckControlScalarFieldEnum[]
  }

  /**
   * IntegrationCheckControl findFirstOrThrow
   */
  export type IntegrationCheckControlFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckControl to fetch.
     */
    where?: IntegrationCheckControlWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationCheckControls to fetch.
     */
    orderBy?: IntegrationCheckControlOrderByWithRelationInput | IntegrationCheckControlOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IntegrationCheckControls.
     */
    cursor?: IntegrationCheckControlWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationCheckControls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationCheckControls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationCheckControls.
     */
    distinct?: IntegrationCheckControlScalarFieldEnum | IntegrationCheckControlScalarFieldEnum[]
  }

  /**
   * IntegrationCheckControl findMany
   */
  export type IntegrationCheckControlFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckControls to fetch.
     */
    where?: IntegrationCheckControlWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationCheckControls to fetch.
     */
    orderBy?: IntegrationCheckControlOrderByWithRelationInput | IntegrationCheckControlOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IntegrationCheckControls.
     */
    cursor?: IntegrationCheckControlWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationCheckControls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationCheckControls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationCheckControls.
     */
    distinct?: IntegrationCheckControlScalarFieldEnum | IntegrationCheckControlScalarFieldEnum[]
  }

  /**
   * IntegrationCheckControl create
   */
  export type IntegrationCheckControlCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * The data needed to create a IntegrationCheckControl.
     */
    data: XOR<IntegrationCheckControlCreateInput, IntegrationCheckControlUncheckedCreateInput>
  }

  /**
   * IntegrationCheckControl createMany
   */
  export type IntegrationCheckControlCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IntegrationCheckControls.
     */
    data: IntegrationCheckControlCreateManyInput | IntegrationCheckControlCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * IntegrationCheckControl createManyAndReturn
   */
  export type IntegrationCheckControlCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * The data used to create many IntegrationCheckControls.
     */
    data: IntegrationCheckControlCreateManyInput | IntegrationCheckControlCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * IntegrationCheckControl update
   */
  export type IntegrationCheckControlUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * The data needed to update a IntegrationCheckControl.
     */
    data: XOR<IntegrationCheckControlUpdateInput, IntegrationCheckControlUncheckedUpdateInput>
    /**
     * Choose, which IntegrationCheckControl to update.
     */
    where: IntegrationCheckControlWhereUniqueInput
  }

  /**
   * IntegrationCheckControl updateMany
   */
  export type IntegrationCheckControlUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IntegrationCheckControls.
     */
    data: XOR<IntegrationCheckControlUpdateManyMutationInput, IntegrationCheckControlUncheckedUpdateManyInput>
    /**
     * Filter which IntegrationCheckControls to update
     */
    where?: IntegrationCheckControlWhereInput
    /**
     * Limit how many IntegrationCheckControls to update.
     */
    limit?: number
  }

  /**
   * IntegrationCheckControl updateManyAndReturn
   */
  export type IntegrationCheckControlUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * The data used to update IntegrationCheckControls.
     */
    data: XOR<IntegrationCheckControlUpdateManyMutationInput, IntegrationCheckControlUncheckedUpdateManyInput>
    /**
     * Filter which IntegrationCheckControls to update
     */
    where?: IntegrationCheckControlWhereInput
    /**
     * Limit how many IntegrationCheckControls to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * IntegrationCheckControl upsert
   */
  export type IntegrationCheckControlUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * The filter to search for the IntegrationCheckControl to update in case it exists.
     */
    where: IntegrationCheckControlWhereUniqueInput
    /**
     * In case the IntegrationCheckControl found by the `where` argument doesn't exist, create a new IntegrationCheckControl with this data.
     */
    create: XOR<IntegrationCheckControlCreateInput, IntegrationCheckControlUncheckedCreateInput>
    /**
     * In case the IntegrationCheckControl was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IntegrationCheckControlUpdateInput, IntegrationCheckControlUncheckedUpdateInput>
  }

  /**
   * IntegrationCheckControl delete
   */
  export type IntegrationCheckControlDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
    /**
     * Filter which IntegrationCheckControl to delete.
     */
    where: IntegrationCheckControlWhereUniqueInput
  }

  /**
   * IntegrationCheckControl deleteMany
   */
  export type IntegrationCheckControlDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IntegrationCheckControls to delete
     */
    where?: IntegrationCheckControlWhereInput
    /**
     * Limit how many IntegrationCheckControls to delete.
     */
    limit?: number
  }

  /**
   * IntegrationCheckControl without action
   */
  export type IntegrationCheckControlDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckControl
     */
    select?: IntegrationCheckControlSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckControl
     */
    omit?: IntegrationCheckControlOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckControlInclude<ExtArgs> | null
  }


  /**
   * Model IntegrationCheckResult
   */

  export type AggregateIntegrationCheckResult = {
    _count: IntegrationCheckResultCountAggregateOutputType | null
    _avg: IntegrationCheckResultAvgAggregateOutputType | null
    _sum: IntegrationCheckResultSumAggregateOutputType | null
    _min: IntegrationCheckResultMinAggregateOutputType | null
    _max: IntegrationCheckResultMaxAggregateOutputType | null
  }

  export type IntegrationCheckResultAvgAggregateOutputType = {
    durationMs: number | null
  }

  export type IntegrationCheckResultSumAggregateOutputType = {
    durationMs: number | null
  }

  export type IntegrationCheckResultMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    integrationCheckId: string | null
    connectionId: string | null
    status: $Enums.IntegrationCheckStatus | null
    errorMessage: string | null
    durationMs: number | null
    evidenceId: string | null
    createdAt: Date | null
  }

  export type IntegrationCheckResultMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    integrationCheckId: string | null
    connectionId: string | null
    status: $Enums.IntegrationCheckStatus | null
    errorMessage: string | null
    durationMs: number | null
    evidenceId: string | null
    createdAt: Date | null
  }

  export type IntegrationCheckResultCountAggregateOutputType = {
    id: number
    tenantId: number
    integrationCheckId: number
    connectionId: number
    status: number
    payload: number
    errorMessage: number
    durationMs: number
    evidenceId: number
    createdAt: number
    _all: number
  }


  export type IntegrationCheckResultAvgAggregateInputType = {
    durationMs?: true
  }

  export type IntegrationCheckResultSumAggregateInputType = {
    durationMs?: true
  }

  export type IntegrationCheckResultMinAggregateInputType = {
    id?: true
    tenantId?: true
    integrationCheckId?: true
    connectionId?: true
    status?: true
    errorMessage?: true
    durationMs?: true
    evidenceId?: true
    createdAt?: true
  }

  export type IntegrationCheckResultMaxAggregateInputType = {
    id?: true
    tenantId?: true
    integrationCheckId?: true
    connectionId?: true
    status?: true
    errorMessage?: true
    durationMs?: true
    evidenceId?: true
    createdAt?: true
  }

  export type IntegrationCheckResultCountAggregateInputType = {
    id?: true
    tenantId?: true
    integrationCheckId?: true
    connectionId?: true
    status?: true
    payload?: true
    errorMessage?: true
    durationMs?: true
    evidenceId?: true
    createdAt?: true
    _all?: true
  }

  export type IntegrationCheckResultAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IntegrationCheckResult to aggregate.
     */
    where?: IntegrationCheckResultWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationCheckResults to fetch.
     */
    orderBy?: IntegrationCheckResultOrderByWithRelationInput | IntegrationCheckResultOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IntegrationCheckResultWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationCheckResults from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationCheckResults.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IntegrationCheckResults
    **/
    _count?: true | IntegrationCheckResultCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: IntegrationCheckResultAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: IntegrationCheckResultSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IntegrationCheckResultMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IntegrationCheckResultMaxAggregateInputType
  }

  export type GetIntegrationCheckResultAggregateType<T extends IntegrationCheckResultAggregateArgs> = {
        [P in keyof T & keyof AggregateIntegrationCheckResult]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIntegrationCheckResult[P]>
      : GetScalarType<T[P], AggregateIntegrationCheckResult[P]>
  }




  export type IntegrationCheckResultGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationCheckResultWhereInput
    orderBy?: IntegrationCheckResultOrderByWithAggregationInput | IntegrationCheckResultOrderByWithAggregationInput[]
    by: IntegrationCheckResultScalarFieldEnum[] | IntegrationCheckResultScalarFieldEnum
    having?: IntegrationCheckResultScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IntegrationCheckResultCountAggregateInputType | true
    _avg?: IntegrationCheckResultAvgAggregateInputType
    _sum?: IntegrationCheckResultSumAggregateInputType
    _min?: IntegrationCheckResultMinAggregateInputType
    _max?: IntegrationCheckResultMaxAggregateInputType
  }

  export type IntegrationCheckResultGroupByOutputType = {
    id: string
    tenantId: string
    integrationCheckId: string
    connectionId: string
    status: $Enums.IntegrationCheckStatus
    payload: JsonValue | null
    errorMessage: string | null
    durationMs: number | null
    evidenceId: string | null
    createdAt: Date
    _count: IntegrationCheckResultCountAggregateOutputType | null
    _avg: IntegrationCheckResultAvgAggregateOutputType | null
    _sum: IntegrationCheckResultSumAggregateOutputType | null
    _min: IntegrationCheckResultMinAggregateOutputType | null
    _max: IntegrationCheckResultMaxAggregateOutputType | null
  }

  type GetIntegrationCheckResultGroupByPayload<T extends IntegrationCheckResultGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IntegrationCheckResultGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IntegrationCheckResultGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IntegrationCheckResultGroupByOutputType[P]>
            : GetScalarType<T[P], IntegrationCheckResultGroupByOutputType[P]>
        }
      >
    >


  export type IntegrationCheckResultSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationCheckId?: boolean
    connectionId?: boolean
    status?: boolean
    payload?: boolean
    errorMessage?: boolean
    durationMs?: boolean
    evidenceId?: boolean
    createdAt?: boolean
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheckResult"]>

  export type IntegrationCheckResultSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationCheckId?: boolean
    connectionId?: boolean
    status?: boolean
    payload?: boolean
    errorMessage?: boolean
    durationMs?: boolean
    evidenceId?: boolean
    createdAt?: boolean
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheckResult"]>

  export type IntegrationCheckResultSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    integrationCheckId?: boolean
    connectionId?: boolean
    status?: boolean
    payload?: boolean
    errorMessage?: boolean
    durationMs?: boolean
    evidenceId?: boolean
    createdAt?: boolean
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integrationCheckResult"]>

  export type IntegrationCheckResultSelectScalar = {
    id?: boolean
    tenantId?: boolean
    integrationCheckId?: boolean
    connectionId?: boolean
    status?: boolean
    payload?: boolean
    errorMessage?: boolean
    durationMs?: boolean
    evidenceId?: boolean
    createdAt?: boolean
  }

  export type IntegrationCheckResultOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "integrationCheckId" | "connectionId" | "status" | "payload" | "errorMessage" | "durationMs" | "evidenceId" | "createdAt", ExtArgs["result"]["integrationCheckResult"]>
  export type IntegrationCheckResultInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }
  export type IntegrationCheckResultIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }
  export type IntegrationCheckResultIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    integrationCheck?: boolean | IntegrationCheckDefaultArgs<ExtArgs>
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }

  export type $IntegrationCheckResultPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IntegrationCheckResult"
    objects: {
      integrationCheck: Prisma.$IntegrationCheckPayload<ExtArgs>
      connection: Prisma.$IntegrationConnectionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      integrationCheckId: string
      connectionId: string
      status: $Enums.IntegrationCheckStatus
      payload: Prisma.JsonValue | null
      errorMessage: string | null
      durationMs: number | null
      evidenceId: string | null
      createdAt: Date
    }, ExtArgs["result"]["integrationCheckResult"]>
    composites: {}
  }

  type IntegrationCheckResultGetPayload<S extends boolean | null | undefined | IntegrationCheckResultDefaultArgs> = $Result.GetResult<Prisma.$IntegrationCheckResultPayload, S>

  type IntegrationCheckResultCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IntegrationCheckResultFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IntegrationCheckResultCountAggregateInputType | true
    }

  export interface IntegrationCheckResultDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IntegrationCheckResult'], meta: { name: 'IntegrationCheckResult' } }
    /**
     * Find zero or one IntegrationCheckResult that matches the filter.
     * @param {IntegrationCheckResultFindUniqueArgs} args - Arguments to find a IntegrationCheckResult
     * @example
     * // Get one IntegrationCheckResult
     * const integrationCheckResult = await prisma.integrationCheckResult.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IntegrationCheckResultFindUniqueArgs>(args: SelectSubset<T, IntegrationCheckResultFindUniqueArgs<ExtArgs>>): Prisma__IntegrationCheckResultClient<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IntegrationCheckResult that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IntegrationCheckResultFindUniqueOrThrowArgs} args - Arguments to find a IntegrationCheckResult
     * @example
     * // Get one IntegrationCheckResult
     * const integrationCheckResult = await prisma.integrationCheckResult.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IntegrationCheckResultFindUniqueOrThrowArgs>(args: SelectSubset<T, IntegrationCheckResultFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IntegrationCheckResultClient<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IntegrationCheckResult that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckResultFindFirstArgs} args - Arguments to find a IntegrationCheckResult
     * @example
     * // Get one IntegrationCheckResult
     * const integrationCheckResult = await prisma.integrationCheckResult.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IntegrationCheckResultFindFirstArgs>(args?: SelectSubset<T, IntegrationCheckResultFindFirstArgs<ExtArgs>>): Prisma__IntegrationCheckResultClient<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IntegrationCheckResult that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckResultFindFirstOrThrowArgs} args - Arguments to find a IntegrationCheckResult
     * @example
     * // Get one IntegrationCheckResult
     * const integrationCheckResult = await prisma.integrationCheckResult.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IntegrationCheckResultFindFirstOrThrowArgs>(args?: SelectSubset<T, IntegrationCheckResultFindFirstOrThrowArgs<ExtArgs>>): Prisma__IntegrationCheckResultClient<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IntegrationCheckResults that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckResultFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IntegrationCheckResults
     * const integrationCheckResults = await prisma.integrationCheckResult.findMany()
     * 
     * // Get first 10 IntegrationCheckResults
     * const integrationCheckResults = await prisma.integrationCheckResult.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const integrationCheckResultWithIdOnly = await prisma.integrationCheckResult.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IntegrationCheckResultFindManyArgs>(args?: SelectSubset<T, IntegrationCheckResultFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IntegrationCheckResult.
     * @param {IntegrationCheckResultCreateArgs} args - Arguments to create a IntegrationCheckResult.
     * @example
     * // Create one IntegrationCheckResult
     * const IntegrationCheckResult = await prisma.integrationCheckResult.create({
     *   data: {
     *     // ... data to create a IntegrationCheckResult
     *   }
     * })
     * 
     */
    create<T extends IntegrationCheckResultCreateArgs>(args: SelectSubset<T, IntegrationCheckResultCreateArgs<ExtArgs>>): Prisma__IntegrationCheckResultClient<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IntegrationCheckResults.
     * @param {IntegrationCheckResultCreateManyArgs} args - Arguments to create many IntegrationCheckResults.
     * @example
     * // Create many IntegrationCheckResults
     * const integrationCheckResult = await prisma.integrationCheckResult.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IntegrationCheckResultCreateManyArgs>(args?: SelectSubset<T, IntegrationCheckResultCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IntegrationCheckResults and returns the data saved in the database.
     * @param {IntegrationCheckResultCreateManyAndReturnArgs} args - Arguments to create many IntegrationCheckResults.
     * @example
     * // Create many IntegrationCheckResults
     * const integrationCheckResult = await prisma.integrationCheckResult.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IntegrationCheckResults and only return the `id`
     * const integrationCheckResultWithIdOnly = await prisma.integrationCheckResult.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IntegrationCheckResultCreateManyAndReturnArgs>(args?: SelectSubset<T, IntegrationCheckResultCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IntegrationCheckResult.
     * @param {IntegrationCheckResultDeleteArgs} args - Arguments to delete one IntegrationCheckResult.
     * @example
     * // Delete one IntegrationCheckResult
     * const IntegrationCheckResult = await prisma.integrationCheckResult.delete({
     *   where: {
     *     // ... filter to delete one IntegrationCheckResult
     *   }
     * })
     * 
     */
    delete<T extends IntegrationCheckResultDeleteArgs>(args: SelectSubset<T, IntegrationCheckResultDeleteArgs<ExtArgs>>): Prisma__IntegrationCheckResultClient<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IntegrationCheckResult.
     * @param {IntegrationCheckResultUpdateArgs} args - Arguments to update one IntegrationCheckResult.
     * @example
     * // Update one IntegrationCheckResult
     * const integrationCheckResult = await prisma.integrationCheckResult.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IntegrationCheckResultUpdateArgs>(args: SelectSubset<T, IntegrationCheckResultUpdateArgs<ExtArgs>>): Prisma__IntegrationCheckResultClient<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IntegrationCheckResults.
     * @param {IntegrationCheckResultDeleteManyArgs} args - Arguments to filter IntegrationCheckResults to delete.
     * @example
     * // Delete a few IntegrationCheckResults
     * const { count } = await prisma.integrationCheckResult.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IntegrationCheckResultDeleteManyArgs>(args?: SelectSubset<T, IntegrationCheckResultDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IntegrationCheckResults.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckResultUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IntegrationCheckResults
     * const integrationCheckResult = await prisma.integrationCheckResult.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IntegrationCheckResultUpdateManyArgs>(args: SelectSubset<T, IntegrationCheckResultUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IntegrationCheckResults and returns the data updated in the database.
     * @param {IntegrationCheckResultUpdateManyAndReturnArgs} args - Arguments to update many IntegrationCheckResults.
     * @example
     * // Update many IntegrationCheckResults
     * const integrationCheckResult = await prisma.integrationCheckResult.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IntegrationCheckResults and only return the `id`
     * const integrationCheckResultWithIdOnly = await prisma.integrationCheckResult.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IntegrationCheckResultUpdateManyAndReturnArgs>(args: SelectSubset<T, IntegrationCheckResultUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IntegrationCheckResult.
     * @param {IntegrationCheckResultUpsertArgs} args - Arguments to update or create a IntegrationCheckResult.
     * @example
     * // Update or create a IntegrationCheckResult
     * const integrationCheckResult = await prisma.integrationCheckResult.upsert({
     *   create: {
     *     // ... data to create a IntegrationCheckResult
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IntegrationCheckResult we want to update
     *   }
     * })
     */
    upsert<T extends IntegrationCheckResultUpsertArgs>(args: SelectSubset<T, IntegrationCheckResultUpsertArgs<ExtArgs>>): Prisma__IntegrationCheckResultClient<$Result.GetResult<Prisma.$IntegrationCheckResultPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IntegrationCheckResults.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckResultCountArgs} args - Arguments to filter IntegrationCheckResults to count.
     * @example
     * // Count the number of IntegrationCheckResults
     * const count = await prisma.integrationCheckResult.count({
     *   where: {
     *     // ... the filter for the IntegrationCheckResults we want to count
     *   }
     * })
    **/
    count<T extends IntegrationCheckResultCountArgs>(
      args?: Subset<T, IntegrationCheckResultCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IntegrationCheckResultCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IntegrationCheckResult.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckResultAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IntegrationCheckResultAggregateArgs>(args: Subset<T, IntegrationCheckResultAggregateArgs>): Prisma.PrismaPromise<GetIntegrationCheckResultAggregateType<T>>

    /**
     * Group by IntegrationCheckResult.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCheckResultGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IntegrationCheckResultGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IntegrationCheckResultGroupByArgs['orderBy'] }
        : { orderBy?: IntegrationCheckResultGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IntegrationCheckResultGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIntegrationCheckResultGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IntegrationCheckResult model
   */
  readonly fields: IntegrationCheckResultFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IntegrationCheckResult.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IntegrationCheckResultClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    integrationCheck<T extends IntegrationCheckDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationCheckDefaultArgs<ExtArgs>>): Prisma__IntegrationCheckClient<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    connection<T extends IntegrationConnectionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnectionDefaultArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IntegrationCheckResult model
   */
  interface IntegrationCheckResultFieldRefs {
    readonly id: FieldRef<"IntegrationCheckResult", 'String'>
    readonly tenantId: FieldRef<"IntegrationCheckResult", 'String'>
    readonly integrationCheckId: FieldRef<"IntegrationCheckResult", 'String'>
    readonly connectionId: FieldRef<"IntegrationCheckResult", 'String'>
    readonly status: FieldRef<"IntegrationCheckResult", 'IntegrationCheckStatus'>
    readonly payload: FieldRef<"IntegrationCheckResult", 'Json'>
    readonly errorMessage: FieldRef<"IntegrationCheckResult", 'String'>
    readonly durationMs: FieldRef<"IntegrationCheckResult", 'Int'>
    readonly evidenceId: FieldRef<"IntegrationCheckResult", 'String'>
    readonly createdAt: FieldRef<"IntegrationCheckResult", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IntegrationCheckResult findUnique
   */
  export type IntegrationCheckResultFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckResult to fetch.
     */
    where: IntegrationCheckResultWhereUniqueInput
  }

  /**
   * IntegrationCheckResult findUniqueOrThrow
   */
  export type IntegrationCheckResultFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckResult to fetch.
     */
    where: IntegrationCheckResultWhereUniqueInput
  }

  /**
   * IntegrationCheckResult findFirst
   */
  export type IntegrationCheckResultFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckResult to fetch.
     */
    where?: IntegrationCheckResultWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationCheckResults to fetch.
     */
    orderBy?: IntegrationCheckResultOrderByWithRelationInput | IntegrationCheckResultOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IntegrationCheckResults.
     */
    cursor?: IntegrationCheckResultWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationCheckResults from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationCheckResults.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationCheckResults.
     */
    distinct?: IntegrationCheckResultScalarFieldEnum | IntegrationCheckResultScalarFieldEnum[]
  }

  /**
   * IntegrationCheckResult findFirstOrThrow
   */
  export type IntegrationCheckResultFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckResult to fetch.
     */
    where?: IntegrationCheckResultWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationCheckResults to fetch.
     */
    orderBy?: IntegrationCheckResultOrderByWithRelationInput | IntegrationCheckResultOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IntegrationCheckResults.
     */
    cursor?: IntegrationCheckResultWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationCheckResults from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationCheckResults.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationCheckResults.
     */
    distinct?: IntegrationCheckResultScalarFieldEnum | IntegrationCheckResultScalarFieldEnum[]
  }

  /**
   * IntegrationCheckResult findMany
   */
  export type IntegrationCheckResultFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * Filter, which IntegrationCheckResults to fetch.
     */
    where?: IntegrationCheckResultWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IntegrationCheckResults to fetch.
     */
    orderBy?: IntegrationCheckResultOrderByWithRelationInput | IntegrationCheckResultOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IntegrationCheckResults.
     */
    cursor?: IntegrationCheckResultWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IntegrationCheckResults from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IntegrationCheckResults.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IntegrationCheckResults.
     */
    distinct?: IntegrationCheckResultScalarFieldEnum | IntegrationCheckResultScalarFieldEnum[]
  }

  /**
   * IntegrationCheckResult create
   */
  export type IntegrationCheckResultCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * The data needed to create a IntegrationCheckResult.
     */
    data: XOR<IntegrationCheckResultCreateInput, IntegrationCheckResultUncheckedCreateInput>
  }

  /**
   * IntegrationCheckResult createMany
   */
  export type IntegrationCheckResultCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IntegrationCheckResults.
     */
    data: IntegrationCheckResultCreateManyInput | IntegrationCheckResultCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * IntegrationCheckResult createManyAndReturn
   */
  export type IntegrationCheckResultCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * The data used to create many IntegrationCheckResults.
     */
    data: IntegrationCheckResultCreateManyInput | IntegrationCheckResultCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * IntegrationCheckResult update
   */
  export type IntegrationCheckResultUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * The data needed to update a IntegrationCheckResult.
     */
    data: XOR<IntegrationCheckResultUpdateInput, IntegrationCheckResultUncheckedUpdateInput>
    /**
     * Choose, which IntegrationCheckResult to update.
     */
    where: IntegrationCheckResultWhereUniqueInput
  }

  /**
   * IntegrationCheckResult updateMany
   */
  export type IntegrationCheckResultUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IntegrationCheckResults.
     */
    data: XOR<IntegrationCheckResultUpdateManyMutationInput, IntegrationCheckResultUncheckedUpdateManyInput>
    /**
     * Filter which IntegrationCheckResults to update
     */
    where?: IntegrationCheckResultWhereInput
    /**
     * Limit how many IntegrationCheckResults to update.
     */
    limit?: number
  }

  /**
   * IntegrationCheckResult updateManyAndReturn
   */
  export type IntegrationCheckResultUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * The data used to update IntegrationCheckResults.
     */
    data: XOR<IntegrationCheckResultUpdateManyMutationInput, IntegrationCheckResultUncheckedUpdateManyInput>
    /**
     * Filter which IntegrationCheckResults to update
     */
    where?: IntegrationCheckResultWhereInput
    /**
     * Limit how many IntegrationCheckResults to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * IntegrationCheckResult upsert
   */
  export type IntegrationCheckResultUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * The filter to search for the IntegrationCheckResult to update in case it exists.
     */
    where: IntegrationCheckResultWhereUniqueInput
    /**
     * In case the IntegrationCheckResult found by the `where` argument doesn't exist, create a new IntegrationCheckResult with this data.
     */
    create: XOR<IntegrationCheckResultCreateInput, IntegrationCheckResultUncheckedCreateInput>
    /**
     * In case the IntegrationCheckResult was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IntegrationCheckResultUpdateInput, IntegrationCheckResultUncheckedUpdateInput>
  }

  /**
   * IntegrationCheckResult delete
   */
  export type IntegrationCheckResultDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
    /**
     * Filter which IntegrationCheckResult to delete.
     */
    where: IntegrationCheckResultWhereUniqueInput
  }

  /**
   * IntegrationCheckResult deleteMany
   */
  export type IntegrationCheckResultDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IntegrationCheckResults to delete
     */
    where?: IntegrationCheckResultWhereInput
    /**
     * Limit how many IntegrationCheckResults to delete.
     */
    limit?: number
  }

  /**
   * IntegrationCheckResult without action
   */
  export type IntegrationCheckResultDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheckResult
     */
    select?: IntegrationCheckResultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheckResult
     */
    omit?: IntegrationCheckResultOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckResultInclude<ExtArgs> | null
  }


  /**
   * Model Integration
   */

  export type AggregateIntegration = {
    _count: IntegrationCountAggregateOutputType | null
    _min: IntegrationMinAggregateOutputType | null
    _max: IntegrationMaxAggregateOutputType | null
  }

  export type IntegrationMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    authType: $Enums.AuthType | null
    category: $Enums.IntegrationCategory | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type IntegrationMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    authType: $Enums.AuthType | null
    category: $Enums.IntegrationCategory | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type IntegrationCountAggregateOutputType = {
    id: number
    name: number
    description: number
    authType: number
    category: number
    configSchema: number
    capabilities: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type IntegrationMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    authType?: true
    category?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type IntegrationMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    authType?: true
    category?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type IntegrationCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    authType?: true
    category?: true
    configSchema?: true
    capabilities?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type IntegrationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Integration to aggregate.
     */
    where?: IntegrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Integrations to fetch.
     */
    orderBy?: IntegrationOrderByWithRelationInput | IntegrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IntegrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Integrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Integrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Integrations
    **/
    _count?: true | IntegrationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IntegrationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IntegrationMaxAggregateInputType
  }

  export type GetIntegrationAggregateType<T extends IntegrationAggregateArgs> = {
        [P in keyof T & keyof AggregateIntegration]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIntegration[P]>
      : GetScalarType<T[P], AggregateIntegration[P]>
  }




  export type IntegrationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IntegrationWhereInput
    orderBy?: IntegrationOrderByWithAggregationInput | IntegrationOrderByWithAggregationInput[]
    by: IntegrationScalarFieldEnum[] | IntegrationScalarFieldEnum
    having?: IntegrationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IntegrationCountAggregateInputType | true
    _min?: IntegrationMinAggregateInputType
    _max?: IntegrationMaxAggregateInputType
  }

  export type IntegrationGroupByOutputType = {
    id: string
    name: string
    description: string | null
    authType: $Enums.AuthType
    category: $Enums.IntegrationCategory
    configSchema: JsonValue | null
    capabilities: string[]
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: IntegrationCountAggregateOutputType | null
    _min: IntegrationMinAggregateOutputType | null
    _max: IntegrationMaxAggregateOutputType | null
  }

  type GetIntegrationGroupByPayload<T extends IntegrationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IntegrationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IntegrationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IntegrationGroupByOutputType[P]>
            : GetScalarType<T[P], IntegrationGroupByOutputType[P]>
        }
      >
    >


  export type IntegrationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    authType?: boolean
    category?: boolean
    configSchema?: boolean
    capabilities?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    connections?: boolean | Integration$connectionsArgs<ExtArgs>
    checks?: boolean | Integration$checksArgs<ExtArgs>
    _count?: boolean | IntegrationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["integration"]>

  export type IntegrationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    authType?: boolean
    category?: boolean
    configSchema?: boolean
    capabilities?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["integration"]>

  export type IntegrationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    authType?: boolean
    category?: boolean
    configSchema?: boolean
    capabilities?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["integration"]>

  export type IntegrationSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    authType?: boolean
    category?: boolean
    configSchema?: boolean
    capabilities?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type IntegrationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "authType" | "category" | "configSchema" | "capabilities" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["integration"]>
  export type IntegrationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connections?: boolean | Integration$connectionsArgs<ExtArgs>
    checks?: boolean | Integration$checksArgs<ExtArgs>
    _count?: boolean | IntegrationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type IntegrationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type IntegrationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $IntegrationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Integration"
    objects: {
      connections: Prisma.$IntegrationConnectionPayload<ExtArgs>[]
      checks: Prisma.$IntegrationCheckPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      authType: $Enums.AuthType
      category: $Enums.IntegrationCategory
      configSchema: Prisma.JsonValue | null
      capabilities: string[]
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["integration"]>
    composites: {}
  }

  type IntegrationGetPayload<S extends boolean | null | undefined | IntegrationDefaultArgs> = $Result.GetResult<Prisma.$IntegrationPayload, S>

  type IntegrationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IntegrationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IntegrationCountAggregateInputType | true
    }

  export interface IntegrationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Integration'], meta: { name: 'Integration' } }
    /**
     * Find zero or one Integration that matches the filter.
     * @param {IntegrationFindUniqueArgs} args - Arguments to find a Integration
     * @example
     * // Get one Integration
     * const integration = await prisma.integration.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IntegrationFindUniqueArgs>(args: SelectSubset<T, IntegrationFindUniqueArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Integration that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IntegrationFindUniqueOrThrowArgs} args - Arguments to find a Integration
     * @example
     * // Get one Integration
     * const integration = await prisma.integration.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IntegrationFindUniqueOrThrowArgs>(args: SelectSubset<T, IntegrationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Integration that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationFindFirstArgs} args - Arguments to find a Integration
     * @example
     * // Get one Integration
     * const integration = await prisma.integration.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IntegrationFindFirstArgs>(args?: SelectSubset<T, IntegrationFindFirstArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Integration that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationFindFirstOrThrowArgs} args - Arguments to find a Integration
     * @example
     * // Get one Integration
     * const integration = await prisma.integration.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IntegrationFindFirstOrThrowArgs>(args?: SelectSubset<T, IntegrationFindFirstOrThrowArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Integrations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Integrations
     * const integrations = await prisma.integration.findMany()
     * 
     * // Get first 10 Integrations
     * const integrations = await prisma.integration.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const integrationWithIdOnly = await prisma.integration.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IntegrationFindManyArgs>(args?: SelectSubset<T, IntegrationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Integration.
     * @param {IntegrationCreateArgs} args - Arguments to create a Integration.
     * @example
     * // Create one Integration
     * const Integration = await prisma.integration.create({
     *   data: {
     *     // ... data to create a Integration
     *   }
     * })
     * 
     */
    create<T extends IntegrationCreateArgs>(args: SelectSubset<T, IntegrationCreateArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Integrations.
     * @param {IntegrationCreateManyArgs} args - Arguments to create many Integrations.
     * @example
     * // Create many Integrations
     * const integration = await prisma.integration.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IntegrationCreateManyArgs>(args?: SelectSubset<T, IntegrationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Integrations and returns the data saved in the database.
     * @param {IntegrationCreateManyAndReturnArgs} args - Arguments to create many Integrations.
     * @example
     * // Create many Integrations
     * const integration = await prisma.integration.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Integrations and only return the `id`
     * const integrationWithIdOnly = await prisma.integration.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IntegrationCreateManyAndReturnArgs>(args?: SelectSubset<T, IntegrationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Integration.
     * @param {IntegrationDeleteArgs} args - Arguments to delete one Integration.
     * @example
     * // Delete one Integration
     * const Integration = await prisma.integration.delete({
     *   where: {
     *     // ... filter to delete one Integration
     *   }
     * })
     * 
     */
    delete<T extends IntegrationDeleteArgs>(args: SelectSubset<T, IntegrationDeleteArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Integration.
     * @param {IntegrationUpdateArgs} args - Arguments to update one Integration.
     * @example
     * // Update one Integration
     * const integration = await prisma.integration.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IntegrationUpdateArgs>(args: SelectSubset<T, IntegrationUpdateArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Integrations.
     * @param {IntegrationDeleteManyArgs} args - Arguments to filter Integrations to delete.
     * @example
     * // Delete a few Integrations
     * const { count } = await prisma.integration.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IntegrationDeleteManyArgs>(args?: SelectSubset<T, IntegrationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Integrations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Integrations
     * const integration = await prisma.integration.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IntegrationUpdateManyArgs>(args: SelectSubset<T, IntegrationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Integrations and returns the data updated in the database.
     * @param {IntegrationUpdateManyAndReturnArgs} args - Arguments to update many Integrations.
     * @example
     * // Update many Integrations
     * const integration = await prisma.integration.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Integrations and only return the `id`
     * const integrationWithIdOnly = await prisma.integration.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IntegrationUpdateManyAndReturnArgs>(args: SelectSubset<T, IntegrationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Integration.
     * @param {IntegrationUpsertArgs} args - Arguments to update or create a Integration.
     * @example
     * // Update or create a Integration
     * const integration = await prisma.integration.upsert({
     *   create: {
     *     // ... data to create a Integration
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Integration we want to update
     *   }
     * })
     */
    upsert<T extends IntegrationUpsertArgs>(args: SelectSubset<T, IntegrationUpsertArgs<ExtArgs>>): Prisma__IntegrationClient<$Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Integrations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationCountArgs} args - Arguments to filter Integrations to count.
     * @example
     * // Count the number of Integrations
     * const count = await prisma.integration.count({
     *   where: {
     *     // ... the filter for the Integrations we want to count
     *   }
     * })
    **/
    count<T extends IntegrationCountArgs>(
      args?: Subset<T, IntegrationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IntegrationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Integration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IntegrationAggregateArgs>(args: Subset<T, IntegrationAggregateArgs>): Prisma.PrismaPromise<GetIntegrationAggregateType<T>>

    /**
     * Group by Integration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IntegrationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IntegrationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IntegrationGroupByArgs['orderBy'] }
        : { orderBy?: IntegrationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IntegrationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIntegrationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Integration model
   */
  readonly fields: IntegrationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Integration.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IntegrationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    connections<T extends Integration$connectionsArgs<ExtArgs> = {}>(args?: Subset<T, Integration$connectionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    checks<T extends Integration$checksArgs<ExtArgs> = {}>(args?: Subset<T, Integration$checksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IntegrationCheckPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Integration model
   */
  interface IntegrationFieldRefs {
    readonly id: FieldRef<"Integration", 'String'>
    readonly name: FieldRef<"Integration", 'String'>
    readonly description: FieldRef<"Integration", 'String'>
    readonly authType: FieldRef<"Integration", 'AuthType'>
    readonly category: FieldRef<"Integration", 'IntegrationCategory'>
    readonly configSchema: FieldRef<"Integration", 'Json'>
    readonly capabilities: FieldRef<"Integration", 'String[]'>
    readonly isActive: FieldRef<"Integration", 'Boolean'>
    readonly createdAt: FieldRef<"Integration", 'DateTime'>
    readonly updatedAt: FieldRef<"Integration", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Integration findUnique
   */
  export type IntegrationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * Filter, which Integration to fetch.
     */
    where: IntegrationWhereUniqueInput
  }

  /**
   * Integration findUniqueOrThrow
   */
  export type IntegrationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * Filter, which Integration to fetch.
     */
    where: IntegrationWhereUniqueInput
  }

  /**
   * Integration findFirst
   */
  export type IntegrationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * Filter, which Integration to fetch.
     */
    where?: IntegrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Integrations to fetch.
     */
    orderBy?: IntegrationOrderByWithRelationInput | IntegrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Integrations.
     */
    cursor?: IntegrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Integrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Integrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Integrations.
     */
    distinct?: IntegrationScalarFieldEnum | IntegrationScalarFieldEnum[]
  }

  /**
   * Integration findFirstOrThrow
   */
  export type IntegrationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * Filter, which Integration to fetch.
     */
    where?: IntegrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Integrations to fetch.
     */
    orderBy?: IntegrationOrderByWithRelationInput | IntegrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Integrations.
     */
    cursor?: IntegrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Integrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Integrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Integrations.
     */
    distinct?: IntegrationScalarFieldEnum | IntegrationScalarFieldEnum[]
  }

  /**
   * Integration findMany
   */
  export type IntegrationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * Filter, which Integrations to fetch.
     */
    where?: IntegrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Integrations to fetch.
     */
    orderBy?: IntegrationOrderByWithRelationInput | IntegrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Integrations.
     */
    cursor?: IntegrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Integrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Integrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Integrations.
     */
    distinct?: IntegrationScalarFieldEnum | IntegrationScalarFieldEnum[]
  }

  /**
   * Integration create
   */
  export type IntegrationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * The data needed to create a Integration.
     */
    data: XOR<IntegrationCreateInput, IntegrationUncheckedCreateInput>
  }

  /**
   * Integration createMany
   */
  export type IntegrationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Integrations.
     */
    data: IntegrationCreateManyInput | IntegrationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Integration createManyAndReturn
   */
  export type IntegrationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * The data used to create many Integrations.
     */
    data: IntegrationCreateManyInput | IntegrationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Integration update
   */
  export type IntegrationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * The data needed to update a Integration.
     */
    data: XOR<IntegrationUpdateInput, IntegrationUncheckedUpdateInput>
    /**
     * Choose, which Integration to update.
     */
    where: IntegrationWhereUniqueInput
  }

  /**
   * Integration updateMany
   */
  export type IntegrationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Integrations.
     */
    data: XOR<IntegrationUpdateManyMutationInput, IntegrationUncheckedUpdateManyInput>
    /**
     * Filter which Integrations to update
     */
    where?: IntegrationWhereInput
    /**
     * Limit how many Integrations to update.
     */
    limit?: number
  }

  /**
   * Integration updateManyAndReturn
   */
  export type IntegrationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * The data used to update Integrations.
     */
    data: XOR<IntegrationUpdateManyMutationInput, IntegrationUncheckedUpdateManyInput>
    /**
     * Filter which Integrations to update
     */
    where?: IntegrationWhereInput
    /**
     * Limit how many Integrations to update.
     */
    limit?: number
  }

  /**
   * Integration upsert
   */
  export type IntegrationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * The filter to search for the Integration to update in case it exists.
     */
    where: IntegrationWhereUniqueInput
    /**
     * In case the Integration found by the `where` argument doesn't exist, create a new Integration with this data.
     */
    create: XOR<IntegrationCreateInput, IntegrationUncheckedCreateInput>
    /**
     * In case the Integration was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IntegrationUpdateInput, IntegrationUncheckedUpdateInput>
  }

  /**
   * Integration delete
   */
  export type IntegrationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
    /**
     * Filter which Integration to delete.
     */
    where: IntegrationWhereUniqueInput
  }

  /**
   * Integration deleteMany
   */
  export type IntegrationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Integrations to delete
     */
    where?: IntegrationWhereInput
    /**
     * Limit how many Integrations to delete.
     */
    limit?: number
  }

  /**
   * Integration.connections
   */
  export type Integration$connectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationConnection
     */
    select?: IntegrationConnectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationConnection
     */
    omit?: IntegrationConnectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationConnectionInclude<ExtArgs> | null
    where?: IntegrationConnectionWhereInput
    orderBy?: IntegrationConnectionOrderByWithRelationInput | IntegrationConnectionOrderByWithRelationInput[]
    cursor?: IntegrationConnectionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IntegrationConnectionScalarFieldEnum | IntegrationConnectionScalarFieldEnum[]
  }

  /**
   * Integration.checks
   */
  export type Integration$checksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IntegrationCheck
     */
    select?: IntegrationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IntegrationCheck
     */
    omit?: IntegrationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationCheckInclude<ExtArgs> | null
    where?: IntegrationCheckWhereInput
    orderBy?: IntegrationCheckOrderByWithRelationInput | IntegrationCheckOrderByWithRelationInput[]
    cursor?: IntegrationCheckWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IntegrationCheckScalarFieldEnum | IntegrationCheckScalarFieldEnum[]
  }

  /**
   * Integration without action
   */
  export type IntegrationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Integration
     */
    select?: IntegrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Integration
     */
    omit?: IntegrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IntegrationInclude<ExtArgs> | null
  }


  /**
   * Model CollectionJob
   */

  export type AggregateCollectionJob = {
    _count: CollectionJobCountAggregateOutputType | null
    _avg: CollectionJobAvgAggregateOutputType | null
    _sum: CollectionJobSumAggregateOutputType | null
    _min: CollectionJobMinAggregateOutputType | null
    _max: CollectionJobMaxAggregateOutputType | null
  }

  export type CollectionJobAvgAggregateOutputType = {
    priority: number | null
  }

  export type CollectionJobSumAggregateOutputType = {
    priority: number | null
  }

  export type CollectionJobMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    connectionId: string | null
    type: $Enums.JobType | null
    status: $Enums.JobStatus | null
    priority: number | null
    scheduledAt: Date | null
    startedAt: Date | null
    completedAt: Date | null
    nextRunAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CollectionJobMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    connectionId: string | null
    type: $Enums.JobType | null
    status: $Enums.JobStatus | null
    priority: number | null
    scheduledAt: Date | null
    startedAt: Date | null
    completedAt: Date | null
    nextRunAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CollectionJobCountAggregateOutputType = {
    id: number
    tenantId: number
    connectionId: number
    type: number
    status: number
    priority: number
    scheduledAt: number
    startedAt: number
    completedAt: number
    nextRunAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CollectionJobAvgAggregateInputType = {
    priority?: true
  }

  export type CollectionJobSumAggregateInputType = {
    priority?: true
  }

  export type CollectionJobMinAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    type?: true
    status?: true
    priority?: true
    scheduledAt?: true
    startedAt?: true
    completedAt?: true
    nextRunAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CollectionJobMaxAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    type?: true
    status?: true
    priority?: true
    scheduledAt?: true
    startedAt?: true
    completedAt?: true
    nextRunAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CollectionJobCountAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    type?: true
    status?: true
    priority?: true
    scheduledAt?: true
    startedAt?: true
    completedAt?: true
    nextRunAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CollectionJobAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CollectionJob to aggregate.
     */
    where?: CollectionJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionJobs to fetch.
     */
    orderBy?: CollectionJobOrderByWithRelationInput | CollectionJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CollectionJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CollectionJobs
    **/
    _count?: true | CollectionJobCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CollectionJobAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CollectionJobSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CollectionJobMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CollectionJobMaxAggregateInputType
  }

  export type GetCollectionJobAggregateType<T extends CollectionJobAggregateArgs> = {
        [P in keyof T & keyof AggregateCollectionJob]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCollectionJob[P]>
      : GetScalarType<T[P], AggregateCollectionJob[P]>
  }




  export type CollectionJobGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CollectionJobWhereInput
    orderBy?: CollectionJobOrderByWithAggregationInput | CollectionJobOrderByWithAggregationInput[]
    by: CollectionJobScalarFieldEnum[] | CollectionJobScalarFieldEnum
    having?: CollectionJobScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CollectionJobCountAggregateInputType | true
    _avg?: CollectionJobAvgAggregateInputType
    _sum?: CollectionJobSumAggregateInputType
    _min?: CollectionJobMinAggregateInputType
    _max?: CollectionJobMaxAggregateInputType
  }

  export type CollectionJobGroupByOutputType = {
    id: string
    tenantId: string
    connectionId: string
    type: $Enums.JobType
    status: $Enums.JobStatus
    priority: number
    scheduledAt: Date
    startedAt: Date | null
    completedAt: Date | null
    nextRunAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: CollectionJobCountAggregateOutputType | null
    _avg: CollectionJobAvgAggregateOutputType | null
    _sum: CollectionJobSumAggregateOutputType | null
    _min: CollectionJobMinAggregateOutputType | null
    _max: CollectionJobMaxAggregateOutputType | null
  }

  type GetCollectionJobGroupByPayload<T extends CollectionJobGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CollectionJobGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CollectionJobGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CollectionJobGroupByOutputType[P]>
            : GetScalarType<T[P], CollectionJobGroupByOutputType[P]>
        }
      >
    >


  export type CollectionJobSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    type?: boolean
    status?: boolean
    priority?: boolean
    scheduledAt?: boolean
    startedAt?: boolean
    completedAt?: boolean
    nextRunAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
    runs?: boolean | CollectionJob$runsArgs<ExtArgs>
    _count?: boolean | CollectionJobCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionJob"]>

  export type CollectionJobSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    type?: boolean
    status?: boolean
    priority?: boolean
    scheduledAt?: boolean
    startedAt?: boolean
    completedAt?: boolean
    nextRunAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionJob"]>

  export type CollectionJobSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    type?: boolean
    status?: boolean
    priority?: boolean
    scheduledAt?: boolean
    startedAt?: boolean
    completedAt?: boolean
    nextRunAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionJob"]>

  export type CollectionJobSelectScalar = {
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    type?: boolean
    status?: boolean
    priority?: boolean
    scheduledAt?: boolean
    startedAt?: boolean
    completedAt?: boolean
    nextRunAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CollectionJobOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "connectionId" | "type" | "status" | "priority" | "scheduledAt" | "startedAt" | "completedAt" | "nextRunAt" | "createdAt" | "updatedAt", ExtArgs["result"]["collectionJob"]>
  export type CollectionJobInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
    runs?: boolean | CollectionJob$runsArgs<ExtArgs>
    _count?: boolean | CollectionJobCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CollectionJobIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }
  export type CollectionJobIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }

  export type $CollectionJobPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CollectionJob"
    objects: {
      connection: Prisma.$IntegrationConnectionPayload<ExtArgs>
      runs: Prisma.$CollectionJobRunPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      connectionId: string
      type: $Enums.JobType
      status: $Enums.JobStatus
      priority: number
      scheduledAt: Date
      startedAt: Date | null
      completedAt: Date | null
      nextRunAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["collectionJob"]>
    composites: {}
  }

  type CollectionJobGetPayload<S extends boolean | null | undefined | CollectionJobDefaultArgs> = $Result.GetResult<Prisma.$CollectionJobPayload, S>

  type CollectionJobCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CollectionJobFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CollectionJobCountAggregateInputType | true
    }

  export interface CollectionJobDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CollectionJob'], meta: { name: 'CollectionJob' } }
    /**
     * Find zero or one CollectionJob that matches the filter.
     * @param {CollectionJobFindUniqueArgs} args - Arguments to find a CollectionJob
     * @example
     * // Get one CollectionJob
     * const collectionJob = await prisma.collectionJob.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CollectionJobFindUniqueArgs>(args: SelectSubset<T, CollectionJobFindUniqueArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CollectionJob that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CollectionJobFindUniqueOrThrowArgs} args - Arguments to find a CollectionJob
     * @example
     * // Get one CollectionJob
     * const collectionJob = await prisma.collectionJob.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CollectionJobFindUniqueOrThrowArgs>(args: SelectSubset<T, CollectionJobFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CollectionJob that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobFindFirstArgs} args - Arguments to find a CollectionJob
     * @example
     * // Get one CollectionJob
     * const collectionJob = await prisma.collectionJob.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CollectionJobFindFirstArgs>(args?: SelectSubset<T, CollectionJobFindFirstArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CollectionJob that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobFindFirstOrThrowArgs} args - Arguments to find a CollectionJob
     * @example
     * // Get one CollectionJob
     * const collectionJob = await prisma.collectionJob.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CollectionJobFindFirstOrThrowArgs>(args?: SelectSubset<T, CollectionJobFindFirstOrThrowArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CollectionJobs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CollectionJobs
     * const collectionJobs = await prisma.collectionJob.findMany()
     * 
     * // Get first 10 CollectionJobs
     * const collectionJobs = await prisma.collectionJob.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const collectionJobWithIdOnly = await prisma.collectionJob.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CollectionJobFindManyArgs>(args?: SelectSubset<T, CollectionJobFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CollectionJob.
     * @param {CollectionJobCreateArgs} args - Arguments to create a CollectionJob.
     * @example
     * // Create one CollectionJob
     * const CollectionJob = await prisma.collectionJob.create({
     *   data: {
     *     // ... data to create a CollectionJob
     *   }
     * })
     * 
     */
    create<T extends CollectionJobCreateArgs>(args: SelectSubset<T, CollectionJobCreateArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CollectionJobs.
     * @param {CollectionJobCreateManyArgs} args - Arguments to create many CollectionJobs.
     * @example
     * // Create many CollectionJobs
     * const collectionJob = await prisma.collectionJob.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CollectionJobCreateManyArgs>(args?: SelectSubset<T, CollectionJobCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CollectionJobs and returns the data saved in the database.
     * @param {CollectionJobCreateManyAndReturnArgs} args - Arguments to create many CollectionJobs.
     * @example
     * // Create many CollectionJobs
     * const collectionJob = await prisma.collectionJob.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CollectionJobs and only return the `id`
     * const collectionJobWithIdOnly = await prisma.collectionJob.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CollectionJobCreateManyAndReturnArgs>(args?: SelectSubset<T, CollectionJobCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CollectionJob.
     * @param {CollectionJobDeleteArgs} args - Arguments to delete one CollectionJob.
     * @example
     * // Delete one CollectionJob
     * const CollectionJob = await prisma.collectionJob.delete({
     *   where: {
     *     // ... filter to delete one CollectionJob
     *   }
     * })
     * 
     */
    delete<T extends CollectionJobDeleteArgs>(args: SelectSubset<T, CollectionJobDeleteArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CollectionJob.
     * @param {CollectionJobUpdateArgs} args - Arguments to update one CollectionJob.
     * @example
     * // Update one CollectionJob
     * const collectionJob = await prisma.collectionJob.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CollectionJobUpdateArgs>(args: SelectSubset<T, CollectionJobUpdateArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CollectionJobs.
     * @param {CollectionJobDeleteManyArgs} args - Arguments to filter CollectionJobs to delete.
     * @example
     * // Delete a few CollectionJobs
     * const { count } = await prisma.collectionJob.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CollectionJobDeleteManyArgs>(args?: SelectSubset<T, CollectionJobDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CollectionJobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CollectionJobs
     * const collectionJob = await prisma.collectionJob.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CollectionJobUpdateManyArgs>(args: SelectSubset<T, CollectionJobUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CollectionJobs and returns the data updated in the database.
     * @param {CollectionJobUpdateManyAndReturnArgs} args - Arguments to update many CollectionJobs.
     * @example
     * // Update many CollectionJobs
     * const collectionJob = await prisma.collectionJob.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CollectionJobs and only return the `id`
     * const collectionJobWithIdOnly = await prisma.collectionJob.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CollectionJobUpdateManyAndReturnArgs>(args: SelectSubset<T, CollectionJobUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CollectionJob.
     * @param {CollectionJobUpsertArgs} args - Arguments to update or create a CollectionJob.
     * @example
     * // Update or create a CollectionJob
     * const collectionJob = await prisma.collectionJob.upsert({
     *   create: {
     *     // ... data to create a CollectionJob
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CollectionJob we want to update
     *   }
     * })
     */
    upsert<T extends CollectionJobUpsertArgs>(args: SelectSubset<T, CollectionJobUpsertArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CollectionJobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobCountArgs} args - Arguments to filter CollectionJobs to count.
     * @example
     * // Count the number of CollectionJobs
     * const count = await prisma.collectionJob.count({
     *   where: {
     *     // ... the filter for the CollectionJobs we want to count
     *   }
     * })
    **/
    count<T extends CollectionJobCountArgs>(
      args?: Subset<T, CollectionJobCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CollectionJobCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CollectionJob.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CollectionJobAggregateArgs>(args: Subset<T, CollectionJobAggregateArgs>): Prisma.PrismaPromise<GetCollectionJobAggregateType<T>>

    /**
     * Group by CollectionJob.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CollectionJobGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CollectionJobGroupByArgs['orderBy'] }
        : { orderBy?: CollectionJobGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CollectionJobGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCollectionJobGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CollectionJob model
   */
  readonly fields: CollectionJobFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CollectionJob.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CollectionJobClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    connection<T extends IntegrationConnectionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnectionDefaultArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    runs<T extends CollectionJob$runsArgs<ExtArgs> = {}>(args?: Subset<T, CollectionJob$runsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CollectionJob model
   */
  interface CollectionJobFieldRefs {
    readonly id: FieldRef<"CollectionJob", 'String'>
    readonly tenantId: FieldRef<"CollectionJob", 'String'>
    readonly connectionId: FieldRef<"CollectionJob", 'String'>
    readonly type: FieldRef<"CollectionJob", 'JobType'>
    readonly status: FieldRef<"CollectionJob", 'JobStatus'>
    readonly priority: FieldRef<"CollectionJob", 'Int'>
    readonly scheduledAt: FieldRef<"CollectionJob", 'DateTime'>
    readonly startedAt: FieldRef<"CollectionJob", 'DateTime'>
    readonly completedAt: FieldRef<"CollectionJob", 'DateTime'>
    readonly nextRunAt: FieldRef<"CollectionJob", 'DateTime'>
    readonly createdAt: FieldRef<"CollectionJob", 'DateTime'>
    readonly updatedAt: FieldRef<"CollectionJob", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CollectionJob findUnique
   */
  export type CollectionJobFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJob to fetch.
     */
    where: CollectionJobWhereUniqueInput
  }

  /**
   * CollectionJob findUniqueOrThrow
   */
  export type CollectionJobFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJob to fetch.
     */
    where: CollectionJobWhereUniqueInput
  }

  /**
   * CollectionJob findFirst
   */
  export type CollectionJobFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJob to fetch.
     */
    where?: CollectionJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionJobs to fetch.
     */
    orderBy?: CollectionJobOrderByWithRelationInput | CollectionJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CollectionJobs.
     */
    cursor?: CollectionJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionJobs.
     */
    distinct?: CollectionJobScalarFieldEnum | CollectionJobScalarFieldEnum[]
  }

  /**
   * CollectionJob findFirstOrThrow
   */
  export type CollectionJobFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJob to fetch.
     */
    where?: CollectionJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionJobs to fetch.
     */
    orderBy?: CollectionJobOrderByWithRelationInput | CollectionJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CollectionJobs.
     */
    cursor?: CollectionJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionJobs.
     */
    distinct?: CollectionJobScalarFieldEnum | CollectionJobScalarFieldEnum[]
  }

  /**
   * CollectionJob findMany
   */
  export type CollectionJobFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJobs to fetch.
     */
    where?: CollectionJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionJobs to fetch.
     */
    orderBy?: CollectionJobOrderByWithRelationInput | CollectionJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CollectionJobs.
     */
    cursor?: CollectionJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionJobs.
     */
    distinct?: CollectionJobScalarFieldEnum | CollectionJobScalarFieldEnum[]
  }

  /**
   * CollectionJob create
   */
  export type CollectionJobCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * The data needed to create a CollectionJob.
     */
    data: XOR<CollectionJobCreateInput, CollectionJobUncheckedCreateInput>
  }

  /**
   * CollectionJob createMany
   */
  export type CollectionJobCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CollectionJobs.
     */
    data: CollectionJobCreateManyInput | CollectionJobCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CollectionJob createManyAndReturn
   */
  export type CollectionJobCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * The data used to create many CollectionJobs.
     */
    data: CollectionJobCreateManyInput | CollectionJobCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CollectionJob update
   */
  export type CollectionJobUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * The data needed to update a CollectionJob.
     */
    data: XOR<CollectionJobUpdateInput, CollectionJobUncheckedUpdateInput>
    /**
     * Choose, which CollectionJob to update.
     */
    where: CollectionJobWhereUniqueInput
  }

  /**
   * CollectionJob updateMany
   */
  export type CollectionJobUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CollectionJobs.
     */
    data: XOR<CollectionJobUpdateManyMutationInput, CollectionJobUncheckedUpdateManyInput>
    /**
     * Filter which CollectionJobs to update
     */
    where?: CollectionJobWhereInput
    /**
     * Limit how many CollectionJobs to update.
     */
    limit?: number
  }

  /**
   * CollectionJob updateManyAndReturn
   */
  export type CollectionJobUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * The data used to update CollectionJobs.
     */
    data: XOR<CollectionJobUpdateManyMutationInput, CollectionJobUncheckedUpdateManyInput>
    /**
     * Filter which CollectionJobs to update
     */
    where?: CollectionJobWhereInput
    /**
     * Limit how many CollectionJobs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CollectionJob upsert
   */
  export type CollectionJobUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * The filter to search for the CollectionJob to update in case it exists.
     */
    where: CollectionJobWhereUniqueInput
    /**
     * In case the CollectionJob found by the `where` argument doesn't exist, create a new CollectionJob with this data.
     */
    create: XOR<CollectionJobCreateInput, CollectionJobUncheckedCreateInput>
    /**
     * In case the CollectionJob was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CollectionJobUpdateInput, CollectionJobUncheckedUpdateInput>
  }

  /**
   * CollectionJob delete
   */
  export type CollectionJobDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
    /**
     * Filter which CollectionJob to delete.
     */
    where: CollectionJobWhereUniqueInput
  }

  /**
   * CollectionJob deleteMany
   */
  export type CollectionJobDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CollectionJobs to delete
     */
    where?: CollectionJobWhereInput
    /**
     * Limit how many CollectionJobs to delete.
     */
    limit?: number
  }

  /**
   * CollectionJob.runs
   */
  export type CollectionJob$runsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    where?: CollectionJobRunWhereInput
    orderBy?: CollectionJobRunOrderByWithRelationInput | CollectionJobRunOrderByWithRelationInput[]
    cursor?: CollectionJobRunWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CollectionJobRunScalarFieldEnum | CollectionJobRunScalarFieldEnum[]
  }

  /**
   * CollectionJob without action
   */
  export type CollectionJobDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJob
     */
    select?: CollectionJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJob
     */
    omit?: CollectionJobOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobInclude<ExtArgs> | null
  }


  /**
   * Model CollectionJobRun
   */

  export type AggregateCollectionJobRun = {
    _count: CollectionJobRunCountAggregateOutputType | null
    _avg: CollectionJobRunAvgAggregateOutputType | null
    _sum: CollectionJobRunSumAggregateOutputType | null
    _min: CollectionJobRunMinAggregateOutputType | null
    _max: CollectionJobRunMaxAggregateOutputType | null
  }

  export type CollectionJobRunAvgAggregateOutputType = {
    runNumber: number | null
    durationMs: number | null
    evidenceCount: number | null
    errorCount: number | null
  }

  export type CollectionJobRunSumAggregateOutputType = {
    runNumber: number | null
    durationMs: number | null
    evidenceCount: number | null
    errorCount: number | null
  }

  export type CollectionJobRunMinAggregateOutputType = {
    id: string | null
    jobId: string | null
    tenantId: string | null
    runNumber: number | null
    status: $Enums.RunStatus | null
    startedAt: Date | null
    completedAt: Date | null
    durationMs: number | null
    evidenceCount: number | null
    errorCount: number | null
    errorDetails: string | null
    createdAt: Date | null
  }

  export type CollectionJobRunMaxAggregateOutputType = {
    id: string | null
    jobId: string | null
    tenantId: string | null
    runNumber: number | null
    status: $Enums.RunStatus | null
    startedAt: Date | null
    completedAt: Date | null
    durationMs: number | null
    evidenceCount: number | null
    errorCount: number | null
    errorDetails: string | null
    createdAt: Date | null
  }

  export type CollectionJobRunCountAggregateOutputType = {
    id: number
    jobId: number
    tenantId: number
    runNumber: number
    status: number
    startedAt: number
    completedAt: number
    durationMs: number
    evidenceCount: number
    errorCount: number
    resultSummary: number
    errorDetails: number
    createdAt: number
    _all: number
  }


  export type CollectionJobRunAvgAggregateInputType = {
    runNumber?: true
    durationMs?: true
    evidenceCount?: true
    errorCount?: true
  }

  export type CollectionJobRunSumAggregateInputType = {
    runNumber?: true
    durationMs?: true
    evidenceCount?: true
    errorCount?: true
  }

  export type CollectionJobRunMinAggregateInputType = {
    id?: true
    jobId?: true
    tenantId?: true
    runNumber?: true
    status?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    evidenceCount?: true
    errorCount?: true
    errorDetails?: true
    createdAt?: true
  }

  export type CollectionJobRunMaxAggregateInputType = {
    id?: true
    jobId?: true
    tenantId?: true
    runNumber?: true
    status?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    evidenceCount?: true
    errorCount?: true
    errorDetails?: true
    createdAt?: true
  }

  export type CollectionJobRunCountAggregateInputType = {
    id?: true
    jobId?: true
    tenantId?: true
    runNumber?: true
    status?: true
    startedAt?: true
    completedAt?: true
    durationMs?: true
    evidenceCount?: true
    errorCount?: true
    resultSummary?: true
    errorDetails?: true
    createdAt?: true
    _all?: true
  }

  export type CollectionJobRunAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CollectionJobRun to aggregate.
     */
    where?: CollectionJobRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionJobRuns to fetch.
     */
    orderBy?: CollectionJobRunOrderByWithRelationInput | CollectionJobRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CollectionJobRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionJobRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionJobRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CollectionJobRuns
    **/
    _count?: true | CollectionJobRunCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CollectionJobRunAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CollectionJobRunSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CollectionJobRunMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CollectionJobRunMaxAggregateInputType
  }

  export type GetCollectionJobRunAggregateType<T extends CollectionJobRunAggregateArgs> = {
        [P in keyof T & keyof AggregateCollectionJobRun]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCollectionJobRun[P]>
      : GetScalarType<T[P], AggregateCollectionJobRun[P]>
  }




  export type CollectionJobRunGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CollectionJobRunWhereInput
    orderBy?: CollectionJobRunOrderByWithAggregationInput | CollectionJobRunOrderByWithAggregationInput[]
    by: CollectionJobRunScalarFieldEnum[] | CollectionJobRunScalarFieldEnum
    having?: CollectionJobRunScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CollectionJobRunCountAggregateInputType | true
    _avg?: CollectionJobRunAvgAggregateInputType
    _sum?: CollectionJobRunSumAggregateInputType
    _min?: CollectionJobRunMinAggregateInputType
    _max?: CollectionJobRunMaxAggregateInputType
  }

  export type CollectionJobRunGroupByOutputType = {
    id: string
    jobId: string
    tenantId: string
    runNumber: number
    status: $Enums.RunStatus
    startedAt: Date
    completedAt: Date | null
    durationMs: number | null
    evidenceCount: number
    errorCount: number
    resultSummary: JsonValue | null
    errorDetails: string | null
    createdAt: Date
    _count: CollectionJobRunCountAggregateOutputType | null
    _avg: CollectionJobRunAvgAggregateOutputType | null
    _sum: CollectionJobRunSumAggregateOutputType | null
    _min: CollectionJobRunMinAggregateOutputType | null
    _max: CollectionJobRunMaxAggregateOutputType | null
  }

  type GetCollectionJobRunGroupByPayload<T extends CollectionJobRunGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CollectionJobRunGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CollectionJobRunGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CollectionJobRunGroupByOutputType[P]>
            : GetScalarType<T[P], CollectionJobRunGroupByOutputType[P]>
        }
      >
    >


  export type CollectionJobRunSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    tenantId?: boolean
    runNumber?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    evidenceCount?: boolean
    errorCount?: boolean
    resultSummary?: boolean
    errorDetails?: boolean
    createdAt?: boolean
    job?: boolean | CollectionJobDefaultArgs<ExtArgs>
    retries?: boolean | CollectionJobRun$retriesArgs<ExtArgs>
    _count?: boolean | CollectionJobRunCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionJobRun"]>

  export type CollectionJobRunSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    tenantId?: boolean
    runNumber?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    evidenceCount?: boolean
    errorCount?: boolean
    resultSummary?: boolean
    errorDetails?: boolean
    createdAt?: boolean
    job?: boolean | CollectionJobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionJobRun"]>

  export type CollectionJobRunSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobId?: boolean
    tenantId?: boolean
    runNumber?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    evidenceCount?: boolean
    errorCount?: boolean
    resultSummary?: boolean
    errorDetails?: boolean
    createdAt?: boolean
    job?: boolean | CollectionJobDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionJobRun"]>

  export type CollectionJobRunSelectScalar = {
    id?: boolean
    jobId?: boolean
    tenantId?: boolean
    runNumber?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    durationMs?: boolean
    evidenceCount?: boolean
    errorCount?: boolean
    resultSummary?: boolean
    errorDetails?: boolean
    createdAt?: boolean
  }

  export type CollectionJobRunOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "jobId" | "tenantId" | "runNumber" | "status" | "startedAt" | "completedAt" | "durationMs" | "evidenceCount" | "errorCount" | "resultSummary" | "errorDetails" | "createdAt", ExtArgs["result"]["collectionJobRun"]>
  export type CollectionJobRunInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | CollectionJobDefaultArgs<ExtArgs>
    retries?: boolean | CollectionJobRun$retriesArgs<ExtArgs>
    _count?: boolean | CollectionJobRunCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CollectionJobRunIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | CollectionJobDefaultArgs<ExtArgs>
  }
  export type CollectionJobRunIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    job?: boolean | CollectionJobDefaultArgs<ExtArgs>
  }

  export type $CollectionJobRunPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CollectionJobRun"
    objects: {
      job: Prisma.$CollectionJobPayload<ExtArgs>
      retries: Prisma.$CollectionRetryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      jobId: string
      tenantId: string
      runNumber: number
      status: $Enums.RunStatus
      startedAt: Date
      completedAt: Date | null
      durationMs: number | null
      evidenceCount: number
      errorCount: number
      resultSummary: Prisma.JsonValue | null
      errorDetails: string | null
      createdAt: Date
    }, ExtArgs["result"]["collectionJobRun"]>
    composites: {}
  }

  type CollectionJobRunGetPayload<S extends boolean | null | undefined | CollectionJobRunDefaultArgs> = $Result.GetResult<Prisma.$CollectionJobRunPayload, S>

  type CollectionJobRunCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CollectionJobRunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CollectionJobRunCountAggregateInputType | true
    }

  export interface CollectionJobRunDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CollectionJobRun'], meta: { name: 'CollectionJobRun' } }
    /**
     * Find zero or one CollectionJobRun that matches the filter.
     * @param {CollectionJobRunFindUniqueArgs} args - Arguments to find a CollectionJobRun
     * @example
     * // Get one CollectionJobRun
     * const collectionJobRun = await prisma.collectionJobRun.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CollectionJobRunFindUniqueArgs>(args: SelectSubset<T, CollectionJobRunFindUniqueArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CollectionJobRun that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CollectionJobRunFindUniqueOrThrowArgs} args - Arguments to find a CollectionJobRun
     * @example
     * // Get one CollectionJobRun
     * const collectionJobRun = await prisma.collectionJobRun.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CollectionJobRunFindUniqueOrThrowArgs>(args: SelectSubset<T, CollectionJobRunFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CollectionJobRun that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobRunFindFirstArgs} args - Arguments to find a CollectionJobRun
     * @example
     * // Get one CollectionJobRun
     * const collectionJobRun = await prisma.collectionJobRun.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CollectionJobRunFindFirstArgs>(args?: SelectSubset<T, CollectionJobRunFindFirstArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CollectionJobRun that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobRunFindFirstOrThrowArgs} args - Arguments to find a CollectionJobRun
     * @example
     * // Get one CollectionJobRun
     * const collectionJobRun = await prisma.collectionJobRun.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CollectionJobRunFindFirstOrThrowArgs>(args?: SelectSubset<T, CollectionJobRunFindFirstOrThrowArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CollectionJobRuns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobRunFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CollectionJobRuns
     * const collectionJobRuns = await prisma.collectionJobRun.findMany()
     * 
     * // Get first 10 CollectionJobRuns
     * const collectionJobRuns = await prisma.collectionJobRun.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const collectionJobRunWithIdOnly = await prisma.collectionJobRun.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CollectionJobRunFindManyArgs>(args?: SelectSubset<T, CollectionJobRunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CollectionJobRun.
     * @param {CollectionJobRunCreateArgs} args - Arguments to create a CollectionJobRun.
     * @example
     * // Create one CollectionJobRun
     * const CollectionJobRun = await prisma.collectionJobRun.create({
     *   data: {
     *     // ... data to create a CollectionJobRun
     *   }
     * })
     * 
     */
    create<T extends CollectionJobRunCreateArgs>(args: SelectSubset<T, CollectionJobRunCreateArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CollectionJobRuns.
     * @param {CollectionJobRunCreateManyArgs} args - Arguments to create many CollectionJobRuns.
     * @example
     * // Create many CollectionJobRuns
     * const collectionJobRun = await prisma.collectionJobRun.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CollectionJobRunCreateManyArgs>(args?: SelectSubset<T, CollectionJobRunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CollectionJobRuns and returns the data saved in the database.
     * @param {CollectionJobRunCreateManyAndReturnArgs} args - Arguments to create many CollectionJobRuns.
     * @example
     * // Create many CollectionJobRuns
     * const collectionJobRun = await prisma.collectionJobRun.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CollectionJobRuns and only return the `id`
     * const collectionJobRunWithIdOnly = await prisma.collectionJobRun.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CollectionJobRunCreateManyAndReturnArgs>(args?: SelectSubset<T, CollectionJobRunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CollectionJobRun.
     * @param {CollectionJobRunDeleteArgs} args - Arguments to delete one CollectionJobRun.
     * @example
     * // Delete one CollectionJobRun
     * const CollectionJobRun = await prisma.collectionJobRun.delete({
     *   where: {
     *     // ... filter to delete one CollectionJobRun
     *   }
     * })
     * 
     */
    delete<T extends CollectionJobRunDeleteArgs>(args: SelectSubset<T, CollectionJobRunDeleteArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CollectionJobRun.
     * @param {CollectionJobRunUpdateArgs} args - Arguments to update one CollectionJobRun.
     * @example
     * // Update one CollectionJobRun
     * const collectionJobRun = await prisma.collectionJobRun.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CollectionJobRunUpdateArgs>(args: SelectSubset<T, CollectionJobRunUpdateArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CollectionJobRuns.
     * @param {CollectionJobRunDeleteManyArgs} args - Arguments to filter CollectionJobRuns to delete.
     * @example
     * // Delete a few CollectionJobRuns
     * const { count } = await prisma.collectionJobRun.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CollectionJobRunDeleteManyArgs>(args?: SelectSubset<T, CollectionJobRunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CollectionJobRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobRunUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CollectionJobRuns
     * const collectionJobRun = await prisma.collectionJobRun.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CollectionJobRunUpdateManyArgs>(args: SelectSubset<T, CollectionJobRunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CollectionJobRuns and returns the data updated in the database.
     * @param {CollectionJobRunUpdateManyAndReturnArgs} args - Arguments to update many CollectionJobRuns.
     * @example
     * // Update many CollectionJobRuns
     * const collectionJobRun = await prisma.collectionJobRun.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CollectionJobRuns and only return the `id`
     * const collectionJobRunWithIdOnly = await prisma.collectionJobRun.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CollectionJobRunUpdateManyAndReturnArgs>(args: SelectSubset<T, CollectionJobRunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CollectionJobRun.
     * @param {CollectionJobRunUpsertArgs} args - Arguments to update or create a CollectionJobRun.
     * @example
     * // Update or create a CollectionJobRun
     * const collectionJobRun = await prisma.collectionJobRun.upsert({
     *   create: {
     *     // ... data to create a CollectionJobRun
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CollectionJobRun we want to update
     *   }
     * })
     */
    upsert<T extends CollectionJobRunUpsertArgs>(args: SelectSubset<T, CollectionJobRunUpsertArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CollectionJobRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobRunCountArgs} args - Arguments to filter CollectionJobRuns to count.
     * @example
     * // Count the number of CollectionJobRuns
     * const count = await prisma.collectionJobRun.count({
     *   where: {
     *     // ... the filter for the CollectionJobRuns we want to count
     *   }
     * })
    **/
    count<T extends CollectionJobRunCountArgs>(
      args?: Subset<T, CollectionJobRunCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CollectionJobRunCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CollectionJobRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobRunAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CollectionJobRunAggregateArgs>(args: Subset<T, CollectionJobRunAggregateArgs>): Prisma.PrismaPromise<GetCollectionJobRunAggregateType<T>>

    /**
     * Group by CollectionJobRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionJobRunGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CollectionJobRunGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CollectionJobRunGroupByArgs['orderBy'] }
        : { orderBy?: CollectionJobRunGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CollectionJobRunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCollectionJobRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CollectionJobRun model
   */
  readonly fields: CollectionJobRunFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CollectionJobRun.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CollectionJobRunClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    job<T extends CollectionJobDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CollectionJobDefaultArgs<ExtArgs>>): Prisma__CollectionJobClient<$Result.GetResult<Prisma.$CollectionJobPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    retries<T extends CollectionJobRun$retriesArgs<ExtArgs> = {}>(args?: Subset<T, CollectionJobRun$retriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CollectionJobRun model
   */
  interface CollectionJobRunFieldRefs {
    readonly id: FieldRef<"CollectionJobRun", 'String'>
    readonly jobId: FieldRef<"CollectionJobRun", 'String'>
    readonly tenantId: FieldRef<"CollectionJobRun", 'String'>
    readonly runNumber: FieldRef<"CollectionJobRun", 'Int'>
    readonly status: FieldRef<"CollectionJobRun", 'RunStatus'>
    readonly startedAt: FieldRef<"CollectionJobRun", 'DateTime'>
    readonly completedAt: FieldRef<"CollectionJobRun", 'DateTime'>
    readonly durationMs: FieldRef<"CollectionJobRun", 'Int'>
    readonly evidenceCount: FieldRef<"CollectionJobRun", 'Int'>
    readonly errorCount: FieldRef<"CollectionJobRun", 'Int'>
    readonly resultSummary: FieldRef<"CollectionJobRun", 'Json'>
    readonly errorDetails: FieldRef<"CollectionJobRun", 'String'>
    readonly createdAt: FieldRef<"CollectionJobRun", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CollectionJobRun findUnique
   */
  export type CollectionJobRunFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJobRun to fetch.
     */
    where: CollectionJobRunWhereUniqueInput
  }

  /**
   * CollectionJobRun findUniqueOrThrow
   */
  export type CollectionJobRunFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJobRun to fetch.
     */
    where: CollectionJobRunWhereUniqueInput
  }

  /**
   * CollectionJobRun findFirst
   */
  export type CollectionJobRunFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJobRun to fetch.
     */
    where?: CollectionJobRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionJobRuns to fetch.
     */
    orderBy?: CollectionJobRunOrderByWithRelationInput | CollectionJobRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CollectionJobRuns.
     */
    cursor?: CollectionJobRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionJobRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionJobRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionJobRuns.
     */
    distinct?: CollectionJobRunScalarFieldEnum | CollectionJobRunScalarFieldEnum[]
  }

  /**
   * CollectionJobRun findFirstOrThrow
   */
  export type CollectionJobRunFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJobRun to fetch.
     */
    where?: CollectionJobRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionJobRuns to fetch.
     */
    orderBy?: CollectionJobRunOrderByWithRelationInput | CollectionJobRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CollectionJobRuns.
     */
    cursor?: CollectionJobRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionJobRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionJobRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionJobRuns.
     */
    distinct?: CollectionJobRunScalarFieldEnum | CollectionJobRunScalarFieldEnum[]
  }

  /**
   * CollectionJobRun findMany
   */
  export type CollectionJobRunFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * Filter, which CollectionJobRuns to fetch.
     */
    where?: CollectionJobRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionJobRuns to fetch.
     */
    orderBy?: CollectionJobRunOrderByWithRelationInput | CollectionJobRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CollectionJobRuns.
     */
    cursor?: CollectionJobRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionJobRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionJobRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionJobRuns.
     */
    distinct?: CollectionJobRunScalarFieldEnum | CollectionJobRunScalarFieldEnum[]
  }

  /**
   * CollectionJobRun create
   */
  export type CollectionJobRunCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * The data needed to create a CollectionJobRun.
     */
    data: XOR<CollectionJobRunCreateInput, CollectionJobRunUncheckedCreateInput>
  }

  /**
   * CollectionJobRun createMany
   */
  export type CollectionJobRunCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CollectionJobRuns.
     */
    data: CollectionJobRunCreateManyInput | CollectionJobRunCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CollectionJobRun createManyAndReturn
   */
  export type CollectionJobRunCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * The data used to create many CollectionJobRuns.
     */
    data: CollectionJobRunCreateManyInput | CollectionJobRunCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CollectionJobRun update
   */
  export type CollectionJobRunUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * The data needed to update a CollectionJobRun.
     */
    data: XOR<CollectionJobRunUpdateInput, CollectionJobRunUncheckedUpdateInput>
    /**
     * Choose, which CollectionJobRun to update.
     */
    where: CollectionJobRunWhereUniqueInput
  }

  /**
   * CollectionJobRun updateMany
   */
  export type CollectionJobRunUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CollectionJobRuns.
     */
    data: XOR<CollectionJobRunUpdateManyMutationInput, CollectionJobRunUncheckedUpdateManyInput>
    /**
     * Filter which CollectionJobRuns to update
     */
    where?: CollectionJobRunWhereInput
    /**
     * Limit how many CollectionJobRuns to update.
     */
    limit?: number
  }

  /**
   * CollectionJobRun updateManyAndReturn
   */
  export type CollectionJobRunUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * The data used to update CollectionJobRuns.
     */
    data: XOR<CollectionJobRunUpdateManyMutationInput, CollectionJobRunUncheckedUpdateManyInput>
    /**
     * Filter which CollectionJobRuns to update
     */
    where?: CollectionJobRunWhereInput
    /**
     * Limit how many CollectionJobRuns to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CollectionJobRun upsert
   */
  export type CollectionJobRunUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * The filter to search for the CollectionJobRun to update in case it exists.
     */
    where: CollectionJobRunWhereUniqueInput
    /**
     * In case the CollectionJobRun found by the `where` argument doesn't exist, create a new CollectionJobRun with this data.
     */
    create: XOR<CollectionJobRunCreateInput, CollectionJobRunUncheckedCreateInput>
    /**
     * In case the CollectionJobRun was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CollectionJobRunUpdateInput, CollectionJobRunUncheckedUpdateInput>
  }

  /**
   * CollectionJobRun delete
   */
  export type CollectionJobRunDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
    /**
     * Filter which CollectionJobRun to delete.
     */
    where: CollectionJobRunWhereUniqueInput
  }

  /**
   * CollectionJobRun deleteMany
   */
  export type CollectionJobRunDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CollectionJobRuns to delete
     */
    where?: CollectionJobRunWhereInput
    /**
     * Limit how many CollectionJobRuns to delete.
     */
    limit?: number
  }

  /**
   * CollectionJobRun.retries
   */
  export type CollectionJobRun$retriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    where?: CollectionRetryWhereInput
    orderBy?: CollectionRetryOrderByWithRelationInput | CollectionRetryOrderByWithRelationInput[]
    cursor?: CollectionRetryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CollectionRetryScalarFieldEnum | CollectionRetryScalarFieldEnum[]
  }

  /**
   * CollectionJobRun without action
   */
  export type CollectionJobRunDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionJobRun
     */
    select?: CollectionJobRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionJobRun
     */
    omit?: CollectionJobRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionJobRunInclude<ExtArgs> | null
  }


  /**
   * Model CollectionRetry
   */

  export type AggregateCollectionRetry = {
    _count: CollectionRetryCountAggregateOutputType | null
    _avg: CollectionRetryAvgAggregateOutputType | null
    _sum: CollectionRetrySumAggregateOutputType | null
    _min: CollectionRetryMinAggregateOutputType | null
    _max: CollectionRetryMaxAggregateOutputType | null
  }

  export type CollectionRetryAvgAggregateOutputType = {
    attemptNumber: number | null
    maxAttempts: number | null
    backoffMs: number | null
  }

  export type CollectionRetrySumAggregateOutputType = {
    attemptNumber: number | null
    maxAttempts: number | null
    backoffMs: number | null
  }

  export type CollectionRetryMinAggregateOutputType = {
    id: string | null
    jobRunId: string | null
    tenantId: string | null
    attemptNumber: number | null
    status: $Enums.RetryStatus | null
    errorMessage: string | null
    scheduledAt: Date | null
    attemptedAt: Date | null
    nextRetryAt: Date | null
    maxAttempts: number | null
    backoffMs: number | null
    createdAt: Date | null
  }

  export type CollectionRetryMaxAggregateOutputType = {
    id: string | null
    jobRunId: string | null
    tenantId: string | null
    attemptNumber: number | null
    status: $Enums.RetryStatus | null
    errorMessage: string | null
    scheduledAt: Date | null
    attemptedAt: Date | null
    nextRetryAt: Date | null
    maxAttempts: number | null
    backoffMs: number | null
    createdAt: Date | null
  }

  export type CollectionRetryCountAggregateOutputType = {
    id: number
    jobRunId: number
    tenantId: number
    attemptNumber: number
    status: number
    errorMessage: number
    scheduledAt: number
    attemptedAt: number
    nextRetryAt: number
    maxAttempts: number
    backoffMs: number
    createdAt: number
    _all: number
  }


  export type CollectionRetryAvgAggregateInputType = {
    attemptNumber?: true
    maxAttempts?: true
    backoffMs?: true
  }

  export type CollectionRetrySumAggregateInputType = {
    attemptNumber?: true
    maxAttempts?: true
    backoffMs?: true
  }

  export type CollectionRetryMinAggregateInputType = {
    id?: true
    jobRunId?: true
    tenantId?: true
    attemptNumber?: true
    status?: true
    errorMessage?: true
    scheduledAt?: true
    attemptedAt?: true
    nextRetryAt?: true
    maxAttempts?: true
    backoffMs?: true
    createdAt?: true
  }

  export type CollectionRetryMaxAggregateInputType = {
    id?: true
    jobRunId?: true
    tenantId?: true
    attemptNumber?: true
    status?: true
    errorMessage?: true
    scheduledAt?: true
    attemptedAt?: true
    nextRetryAt?: true
    maxAttempts?: true
    backoffMs?: true
    createdAt?: true
  }

  export type CollectionRetryCountAggregateInputType = {
    id?: true
    jobRunId?: true
    tenantId?: true
    attemptNumber?: true
    status?: true
    errorMessage?: true
    scheduledAt?: true
    attemptedAt?: true
    nextRetryAt?: true
    maxAttempts?: true
    backoffMs?: true
    createdAt?: true
    _all?: true
  }

  export type CollectionRetryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CollectionRetry to aggregate.
     */
    where?: CollectionRetryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionRetries to fetch.
     */
    orderBy?: CollectionRetryOrderByWithRelationInput | CollectionRetryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CollectionRetryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionRetries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionRetries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CollectionRetries
    **/
    _count?: true | CollectionRetryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CollectionRetryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CollectionRetrySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CollectionRetryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CollectionRetryMaxAggregateInputType
  }

  export type GetCollectionRetryAggregateType<T extends CollectionRetryAggregateArgs> = {
        [P in keyof T & keyof AggregateCollectionRetry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCollectionRetry[P]>
      : GetScalarType<T[P], AggregateCollectionRetry[P]>
  }




  export type CollectionRetryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CollectionRetryWhereInput
    orderBy?: CollectionRetryOrderByWithAggregationInput | CollectionRetryOrderByWithAggregationInput[]
    by: CollectionRetryScalarFieldEnum[] | CollectionRetryScalarFieldEnum
    having?: CollectionRetryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CollectionRetryCountAggregateInputType | true
    _avg?: CollectionRetryAvgAggregateInputType
    _sum?: CollectionRetrySumAggregateInputType
    _min?: CollectionRetryMinAggregateInputType
    _max?: CollectionRetryMaxAggregateInputType
  }

  export type CollectionRetryGroupByOutputType = {
    id: string
    jobRunId: string
    tenantId: string
    attemptNumber: number
    status: $Enums.RetryStatus
    errorMessage: string | null
    scheduledAt: Date
    attemptedAt: Date | null
    nextRetryAt: Date | null
    maxAttempts: number
    backoffMs: number
    createdAt: Date
    _count: CollectionRetryCountAggregateOutputType | null
    _avg: CollectionRetryAvgAggregateOutputType | null
    _sum: CollectionRetrySumAggregateOutputType | null
    _min: CollectionRetryMinAggregateOutputType | null
    _max: CollectionRetryMaxAggregateOutputType | null
  }

  type GetCollectionRetryGroupByPayload<T extends CollectionRetryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CollectionRetryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CollectionRetryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CollectionRetryGroupByOutputType[P]>
            : GetScalarType<T[P], CollectionRetryGroupByOutputType[P]>
        }
      >
    >


  export type CollectionRetrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobRunId?: boolean
    tenantId?: boolean
    attemptNumber?: boolean
    status?: boolean
    errorMessage?: boolean
    scheduledAt?: boolean
    attemptedAt?: boolean
    nextRetryAt?: boolean
    maxAttempts?: boolean
    backoffMs?: boolean
    createdAt?: boolean
    jobRun?: boolean | CollectionJobRunDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionRetry"]>

  export type CollectionRetrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobRunId?: boolean
    tenantId?: boolean
    attemptNumber?: boolean
    status?: boolean
    errorMessage?: boolean
    scheduledAt?: boolean
    attemptedAt?: boolean
    nextRetryAt?: boolean
    maxAttempts?: boolean
    backoffMs?: boolean
    createdAt?: boolean
    jobRun?: boolean | CollectionJobRunDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionRetry"]>

  export type CollectionRetrySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    jobRunId?: boolean
    tenantId?: boolean
    attemptNumber?: boolean
    status?: boolean
    errorMessage?: boolean
    scheduledAt?: boolean
    attemptedAt?: boolean
    nextRetryAt?: boolean
    maxAttempts?: boolean
    backoffMs?: boolean
    createdAt?: boolean
    jobRun?: boolean | CollectionJobRunDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["collectionRetry"]>

  export type CollectionRetrySelectScalar = {
    id?: boolean
    jobRunId?: boolean
    tenantId?: boolean
    attemptNumber?: boolean
    status?: boolean
    errorMessage?: boolean
    scheduledAt?: boolean
    attemptedAt?: boolean
    nextRetryAt?: boolean
    maxAttempts?: boolean
    backoffMs?: boolean
    createdAt?: boolean
  }

  export type CollectionRetryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "jobRunId" | "tenantId" | "attemptNumber" | "status" | "errorMessage" | "scheduledAt" | "attemptedAt" | "nextRetryAt" | "maxAttempts" | "backoffMs" | "createdAt", ExtArgs["result"]["collectionRetry"]>
  export type CollectionRetryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobRun?: boolean | CollectionJobRunDefaultArgs<ExtArgs>
  }
  export type CollectionRetryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobRun?: boolean | CollectionJobRunDefaultArgs<ExtArgs>
  }
  export type CollectionRetryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    jobRun?: boolean | CollectionJobRunDefaultArgs<ExtArgs>
  }

  export type $CollectionRetryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CollectionRetry"
    objects: {
      jobRun: Prisma.$CollectionJobRunPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      jobRunId: string
      tenantId: string
      attemptNumber: number
      status: $Enums.RetryStatus
      errorMessage: string | null
      scheduledAt: Date
      attemptedAt: Date | null
      nextRetryAt: Date | null
      maxAttempts: number
      backoffMs: number
      createdAt: Date
    }, ExtArgs["result"]["collectionRetry"]>
    composites: {}
  }

  type CollectionRetryGetPayload<S extends boolean | null | undefined | CollectionRetryDefaultArgs> = $Result.GetResult<Prisma.$CollectionRetryPayload, S>

  type CollectionRetryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CollectionRetryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CollectionRetryCountAggregateInputType | true
    }

  export interface CollectionRetryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CollectionRetry'], meta: { name: 'CollectionRetry' } }
    /**
     * Find zero or one CollectionRetry that matches the filter.
     * @param {CollectionRetryFindUniqueArgs} args - Arguments to find a CollectionRetry
     * @example
     * // Get one CollectionRetry
     * const collectionRetry = await prisma.collectionRetry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CollectionRetryFindUniqueArgs>(args: SelectSubset<T, CollectionRetryFindUniqueArgs<ExtArgs>>): Prisma__CollectionRetryClient<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CollectionRetry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CollectionRetryFindUniqueOrThrowArgs} args - Arguments to find a CollectionRetry
     * @example
     * // Get one CollectionRetry
     * const collectionRetry = await prisma.collectionRetry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CollectionRetryFindUniqueOrThrowArgs>(args: SelectSubset<T, CollectionRetryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CollectionRetryClient<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CollectionRetry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionRetryFindFirstArgs} args - Arguments to find a CollectionRetry
     * @example
     * // Get one CollectionRetry
     * const collectionRetry = await prisma.collectionRetry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CollectionRetryFindFirstArgs>(args?: SelectSubset<T, CollectionRetryFindFirstArgs<ExtArgs>>): Prisma__CollectionRetryClient<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CollectionRetry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionRetryFindFirstOrThrowArgs} args - Arguments to find a CollectionRetry
     * @example
     * // Get one CollectionRetry
     * const collectionRetry = await prisma.collectionRetry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CollectionRetryFindFirstOrThrowArgs>(args?: SelectSubset<T, CollectionRetryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CollectionRetryClient<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CollectionRetries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionRetryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CollectionRetries
     * const collectionRetries = await prisma.collectionRetry.findMany()
     * 
     * // Get first 10 CollectionRetries
     * const collectionRetries = await prisma.collectionRetry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const collectionRetryWithIdOnly = await prisma.collectionRetry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CollectionRetryFindManyArgs>(args?: SelectSubset<T, CollectionRetryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CollectionRetry.
     * @param {CollectionRetryCreateArgs} args - Arguments to create a CollectionRetry.
     * @example
     * // Create one CollectionRetry
     * const CollectionRetry = await prisma.collectionRetry.create({
     *   data: {
     *     // ... data to create a CollectionRetry
     *   }
     * })
     * 
     */
    create<T extends CollectionRetryCreateArgs>(args: SelectSubset<T, CollectionRetryCreateArgs<ExtArgs>>): Prisma__CollectionRetryClient<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CollectionRetries.
     * @param {CollectionRetryCreateManyArgs} args - Arguments to create many CollectionRetries.
     * @example
     * // Create many CollectionRetries
     * const collectionRetry = await prisma.collectionRetry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CollectionRetryCreateManyArgs>(args?: SelectSubset<T, CollectionRetryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CollectionRetries and returns the data saved in the database.
     * @param {CollectionRetryCreateManyAndReturnArgs} args - Arguments to create many CollectionRetries.
     * @example
     * // Create many CollectionRetries
     * const collectionRetry = await prisma.collectionRetry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CollectionRetries and only return the `id`
     * const collectionRetryWithIdOnly = await prisma.collectionRetry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CollectionRetryCreateManyAndReturnArgs>(args?: SelectSubset<T, CollectionRetryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CollectionRetry.
     * @param {CollectionRetryDeleteArgs} args - Arguments to delete one CollectionRetry.
     * @example
     * // Delete one CollectionRetry
     * const CollectionRetry = await prisma.collectionRetry.delete({
     *   where: {
     *     // ... filter to delete one CollectionRetry
     *   }
     * })
     * 
     */
    delete<T extends CollectionRetryDeleteArgs>(args: SelectSubset<T, CollectionRetryDeleteArgs<ExtArgs>>): Prisma__CollectionRetryClient<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CollectionRetry.
     * @param {CollectionRetryUpdateArgs} args - Arguments to update one CollectionRetry.
     * @example
     * // Update one CollectionRetry
     * const collectionRetry = await prisma.collectionRetry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CollectionRetryUpdateArgs>(args: SelectSubset<T, CollectionRetryUpdateArgs<ExtArgs>>): Prisma__CollectionRetryClient<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CollectionRetries.
     * @param {CollectionRetryDeleteManyArgs} args - Arguments to filter CollectionRetries to delete.
     * @example
     * // Delete a few CollectionRetries
     * const { count } = await prisma.collectionRetry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CollectionRetryDeleteManyArgs>(args?: SelectSubset<T, CollectionRetryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CollectionRetries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionRetryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CollectionRetries
     * const collectionRetry = await prisma.collectionRetry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CollectionRetryUpdateManyArgs>(args: SelectSubset<T, CollectionRetryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CollectionRetries and returns the data updated in the database.
     * @param {CollectionRetryUpdateManyAndReturnArgs} args - Arguments to update many CollectionRetries.
     * @example
     * // Update many CollectionRetries
     * const collectionRetry = await prisma.collectionRetry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CollectionRetries and only return the `id`
     * const collectionRetryWithIdOnly = await prisma.collectionRetry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CollectionRetryUpdateManyAndReturnArgs>(args: SelectSubset<T, CollectionRetryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CollectionRetry.
     * @param {CollectionRetryUpsertArgs} args - Arguments to update or create a CollectionRetry.
     * @example
     * // Update or create a CollectionRetry
     * const collectionRetry = await prisma.collectionRetry.upsert({
     *   create: {
     *     // ... data to create a CollectionRetry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CollectionRetry we want to update
     *   }
     * })
     */
    upsert<T extends CollectionRetryUpsertArgs>(args: SelectSubset<T, CollectionRetryUpsertArgs<ExtArgs>>): Prisma__CollectionRetryClient<$Result.GetResult<Prisma.$CollectionRetryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CollectionRetries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionRetryCountArgs} args - Arguments to filter CollectionRetries to count.
     * @example
     * // Count the number of CollectionRetries
     * const count = await prisma.collectionRetry.count({
     *   where: {
     *     // ... the filter for the CollectionRetries we want to count
     *   }
     * })
    **/
    count<T extends CollectionRetryCountArgs>(
      args?: Subset<T, CollectionRetryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CollectionRetryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CollectionRetry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionRetryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CollectionRetryAggregateArgs>(args: Subset<T, CollectionRetryAggregateArgs>): Prisma.PrismaPromise<GetCollectionRetryAggregateType<T>>

    /**
     * Group by CollectionRetry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CollectionRetryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CollectionRetryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CollectionRetryGroupByArgs['orderBy'] }
        : { orderBy?: CollectionRetryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CollectionRetryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCollectionRetryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CollectionRetry model
   */
  readonly fields: CollectionRetryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CollectionRetry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CollectionRetryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    jobRun<T extends CollectionJobRunDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CollectionJobRunDefaultArgs<ExtArgs>>): Prisma__CollectionJobRunClient<$Result.GetResult<Prisma.$CollectionJobRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CollectionRetry model
   */
  interface CollectionRetryFieldRefs {
    readonly id: FieldRef<"CollectionRetry", 'String'>
    readonly jobRunId: FieldRef<"CollectionRetry", 'String'>
    readonly tenantId: FieldRef<"CollectionRetry", 'String'>
    readonly attemptNumber: FieldRef<"CollectionRetry", 'Int'>
    readonly status: FieldRef<"CollectionRetry", 'RetryStatus'>
    readonly errorMessage: FieldRef<"CollectionRetry", 'String'>
    readonly scheduledAt: FieldRef<"CollectionRetry", 'DateTime'>
    readonly attemptedAt: FieldRef<"CollectionRetry", 'DateTime'>
    readonly nextRetryAt: FieldRef<"CollectionRetry", 'DateTime'>
    readonly maxAttempts: FieldRef<"CollectionRetry", 'Int'>
    readonly backoffMs: FieldRef<"CollectionRetry", 'Int'>
    readonly createdAt: FieldRef<"CollectionRetry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CollectionRetry findUnique
   */
  export type CollectionRetryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * Filter, which CollectionRetry to fetch.
     */
    where: CollectionRetryWhereUniqueInput
  }

  /**
   * CollectionRetry findUniqueOrThrow
   */
  export type CollectionRetryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * Filter, which CollectionRetry to fetch.
     */
    where: CollectionRetryWhereUniqueInput
  }

  /**
   * CollectionRetry findFirst
   */
  export type CollectionRetryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * Filter, which CollectionRetry to fetch.
     */
    where?: CollectionRetryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionRetries to fetch.
     */
    orderBy?: CollectionRetryOrderByWithRelationInput | CollectionRetryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CollectionRetries.
     */
    cursor?: CollectionRetryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionRetries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionRetries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionRetries.
     */
    distinct?: CollectionRetryScalarFieldEnum | CollectionRetryScalarFieldEnum[]
  }

  /**
   * CollectionRetry findFirstOrThrow
   */
  export type CollectionRetryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * Filter, which CollectionRetry to fetch.
     */
    where?: CollectionRetryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionRetries to fetch.
     */
    orderBy?: CollectionRetryOrderByWithRelationInput | CollectionRetryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CollectionRetries.
     */
    cursor?: CollectionRetryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionRetries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionRetries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionRetries.
     */
    distinct?: CollectionRetryScalarFieldEnum | CollectionRetryScalarFieldEnum[]
  }

  /**
   * CollectionRetry findMany
   */
  export type CollectionRetryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * Filter, which CollectionRetries to fetch.
     */
    where?: CollectionRetryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CollectionRetries to fetch.
     */
    orderBy?: CollectionRetryOrderByWithRelationInput | CollectionRetryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CollectionRetries.
     */
    cursor?: CollectionRetryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CollectionRetries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CollectionRetries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CollectionRetries.
     */
    distinct?: CollectionRetryScalarFieldEnum | CollectionRetryScalarFieldEnum[]
  }

  /**
   * CollectionRetry create
   */
  export type CollectionRetryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * The data needed to create a CollectionRetry.
     */
    data: XOR<CollectionRetryCreateInput, CollectionRetryUncheckedCreateInput>
  }

  /**
   * CollectionRetry createMany
   */
  export type CollectionRetryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CollectionRetries.
     */
    data: CollectionRetryCreateManyInput | CollectionRetryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CollectionRetry createManyAndReturn
   */
  export type CollectionRetryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * The data used to create many CollectionRetries.
     */
    data: CollectionRetryCreateManyInput | CollectionRetryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CollectionRetry update
   */
  export type CollectionRetryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * The data needed to update a CollectionRetry.
     */
    data: XOR<CollectionRetryUpdateInput, CollectionRetryUncheckedUpdateInput>
    /**
     * Choose, which CollectionRetry to update.
     */
    where: CollectionRetryWhereUniqueInput
  }

  /**
   * CollectionRetry updateMany
   */
  export type CollectionRetryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CollectionRetries.
     */
    data: XOR<CollectionRetryUpdateManyMutationInput, CollectionRetryUncheckedUpdateManyInput>
    /**
     * Filter which CollectionRetries to update
     */
    where?: CollectionRetryWhereInput
    /**
     * Limit how many CollectionRetries to update.
     */
    limit?: number
  }

  /**
   * CollectionRetry updateManyAndReturn
   */
  export type CollectionRetryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * The data used to update CollectionRetries.
     */
    data: XOR<CollectionRetryUpdateManyMutationInput, CollectionRetryUncheckedUpdateManyInput>
    /**
     * Filter which CollectionRetries to update
     */
    where?: CollectionRetryWhereInput
    /**
     * Limit how many CollectionRetries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CollectionRetry upsert
   */
  export type CollectionRetryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * The filter to search for the CollectionRetry to update in case it exists.
     */
    where: CollectionRetryWhereUniqueInput
    /**
     * In case the CollectionRetry found by the `where` argument doesn't exist, create a new CollectionRetry with this data.
     */
    create: XOR<CollectionRetryCreateInput, CollectionRetryUncheckedCreateInput>
    /**
     * In case the CollectionRetry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CollectionRetryUpdateInput, CollectionRetryUncheckedUpdateInput>
  }

  /**
   * CollectionRetry delete
   */
  export type CollectionRetryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
    /**
     * Filter which CollectionRetry to delete.
     */
    where: CollectionRetryWhereUniqueInput
  }

  /**
   * CollectionRetry deleteMany
   */
  export type CollectionRetryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CollectionRetries to delete
     */
    where?: CollectionRetryWhereInput
    /**
     * Limit how many CollectionRetries to delete.
     */
    limit?: number
  }

  /**
   * CollectionRetry without action
   */
  export type CollectionRetryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CollectionRetry
     */
    select?: CollectionRetrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CollectionRetry
     */
    omit?: CollectionRetryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CollectionRetryInclude<ExtArgs> | null
  }


  /**
   * Model SecretVault
   */

  export type AggregateSecretVault = {
    _count: SecretVaultCountAggregateOutputType | null
    _min: SecretVaultMinAggregateOutputType | null
    _max: SecretVaultMaxAggregateOutputType | null
  }

  export type SecretVaultMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    scope: $Enums.SecretScope | null
    ownerType: string | null
    ownerId: string | null
    encryptedPayload: string | null
    kmsKeyId: string | null
    rotatedAt: Date | null
    expiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SecretVaultMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    scope: $Enums.SecretScope | null
    ownerType: string | null
    ownerId: string | null
    encryptedPayload: string | null
    kmsKeyId: string | null
    rotatedAt: Date | null
    expiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SecretVaultCountAggregateOutputType = {
    id: number
    tenantId: number
    scope: number
    ownerType: number
    ownerId: number
    encryptedPayload: number
    kmsKeyId: number
    rotatedAt: number
    expiresAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SecretVaultMinAggregateInputType = {
    id?: true
    tenantId?: true
    scope?: true
    ownerType?: true
    ownerId?: true
    encryptedPayload?: true
    kmsKeyId?: true
    rotatedAt?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SecretVaultMaxAggregateInputType = {
    id?: true
    tenantId?: true
    scope?: true
    ownerType?: true
    ownerId?: true
    encryptedPayload?: true
    kmsKeyId?: true
    rotatedAt?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SecretVaultCountAggregateInputType = {
    id?: true
    tenantId?: true
    scope?: true
    ownerType?: true
    ownerId?: true
    encryptedPayload?: true
    kmsKeyId?: true
    rotatedAt?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SecretVaultAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SecretVault to aggregate.
     */
    where?: SecretVaultWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecretVaults to fetch.
     */
    orderBy?: SecretVaultOrderByWithRelationInput | SecretVaultOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SecretVaultWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecretVaults from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecretVaults.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SecretVaults
    **/
    _count?: true | SecretVaultCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SecretVaultMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SecretVaultMaxAggregateInputType
  }

  export type GetSecretVaultAggregateType<T extends SecretVaultAggregateArgs> = {
        [P in keyof T & keyof AggregateSecretVault]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSecretVault[P]>
      : GetScalarType<T[P], AggregateSecretVault[P]>
  }




  export type SecretVaultGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SecretVaultWhereInput
    orderBy?: SecretVaultOrderByWithAggregationInput | SecretVaultOrderByWithAggregationInput[]
    by: SecretVaultScalarFieldEnum[] | SecretVaultScalarFieldEnum
    having?: SecretVaultScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SecretVaultCountAggregateInputType | true
    _min?: SecretVaultMinAggregateInputType
    _max?: SecretVaultMaxAggregateInputType
  }

  export type SecretVaultGroupByOutputType = {
    id: string
    tenantId: string
    scope: $Enums.SecretScope
    ownerType: string
    ownerId: string
    encryptedPayload: string
    kmsKeyId: string | null
    rotatedAt: Date | null
    expiresAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: SecretVaultCountAggregateOutputType | null
    _min: SecretVaultMinAggregateOutputType | null
    _max: SecretVaultMaxAggregateOutputType | null
  }

  type GetSecretVaultGroupByPayload<T extends SecretVaultGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SecretVaultGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SecretVaultGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SecretVaultGroupByOutputType[P]>
            : GetScalarType<T[P], SecretVaultGroupByOutputType[P]>
        }
      >
    >


  export type SecretVaultSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    scope?: boolean
    ownerType?: boolean
    ownerId?: boolean
    encryptedPayload?: boolean
    kmsKeyId?: boolean
    rotatedAt?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["secretVault"]>

  export type SecretVaultSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    scope?: boolean
    ownerType?: boolean
    ownerId?: boolean
    encryptedPayload?: boolean
    kmsKeyId?: boolean
    rotatedAt?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["secretVault"]>

  export type SecretVaultSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    scope?: boolean
    ownerType?: boolean
    ownerId?: boolean
    encryptedPayload?: boolean
    kmsKeyId?: boolean
    rotatedAt?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["secretVault"]>

  export type SecretVaultSelectScalar = {
    id?: boolean
    tenantId?: boolean
    scope?: boolean
    ownerType?: boolean
    ownerId?: boolean
    encryptedPayload?: boolean
    kmsKeyId?: boolean
    rotatedAt?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SecretVaultOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "scope" | "ownerType" | "ownerId" | "encryptedPayload" | "kmsKeyId" | "rotatedAt" | "expiresAt" | "createdAt" | "updatedAt", ExtArgs["result"]["secretVault"]>

  export type $SecretVaultPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SecretVault"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      scope: $Enums.SecretScope
      ownerType: string
      ownerId: string
      encryptedPayload: string
      kmsKeyId: string | null
      rotatedAt: Date | null
      expiresAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["secretVault"]>
    composites: {}
  }

  type SecretVaultGetPayload<S extends boolean | null | undefined | SecretVaultDefaultArgs> = $Result.GetResult<Prisma.$SecretVaultPayload, S>

  type SecretVaultCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SecretVaultFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SecretVaultCountAggregateInputType | true
    }

  export interface SecretVaultDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SecretVault'], meta: { name: 'SecretVault' } }
    /**
     * Find zero or one SecretVault that matches the filter.
     * @param {SecretVaultFindUniqueArgs} args - Arguments to find a SecretVault
     * @example
     * // Get one SecretVault
     * const secretVault = await prisma.secretVault.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SecretVaultFindUniqueArgs>(args: SelectSubset<T, SecretVaultFindUniqueArgs<ExtArgs>>): Prisma__SecretVaultClient<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SecretVault that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SecretVaultFindUniqueOrThrowArgs} args - Arguments to find a SecretVault
     * @example
     * // Get one SecretVault
     * const secretVault = await prisma.secretVault.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SecretVaultFindUniqueOrThrowArgs>(args: SelectSubset<T, SecretVaultFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SecretVaultClient<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SecretVault that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretVaultFindFirstArgs} args - Arguments to find a SecretVault
     * @example
     * // Get one SecretVault
     * const secretVault = await prisma.secretVault.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SecretVaultFindFirstArgs>(args?: SelectSubset<T, SecretVaultFindFirstArgs<ExtArgs>>): Prisma__SecretVaultClient<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SecretVault that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretVaultFindFirstOrThrowArgs} args - Arguments to find a SecretVault
     * @example
     * // Get one SecretVault
     * const secretVault = await prisma.secretVault.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SecretVaultFindFirstOrThrowArgs>(args?: SelectSubset<T, SecretVaultFindFirstOrThrowArgs<ExtArgs>>): Prisma__SecretVaultClient<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SecretVaults that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretVaultFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SecretVaults
     * const secretVaults = await prisma.secretVault.findMany()
     * 
     * // Get first 10 SecretVaults
     * const secretVaults = await prisma.secretVault.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const secretVaultWithIdOnly = await prisma.secretVault.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SecretVaultFindManyArgs>(args?: SelectSubset<T, SecretVaultFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SecretVault.
     * @param {SecretVaultCreateArgs} args - Arguments to create a SecretVault.
     * @example
     * // Create one SecretVault
     * const SecretVault = await prisma.secretVault.create({
     *   data: {
     *     // ... data to create a SecretVault
     *   }
     * })
     * 
     */
    create<T extends SecretVaultCreateArgs>(args: SelectSubset<T, SecretVaultCreateArgs<ExtArgs>>): Prisma__SecretVaultClient<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SecretVaults.
     * @param {SecretVaultCreateManyArgs} args - Arguments to create many SecretVaults.
     * @example
     * // Create many SecretVaults
     * const secretVault = await prisma.secretVault.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SecretVaultCreateManyArgs>(args?: SelectSubset<T, SecretVaultCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SecretVaults and returns the data saved in the database.
     * @param {SecretVaultCreateManyAndReturnArgs} args - Arguments to create many SecretVaults.
     * @example
     * // Create many SecretVaults
     * const secretVault = await prisma.secretVault.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SecretVaults and only return the `id`
     * const secretVaultWithIdOnly = await prisma.secretVault.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SecretVaultCreateManyAndReturnArgs>(args?: SelectSubset<T, SecretVaultCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SecretVault.
     * @param {SecretVaultDeleteArgs} args - Arguments to delete one SecretVault.
     * @example
     * // Delete one SecretVault
     * const SecretVault = await prisma.secretVault.delete({
     *   where: {
     *     // ... filter to delete one SecretVault
     *   }
     * })
     * 
     */
    delete<T extends SecretVaultDeleteArgs>(args: SelectSubset<T, SecretVaultDeleteArgs<ExtArgs>>): Prisma__SecretVaultClient<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SecretVault.
     * @param {SecretVaultUpdateArgs} args - Arguments to update one SecretVault.
     * @example
     * // Update one SecretVault
     * const secretVault = await prisma.secretVault.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SecretVaultUpdateArgs>(args: SelectSubset<T, SecretVaultUpdateArgs<ExtArgs>>): Prisma__SecretVaultClient<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SecretVaults.
     * @param {SecretVaultDeleteManyArgs} args - Arguments to filter SecretVaults to delete.
     * @example
     * // Delete a few SecretVaults
     * const { count } = await prisma.secretVault.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SecretVaultDeleteManyArgs>(args?: SelectSubset<T, SecretVaultDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SecretVaults.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretVaultUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SecretVaults
     * const secretVault = await prisma.secretVault.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SecretVaultUpdateManyArgs>(args: SelectSubset<T, SecretVaultUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SecretVaults and returns the data updated in the database.
     * @param {SecretVaultUpdateManyAndReturnArgs} args - Arguments to update many SecretVaults.
     * @example
     * // Update many SecretVaults
     * const secretVault = await prisma.secretVault.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SecretVaults and only return the `id`
     * const secretVaultWithIdOnly = await prisma.secretVault.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SecretVaultUpdateManyAndReturnArgs>(args: SelectSubset<T, SecretVaultUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SecretVault.
     * @param {SecretVaultUpsertArgs} args - Arguments to update or create a SecretVault.
     * @example
     * // Update or create a SecretVault
     * const secretVault = await prisma.secretVault.upsert({
     *   create: {
     *     // ... data to create a SecretVault
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SecretVault we want to update
     *   }
     * })
     */
    upsert<T extends SecretVaultUpsertArgs>(args: SelectSubset<T, SecretVaultUpsertArgs<ExtArgs>>): Prisma__SecretVaultClient<$Result.GetResult<Prisma.$SecretVaultPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SecretVaults.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretVaultCountArgs} args - Arguments to filter SecretVaults to count.
     * @example
     * // Count the number of SecretVaults
     * const count = await prisma.secretVault.count({
     *   where: {
     *     // ... the filter for the SecretVaults we want to count
     *   }
     * })
    **/
    count<T extends SecretVaultCountArgs>(
      args?: Subset<T, SecretVaultCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SecretVaultCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SecretVault.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretVaultAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SecretVaultAggregateArgs>(args: Subset<T, SecretVaultAggregateArgs>): Prisma.PrismaPromise<GetSecretVaultAggregateType<T>>

    /**
     * Group by SecretVault.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretVaultGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SecretVaultGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SecretVaultGroupByArgs['orderBy'] }
        : { orderBy?: SecretVaultGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SecretVaultGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSecretVaultGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SecretVault model
   */
  readonly fields: SecretVaultFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SecretVault.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SecretVaultClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SecretVault model
   */
  interface SecretVaultFieldRefs {
    readonly id: FieldRef<"SecretVault", 'String'>
    readonly tenantId: FieldRef<"SecretVault", 'String'>
    readonly scope: FieldRef<"SecretVault", 'SecretScope'>
    readonly ownerType: FieldRef<"SecretVault", 'String'>
    readonly ownerId: FieldRef<"SecretVault", 'String'>
    readonly encryptedPayload: FieldRef<"SecretVault", 'String'>
    readonly kmsKeyId: FieldRef<"SecretVault", 'String'>
    readonly rotatedAt: FieldRef<"SecretVault", 'DateTime'>
    readonly expiresAt: FieldRef<"SecretVault", 'DateTime'>
    readonly createdAt: FieldRef<"SecretVault", 'DateTime'>
    readonly updatedAt: FieldRef<"SecretVault", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SecretVault findUnique
   */
  export type SecretVaultFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * Filter, which SecretVault to fetch.
     */
    where: SecretVaultWhereUniqueInput
  }

  /**
   * SecretVault findUniqueOrThrow
   */
  export type SecretVaultFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * Filter, which SecretVault to fetch.
     */
    where: SecretVaultWhereUniqueInput
  }

  /**
   * SecretVault findFirst
   */
  export type SecretVaultFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * Filter, which SecretVault to fetch.
     */
    where?: SecretVaultWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecretVaults to fetch.
     */
    orderBy?: SecretVaultOrderByWithRelationInput | SecretVaultOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SecretVaults.
     */
    cursor?: SecretVaultWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecretVaults from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecretVaults.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SecretVaults.
     */
    distinct?: SecretVaultScalarFieldEnum | SecretVaultScalarFieldEnum[]
  }

  /**
   * SecretVault findFirstOrThrow
   */
  export type SecretVaultFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * Filter, which SecretVault to fetch.
     */
    where?: SecretVaultWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecretVaults to fetch.
     */
    orderBy?: SecretVaultOrderByWithRelationInput | SecretVaultOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SecretVaults.
     */
    cursor?: SecretVaultWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecretVaults from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecretVaults.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SecretVaults.
     */
    distinct?: SecretVaultScalarFieldEnum | SecretVaultScalarFieldEnum[]
  }

  /**
   * SecretVault findMany
   */
  export type SecretVaultFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * Filter, which SecretVaults to fetch.
     */
    where?: SecretVaultWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecretVaults to fetch.
     */
    orderBy?: SecretVaultOrderByWithRelationInput | SecretVaultOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SecretVaults.
     */
    cursor?: SecretVaultWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecretVaults from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecretVaults.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SecretVaults.
     */
    distinct?: SecretVaultScalarFieldEnum | SecretVaultScalarFieldEnum[]
  }

  /**
   * SecretVault create
   */
  export type SecretVaultCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * The data needed to create a SecretVault.
     */
    data: XOR<SecretVaultCreateInput, SecretVaultUncheckedCreateInput>
  }

  /**
   * SecretVault createMany
   */
  export type SecretVaultCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SecretVaults.
     */
    data: SecretVaultCreateManyInput | SecretVaultCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SecretVault createManyAndReturn
   */
  export type SecretVaultCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * The data used to create many SecretVaults.
     */
    data: SecretVaultCreateManyInput | SecretVaultCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SecretVault update
   */
  export type SecretVaultUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * The data needed to update a SecretVault.
     */
    data: XOR<SecretVaultUpdateInput, SecretVaultUncheckedUpdateInput>
    /**
     * Choose, which SecretVault to update.
     */
    where: SecretVaultWhereUniqueInput
  }

  /**
   * SecretVault updateMany
   */
  export type SecretVaultUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SecretVaults.
     */
    data: XOR<SecretVaultUpdateManyMutationInput, SecretVaultUncheckedUpdateManyInput>
    /**
     * Filter which SecretVaults to update
     */
    where?: SecretVaultWhereInput
    /**
     * Limit how many SecretVaults to update.
     */
    limit?: number
  }

  /**
   * SecretVault updateManyAndReturn
   */
  export type SecretVaultUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * The data used to update SecretVaults.
     */
    data: XOR<SecretVaultUpdateManyMutationInput, SecretVaultUncheckedUpdateManyInput>
    /**
     * Filter which SecretVaults to update
     */
    where?: SecretVaultWhereInput
    /**
     * Limit how many SecretVaults to update.
     */
    limit?: number
  }

  /**
   * SecretVault upsert
   */
  export type SecretVaultUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * The filter to search for the SecretVault to update in case it exists.
     */
    where: SecretVaultWhereUniqueInput
    /**
     * In case the SecretVault found by the `where` argument doesn't exist, create a new SecretVault with this data.
     */
    create: XOR<SecretVaultCreateInput, SecretVaultUncheckedCreateInput>
    /**
     * In case the SecretVault was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SecretVaultUpdateInput, SecretVaultUncheckedUpdateInput>
  }

  /**
   * SecretVault delete
   */
  export type SecretVaultDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
    /**
     * Filter which SecretVault to delete.
     */
    where: SecretVaultWhereUniqueInput
  }

  /**
   * SecretVault deleteMany
   */
  export type SecretVaultDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SecretVaults to delete
     */
    where?: SecretVaultWhereInput
    /**
     * Limit how many SecretVaults to delete.
     */
    limit?: number
  }

  /**
   * SecretVault without action
   */
  export type SecretVaultDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretVault
     */
    select?: SecretVaultSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretVault
     */
    omit?: SecretVaultOmit<ExtArgs> | null
  }


  /**
   * Model SyncLog
   */

  export type AggregateSyncLog = {
    _count: SyncLogCountAggregateOutputType | null
    _avg: SyncLogAvgAggregateOutputType | null
    _sum: SyncLogSumAggregateOutputType | null
    _min: SyncLogMinAggregateOutputType | null
    _max: SyncLogMaxAggregateOutputType | null
  }

  export type SyncLogAvgAggregateOutputType = {
    recordsProcessed: number | null
    recordsFailed: number | null
  }

  export type SyncLogSumAggregateOutputType = {
    recordsProcessed: number | null
    recordsFailed: number | null
  }

  export type SyncLogMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    connectionId: string | null
    integrationId: string | null
    action: $Enums.SyncAction | null
    status: $Enums.SyncStatus | null
    recordsProcessed: number | null
    recordsFailed: number | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date | null
  }

  export type SyncLogMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    connectionId: string | null
    integrationId: string | null
    action: $Enums.SyncAction | null
    status: $Enums.SyncStatus | null
    recordsProcessed: number | null
    recordsFailed: number | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date | null
  }

  export type SyncLogCountAggregateOutputType = {
    id: number
    tenantId: number
    connectionId: number
    integrationId: number
    action: number
    status: number
    recordsProcessed: number
    recordsFailed: number
    startedAt: number
    completedAt: number
    details: number
    createdAt: number
    _all: number
  }


  export type SyncLogAvgAggregateInputType = {
    recordsProcessed?: true
    recordsFailed?: true
  }

  export type SyncLogSumAggregateInputType = {
    recordsProcessed?: true
    recordsFailed?: true
  }

  export type SyncLogMinAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    integrationId?: true
    action?: true
    status?: true
    recordsProcessed?: true
    recordsFailed?: true
    startedAt?: true
    completedAt?: true
    createdAt?: true
  }

  export type SyncLogMaxAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    integrationId?: true
    action?: true
    status?: true
    recordsProcessed?: true
    recordsFailed?: true
    startedAt?: true
    completedAt?: true
    createdAt?: true
  }

  export type SyncLogCountAggregateInputType = {
    id?: true
    tenantId?: true
    connectionId?: true
    integrationId?: true
    action?: true
    status?: true
    recordsProcessed?: true
    recordsFailed?: true
    startedAt?: true
    completedAt?: true
    details?: true
    createdAt?: true
    _all?: true
  }

  export type SyncLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncLog to aggregate.
     */
    where?: SyncLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncLogs to fetch.
     */
    orderBy?: SyncLogOrderByWithRelationInput | SyncLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SyncLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SyncLogs
    **/
    _count?: true | SyncLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SyncLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SyncLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SyncLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SyncLogMaxAggregateInputType
  }

  export type GetSyncLogAggregateType<T extends SyncLogAggregateArgs> = {
        [P in keyof T & keyof AggregateSyncLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSyncLog[P]>
      : GetScalarType<T[P], AggregateSyncLog[P]>
  }




  export type SyncLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SyncLogWhereInput
    orderBy?: SyncLogOrderByWithAggregationInput | SyncLogOrderByWithAggregationInput[]
    by: SyncLogScalarFieldEnum[] | SyncLogScalarFieldEnum
    having?: SyncLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SyncLogCountAggregateInputType | true
    _avg?: SyncLogAvgAggregateInputType
    _sum?: SyncLogSumAggregateInputType
    _min?: SyncLogMinAggregateInputType
    _max?: SyncLogMaxAggregateInputType
  }

  export type SyncLogGroupByOutputType = {
    id: string
    tenantId: string
    connectionId: string
    integrationId: string
    action: $Enums.SyncAction
    status: $Enums.SyncStatus
    recordsProcessed: number
    recordsFailed: number
    startedAt: Date
    completedAt: Date | null
    details: JsonValue | null
    createdAt: Date
    _count: SyncLogCountAggregateOutputType | null
    _avg: SyncLogAvgAggregateOutputType | null
    _sum: SyncLogSumAggregateOutputType | null
    _min: SyncLogMinAggregateOutputType | null
    _max: SyncLogMaxAggregateOutputType | null
  }

  type GetSyncLogGroupByPayload<T extends SyncLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SyncLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SyncLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SyncLogGroupByOutputType[P]>
            : GetScalarType<T[P], SyncLogGroupByOutputType[P]>
        }
      >
    >


  export type SyncLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    integrationId?: boolean
    action?: boolean
    status?: boolean
    recordsProcessed?: boolean
    recordsFailed?: boolean
    startedAt?: boolean
    completedAt?: boolean
    details?: boolean
    createdAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["syncLog"]>

  export type SyncLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    integrationId?: boolean
    action?: boolean
    status?: boolean
    recordsProcessed?: boolean
    recordsFailed?: boolean
    startedAt?: boolean
    completedAt?: boolean
    details?: boolean
    createdAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["syncLog"]>

  export type SyncLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    integrationId?: boolean
    action?: boolean
    status?: boolean
    recordsProcessed?: boolean
    recordsFailed?: boolean
    startedAt?: boolean
    completedAt?: boolean
    details?: boolean
    createdAt?: boolean
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["syncLog"]>

  export type SyncLogSelectScalar = {
    id?: boolean
    tenantId?: boolean
    connectionId?: boolean
    integrationId?: boolean
    action?: boolean
    status?: boolean
    recordsProcessed?: boolean
    recordsFailed?: boolean
    startedAt?: boolean
    completedAt?: boolean
    details?: boolean
    createdAt?: boolean
  }

  export type SyncLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "connectionId" | "integrationId" | "action" | "status" | "recordsProcessed" | "recordsFailed" | "startedAt" | "completedAt" | "details" | "createdAt", ExtArgs["result"]["syncLog"]>
  export type SyncLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }
  export type SyncLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }
  export type SyncLogIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    connection?: boolean | IntegrationConnectionDefaultArgs<ExtArgs>
  }

  export type $SyncLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SyncLog"
    objects: {
      connection: Prisma.$IntegrationConnectionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      connectionId: string
      integrationId: string
      action: $Enums.SyncAction
      status: $Enums.SyncStatus
      recordsProcessed: number
      recordsFailed: number
      startedAt: Date
      completedAt: Date | null
      details: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["syncLog"]>
    composites: {}
  }

  type SyncLogGetPayload<S extends boolean | null | undefined | SyncLogDefaultArgs> = $Result.GetResult<Prisma.$SyncLogPayload, S>

  type SyncLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SyncLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SyncLogCountAggregateInputType | true
    }

  export interface SyncLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SyncLog'], meta: { name: 'SyncLog' } }
    /**
     * Find zero or one SyncLog that matches the filter.
     * @param {SyncLogFindUniqueArgs} args - Arguments to find a SyncLog
     * @example
     * // Get one SyncLog
     * const syncLog = await prisma.syncLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SyncLogFindUniqueArgs>(args: SelectSubset<T, SyncLogFindUniqueArgs<ExtArgs>>): Prisma__SyncLogClient<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SyncLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SyncLogFindUniqueOrThrowArgs} args - Arguments to find a SyncLog
     * @example
     * // Get one SyncLog
     * const syncLog = await prisma.syncLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SyncLogFindUniqueOrThrowArgs>(args: SelectSubset<T, SyncLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SyncLogClient<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SyncLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncLogFindFirstArgs} args - Arguments to find a SyncLog
     * @example
     * // Get one SyncLog
     * const syncLog = await prisma.syncLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SyncLogFindFirstArgs>(args?: SelectSubset<T, SyncLogFindFirstArgs<ExtArgs>>): Prisma__SyncLogClient<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SyncLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncLogFindFirstOrThrowArgs} args - Arguments to find a SyncLog
     * @example
     * // Get one SyncLog
     * const syncLog = await prisma.syncLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SyncLogFindFirstOrThrowArgs>(args?: SelectSubset<T, SyncLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__SyncLogClient<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SyncLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SyncLogs
     * const syncLogs = await prisma.syncLog.findMany()
     * 
     * // Get first 10 SyncLogs
     * const syncLogs = await prisma.syncLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const syncLogWithIdOnly = await prisma.syncLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SyncLogFindManyArgs>(args?: SelectSubset<T, SyncLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SyncLog.
     * @param {SyncLogCreateArgs} args - Arguments to create a SyncLog.
     * @example
     * // Create one SyncLog
     * const SyncLog = await prisma.syncLog.create({
     *   data: {
     *     // ... data to create a SyncLog
     *   }
     * })
     * 
     */
    create<T extends SyncLogCreateArgs>(args: SelectSubset<T, SyncLogCreateArgs<ExtArgs>>): Prisma__SyncLogClient<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SyncLogs.
     * @param {SyncLogCreateManyArgs} args - Arguments to create many SyncLogs.
     * @example
     * // Create many SyncLogs
     * const syncLog = await prisma.syncLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SyncLogCreateManyArgs>(args?: SelectSubset<T, SyncLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SyncLogs and returns the data saved in the database.
     * @param {SyncLogCreateManyAndReturnArgs} args - Arguments to create many SyncLogs.
     * @example
     * // Create many SyncLogs
     * const syncLog = await prisma.syncLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SyncLogs and only return the `id`
     * const syncLogWithIdOnly = await prisma.syncLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SyncLogCreateManyAndReturnArgs>(args?: SelectSubset<T, SyncLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SyncLog.
     * @param {SyncLogDeleteArgs} args - Arguments to delete one SyncLog.
     * @example
     * // Delete one SyncLog
     * const SyncLog = await prisma.syncLog.delete({
     *   where: {
     *     // ... filter to delete one SyncLog
     *   }
     * })
     * 
     */
    delete<T extends SyncLogDeleteArgs>(args: SelectSubset<T, SyncLogDeleteArgs<ExtArgs>>): Prisma__SyncLogClient<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SyncLog.
     * @param {SyncLogUpdateArgs} args - Arguments to update one SyncLog.
     * @example
     * // Update one SyncLog
     * const syncLog = await prisma.syncLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SyncLogUpdateArgs>(args: SelectSubset<T, SyncLogUpdateArgs<ExtArgs>>): Prisma__SyncLogClient<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SyncLogs.
     * @param {SyncLogDeleteManyArgs} args - Arguments to filter SyncLogs to delete.
     * @example
     * // Delete a few SyncLogs
     * const { count } = await prisma.syncLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SyncLogDeleteManyArgs>(args?: SelectSubset<T, SyncLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SyncLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SyncLogs
     * const syncLog = await prisma.syncLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SyncLogUpdateManyArgs>(args: SelectSubset<T, SyncLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SyncLogs and returns the data updated in the database.
     * @param {SyncLogUpdateManyAndReturnArgs} args - Arguments to update many SyncLogs.
     * @example
     * // Update many SyncLogs
     * const syncLog = await prisma.syncLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SyncLogs and only return the `id`
     * const syncLogWithIdOnly = await prisma.syncLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SyncLogUpdateManyAndReturnArgs>(args: SelectSubset<T, SyncLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SyncLog.
     * @param {SyncLogUpsertArgs} args - Arguments to update or create a SyncLog.
     * @example
     * // Update or create a SyncLog
     * const syncLog = await prisma.syncLog.upsert({
     *   create: {
     *     // ... data to create a SyncLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SyncLog we want to update
     *   }
     * })
     */
    upsert<T extends SyncLogUpsertArgs>(args: SelectSubset<T, SyncLogUpsertArgs<ExtArgs>>): Prisma__SyncLogClient<$Result.GetResult<Prisma.$SyncLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SyncLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncLogCountArgs} args - Arguments to filter SyncLogs to count.
     * @example
     * // Count the number of SyncLogs
     * const count = await prisma.syncLog.count({
     *   where: {
     *     // ... the filter for the SyncLogs we want to count
     *   }
     * })
    **/
    count<T extends SyncLogCountArgs>(
      args?: Subset<T, SyncLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SyncLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SyncLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SyncLogAggregateArgs>(args: Subset<T, SyncLogAggregateArgs>): Prisma.PrismaPromise<GetSyncLogAggregateType<T>>

    /**
     * Group by SyncLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SyncLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SyncLogGroupByArgs['orderBy'] }
        : { orderBy?: SyncLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SyncLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSyncLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SyncLog model
   */
  readonly fields: SyncLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SyncLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SyncLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    connection<T extends IntegrationConnectionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IntegrationConnectionDefaultArgs<ExtArgs>>): Prisma__IntegrationConnectionClient<$Result.GetResult<Prisma.$IntegrationConnectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SyncLog model
   */
  interface SyncLogFieldRefs {
    readonly id: FieldRef<"SyncLog", 'String'>
    readonly tenantId: FieldRef<"SyncLog", 'String'>
    readonly connectionId: FieldRef<"SyncLog", 'String'>
    readonly integrationId: FieldRef<"SyncLog", 'String'>
    readonly action: FieldRef<"SyncLog", 'SyncAction'>
    readonly status: FieldRef<"SyncLog", 'SyncStatus'>
    readonly recordsProcessed: FieldRef<"SyncLog", 'Int'>
    readonly recordsFailed: FieldRef<"SyncLog", 'Int'>
    readonly startedAt: FieldRef<"SyncLog", 'DateTime'>
    readonly completedAt: FieldRef<"SyncLog", 'DateTime'>
    readonly details: FieldRef<"SyncLog", 'Json'>
    readonly createdAt: FieldRef<"SyncLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SyncLog findUnique
   */
  export type SyncLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * Filter, which SyncLog to fetch.
     */
    where: SyncLogWhereUniqueInput
  }

  /**
   * SyncLog findUniqueOrThrow
   */
  export type SyncLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * Filter, which SyncLog to fetch.
     */
    where: SyncLogWhereUniqueInput
  }

  /**
   * SyncLog findFirst
   */
  export type SyncLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * Filter, which SyncLog to fetch.
     */
    where?: SyncLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncLogs to fetch.
     */
    orderBy?: SyncLogOrderByWithRelationInput | SyncLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncLogs.
     */
    cursor?: SyncLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncLogs.
     */
    distinct?: SyncLogScalarFieldEnum | SyncLogScalarFieldEnum[]
  }

  /**
   * SyncLog findFirstOrThrow
   */
  export type SyncLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * Filter, which SyncLog to fetch.
     */
    where?: SyncLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncLogs to fetch.
     */
    orderBy?: SyncLogOrderByWithRelationInput | SyncLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncLogs.
     */
    cursor?: SyncLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncLogs.
     */
    distinct?: SyncLogScalarFieldEnum | SyncLogScalarFieldEnum[]
  }

  /**
   * SyncLog findMany
   */
  export type SyncLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * Filter, which SyncLogs to fetch.
     */
    where?: SyncLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncLogs to fetch.
     */
    orderBy?: SyncLogOrderByWithRelationInput | SyncLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SyncLogs.
     */
    cursor?: SyncLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncLogs.
     */
    distinct?: SyncLogScalarFieldEnum | SyncLogScalarFieldEnum[]
  }

  /**
   * SyncLog create
   */
  export type SyncLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * The data needed to create a SyncLog.
     */
    data: XOR<SyncLogCreateInput, SyncLogUncheckedCreateInput>
  }

  /**
   * SyncLog createMany
   */
  export type SyncLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SyncLogs.
     */
    data: SyncLogCreateManyInput | SyncLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SyncLog createManyAndReturn
   */
  export type SyncLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * The data used to create many SyncLogs.
     */
    data: SyncLogCreateManyInput | SyncLogCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SyncLog update
   */
  export type SyncLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * The data needed to update a SyncLog.
     */
    data: XOR<SyncLogUpdateInput, SyncLogUncheckedUpdateInput>
    /**
     * Choose, which SyncLog to update.
     */
    where: SyncLogWhereUniqueInput
  }

  /**
   * SyncLog updateMany
   */
  export type SyncLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SyncLogs.
     */
    data: XOR<SyncLogUpdateManyMutationInput, SyncLogUncheckedUpdateManyInput>
    /**
     * Filter which SyncLogs to update
     */
    where?: SyncLogWhereInput
    /**
     * Limit how many SyncLogs to update.
     */
    limit?: number
  }

  /**
   * SyncLog updateManyAndReturn
   */
  export type SyncLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * The data used to update SyncLogs.
     */
    data: XOR<SyncLogUpdateManyMutationInput, SyncLogUncheckedUpdateManyInput>
    /**
     * Filter which SyncLogs to update
     */
    where?: SyncLogWhereInput
    /**
     * Limit how many SyncLogs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SyncLog upsert
   */
  export type SyncLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * The filter to search for the SyncLog to update in case it exists.
     */
    where: SyncLogWhereUniqueInput
    /**
     * In case the SyncLog found by the `where` argument doesn't exist, create a new SyncLog with this data.
     */
    create: XOR<SyncLogCreateInput, SyncLogUncheckedCreateInput>
    /**
     * In case the SyncLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SyncLogUpdateInput, SyncLogUncheckedUpdateInput>
  }

  /**
   * SyncLog delete
   */
  export type SyncLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
    /**
     * Filter which SyncLog to delete.
     */
    where: SyncLogWhereUniqueInput
  }

  /**
   * SyncLog deleteMany
   */
  export type SyncLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncLogs to delete
     */
    where?: SyncLogWhereInput
    /**
     * Limit how many SyncLogs to delete.
     */
    limit?: number
  }

  /**
   * SyncLog without action
   */
  export type SyncLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncLog
     */
    select?: SyncLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncLog
     */
    omit?: SyncLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncLogInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const AgentRunScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    controlId: 'controlId',
    controlTitle: 'controlTitle',
    trigger: 'trigger',
    status: 'status',
    instructions: 'instructions',
    toolConnectionIds: 'toolConnectionIds',
    aiProvider: 'aiProvider',
    aiModel: 'aiModel',
    aiCredentialsEncrypted: 'aiCredentialsEncrypted',
    evidenceCount: 'evidenceCount',
    errorCount: 'errorCount',
    errorMessage: 'errorMessage',
    transcript: 'transcript',
    summary: 'summary',
    toolCallSummary: 'toolCallSummary',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    durationMs: 'durationMs',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AgentRunScalarFieldEnum = (typeof AgentRunScalarFieldEnum)[keyof typeof AgentRunScalarFieldEnum]


  export const IntegrationConnectionScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    integrationId: 'integrationId',
    name: 'name',
    status: 'status',
    secretId: 'secretId',
    config: 'config',
    lastSyncAt: 'lastSyncAt',
    lastErrorMessage: 'lastErrorMessage',
    syncFrequencyMinutes: 'syncFrequencyMinutes',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type IntegrationConnectionScalarFieldEnum = (typeof IntegrationConnectionScalarFieldEnum)[keyof typeof IntegrationConnectionScalarFieldEnum]


  export const IntegrationCheckScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    connectionId: 'connectionId',
    integrationId: 'integrationId',
    manifestKey: 'manifestKey',
    title: 'title',
    description: 'description',
    severity: 'severity',
    schedule: 'schedule',
    isEnabled: 'isEnabled',
    runner: 'runner',
    spec: 'spec',
    aiPrompt: 'aiPrompt',
    aiModel: 'aiModel',
    lastStatus: 'lastStatus',
    lastRunAt: 'lastRunAt',
    lastEvidenceId: 'lastEvidenceId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type IntegrationCheckScalarFieldEnum = (typeof IntegrationCheckScalarFieldEnum)[keyof typeof IntegrationCheckScalarFieldEnum]


  export const IntegrationCheckControlScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    integrationCheckId: 'integrationCheckId',
    connectionId: 'connectionId',
    controlId: 'controlId',
    createdAt: 'createdAt'
  };

  export type IntegrationCheckControlScalarFieldEnum = (typeof IntegrationCheckControlScalarFieldEnum)[keyof typeof IntegrationCheckControlScalarFieldEnum]


  export const IntegrationCheckResultScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    integrationCheckId: 'integrationCheckId',
    connectionId: 'connectionId',
    status: 'status',
    payload: 'payload',
    errorMessage: 'errorMessage',
    durationMs: 'durationMs',
    evidenceId: 'evidenceId',
    createdAt: 'createdAt'
  };

  export type IntegrationCheckResultScalarFieldEnum = (typeof IntegrationCheckResultScalarFieldEnum)[keyof typeof IntegrationCheckResultScalarFieldEnum]


  export const IntegrationScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    authType: 'authType',
    category: 'category',
    configSchema: 'configSchema',
    capabilities: 'capabilities',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type IntegrationScalarFieldEnum = (typeof IntegrationScalarFieldEnum)[keyof typeof IntegrationScalarFieldEnum]


  export const CollectionJobScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    connectionId: 'connectionId',
    type: 'type',
    status: 'status',
    priority: 'priority',
    scheduledAt: 'scheduledAt',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    nextRunAt: 'nextRunAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CollectionJobScalarFieldEnum = (typeof CollectionJobScalarFieldEnum)[keyof typeof CollectionJobScalarFieldEnum]


  export const CollectionJobRunScalarFieldEnum: {
    id: 'id',
    jobId: 'jobId',
    tenantId: 'tenantId',
    runNumber: 'runNumber',
    status: 'status',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    durationMs: 'durationMs',
    evidenceCount: 'evidenceCount',
    errorCount: 'errorCount',
    resultSummary: 'resultSummary',
    errorDetails: 'errorDetails',
    createdAt: 'createdAt'
  };

  export type CollectionJobRunScalarFieldEnum = (typeof CollectionJobRunScalarFieldEnum)[keyof typeof CollectionJobRunScalarFieldEnum]


  export const CollectionRetryScalarFieldEnum: {
    id: 'id',
    jobRunId: 'jobRunId',
    tenantId: 'tenantId',
    attemptNumber: 'attemptNumber',
    status: 'status',
    errorMessage: 'errorMessage',
    scheduledAt: 'scheduledAt',
    attemptedAt: 'attemptedAt',
    nextRetryAt: 'nextRetryAt',
    maxAttempts: 'maxAttempts',
    backoffMs: 'backoffMs',
    createdAt: 'createdAt'
  };

  export type CollectionRetryScalarFieldEnum = (typeof CollectionRetryScalarFieldEnum)[keyof typeof CollectionRetryScalarFieldEnum]


  export const SecretVaultScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    scope: 'scope',
    ownerType: 'ownerType',
    ownerId: 'ownerId',
    encryptedPayload: 'encryptedPayload',
    kmsKeyId: 'kmsKeyId',
    rotatedAt: 'rotatedAt',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SecretVaultScalarFieldEnum = (typeof SecretVaultScalarFieldEnum)[keyof typeof SecretVaultScalarFieldEnum]


  export const SyncLogScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    connectionId: 'connectionId',
    integrationId: 'integrationId',
    action: 'action',
    status: 'status',
    recordsProcessed: 'recordsProcessed',
    recordsFailed: 'recordsFailed',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    details: 'details',
    createdAt: 'createdAt'
  };

  export type SyncLogScalarFieldEnum = (typeof SyncLogScalarFieldEnum)[keyof typeof SyncLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'AgentRunTrigger'
   */
  export type EnumAgentRunTriggerFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentRunTrigger'>
    


  /**
   * Reference to a field of type 'AgentRunTrigger[]'
   */
  export type ListEnumAgentRunTriggerFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentRunTrigger[]'>
    


  /**
   * Reference to a field of type 'AgentRunStatus'
   */
  export type EnumAgentRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentRunStatus'>
    


  /**
   * Reference to a field of type 'AgentRunStatus[]'
   */
  export type ListEnumAgentRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentRunStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'ConnectionStatus'
   */
  export type EnumConnectionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ConnectionStatus'>
    


  /**
   * Reference to a field of type 'ConnectionStatus[]'
   */
  export type ListEnumConnectionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ConnectionStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'IntegrationCheckSeverity'
   */
  export type EnumIntegrationCheckSeverityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationCheckSeverity'>
    


  /**
   * Reference to a field of type 'IntegrationCheckSeverity[]'
   */
  export type ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationCheckSeverity[]'>
    


  /**
   * Reference to a field of type 'IntegrationCheckStatus'
   */
  export type EnumIntegrationCheckStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationCheckStatus'>
    


  /**
   * Reference to a field of type 'IntegrationCheckStatus[]'
   */
  export type ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationCheckStatus[]'>
    


  /**
   * Reference to a field of type 'AuthType'
   */
  export type EnumAuthTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AuthType'>
    


  /**
   * Reference to a field of type 'AuthType[]'
   */
  export type ListEnumAuthTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AuthType[]'>
    


  /**
   * Reference to a field of type 'IntegrationCategory'
   */
  export type EnumIntegrationCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationCategory'>
    


  /**
   * Reference to a field of type 'IntegrationCategory[]'
   */
  export type ListEnumIntegrationCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationCategory[]'>
    


  /**
   * Reference to a field of type 'JobType'
   */
  export type EnumJobTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobType'>
    


  /**
   * Reference to a field of type 'JobType[]'
   */
  export type ListEnumJobTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobType[]'>
    


  /**
   * Reference to a field of type 'JobStatus'
   */
  export type EnumJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobStatus'>
    


  /**
   * Reference to a field of type 'JobStatus[]'
   */
  export type ListEnumJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobStatus[]'>
    


  /**
   * Reference to a field of type 'RunStatus'
   */
  export type EnumRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RunStatus'>
    


  /**
   * Reference to a field of type 'RunStatus[]'
   */
  export type ListEnumRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RunStatus[]'>
    


  /**
   * Reference to a field of type 'RetryStatus'
   */
  export type EnumRetryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RetryStatus'>
    


  /**
   * Reference to a field of type 'RetryStatus[]'
   */
  export type ListEnumRetryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RetryStatus[]'>
    


  /**
   * Reference to a field of type 'SecretScope'
   */
  export type EnumSecretScopeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SecretScope'>
    


  /**
   * Reference to a field of type 'SecretScope[]'
   */
  export type ListEnumSecretScopeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SecretScope[]'>
    


  /**
   * Reference to a field of type 'SyncAction'
   */
  export type EnumSyncActionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SyncAction'>
    


  /**
   * Reference to a field of type 'SyncAction[]'
   */
  export type ListEnumSyncActionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SyncAction[]'>
    


  /**
   * Reference to a field of type 'SyncStatus'
   */
  export type EnumSyncStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SyncStatus'>
    


  /**
   * Reference to a field of type 'SyncStatus[]'
   */
  export type ListEnumSyncStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SyncStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type AgentRunWhereInput = {
    AND?: AgentRunWhereInput | AgentRunWhereInput[]
    OR?: AgentRunWhereInput[]
    NOT?: AgentRunWhereInput | AgentRunWhereInput[]
    id?: StringFilter<"AgentRun"> | string
    tenantId?: StringFilter<"AgentRun"> | string
    controlId?: StringFilter<"AgentRun"> | string
    controlTitle?: StringNullableFilter<"AgentRun"> | string | null
    trigger?: EnumAgentRunTriggerFilter<"AgentRun"> | $Enums.AgentRunTrigger
    status?: EnumAgentRunStatusFilter<"AgentRun"> | $Enums.AgentRunStatus
    instructions?: StringFilter<"AgentRun"> | string
    toolConnectionIds?: StringNullableListFilter<"AgentRun">
    aiProvider?: StringNullableFilter<"AgentRun"> | string | null
    aiModel?: StringNullableFilter<"AgentRun"> | string | null
    aiCredentialsEncrypted?: StringNullableFilter<"AgentRun"> | string | null
    evidenceCount?: IntFilter<"AgentRun"> | number
    errorCount?: IntFilter<"AgentRun"> | number
    errorMessage?: StringNullableFilter<"AgentRun"> | string | null
    transcript?: JsonNullableFilter<"AgentRun">
    summary?: StringNullableFilter<"AgentRun"> | string | null
    toolCallSummary?: JsonNullableFilter<"AgentRun">
    startedAt?: DateTimeNullableFilter<"AgentRun"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"AgentRun"> | Date | string | null
    durationMs?: IntNullableFilter<"AgentRun"> | number | null
    createdAt?: DateTimeFilter<"AgentRun"> | Date | string
    updatedAt?: DateTimeFilter<"AgentRun"> | Date | string
  }

  export type AgentRunOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    controlId?: SortOrder
    controlTitle?: SortOrderInput | SortOrder
    trigger?: SortOrder
    status?: SortOrder
    instructions?: SortOrder
    toolConnectionIds?: SortOrder
    aiProvider?: SortOrderInput | SortOrder
    aiModel?: SortOrderInput | SortOrder
    aiCredentialsEncrypted?: SortOrderInput | SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    transcript?: SortOrderInput | SortOrder
    summary?: SortOrderInput | SortOrder
    toolCallSummary?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentRunWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AgentRunWhereInput | AgentRunWhereInput[]
    OR?: AgentRunWhereInput[]
    NOT?: AgentRunWhereInput | AgentRunWhereInput[]
    tenantId?: StringFilter<"AgentRun"> | string
    controlId?: StringFilter<"AgentRun"> | string
    controlTitle?: StringNullableFilter<"AgentRun"> | string | null
    trigger?: EnumAgentRunTriggerFilter<"AgentRun"> | $Enums.AgentRunTrigger
    status?: EnumAgentRunStatusFilter<"AgentRun"> | $Enums.AgentRunStatus
    instructions?: StringFilter<"AgentRun"> | string
    toolConnectionIds?: StringNullableListFilter<"AgentRun">
    aiProvider?: StringNullableFilter<"AgentRun"> | string | null
    aiModel?: StringNullableFilter<"AgentRun"> | string | null
    aiCredentialsEncrypted?: StringNullableFilter<"AgentRun"> | string | null
    evidenceCount?: IntFilter<"AgentRun"> | number
    errorCount?: IntFilter<"AgentRun"> | number
    errorMessage?: StringNullableFilter<"AgentRun"> | string | null
    transcript?: JsonNullableFilter<"AgentRun">
    summary?: StringNullableFilter<"AgentRun"> | string | null
    toolCallSummary?: JsonNullableFilter<"AgentRun">
    startedAt?: DateTimeNullableFilter<"AgentRun"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"AgentRun"> | Date | string | null
    durationMs?: IntNullableFilter<"AgentRun"> | number | null
    createdAt?: DateTimeFilter<"AgentRun"> | Date | string
    updatedAt?: DateTimeFilter<"AgentRun"> | Date | string
  }, "id">

  export type AgentRunOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    controlId?: SortOrder
    controlTitle?: SortOrderInput | SortOrder
    trigger?: SortOrder
    status?: SortOrder
    instructions?: SortOrder
    toolConnectionIds?: SortOrder
    aiProvider?: SortOrderInput | SortOrder
    aiModel?: SortOrderInput | SortOrder
    aiCredentialsEncrypted?: SortOrderInput | SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    transcript?: SortOrderInput | SortOrder
    summary?: SortOrderInput | SortOrder
    toolCallSummary?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AgentRunCountOrderByAggregateInput
    _avg?: AgentRunAvgOrderByAggregateInput
    _max?: AgentRunMaxOrderByAggregateInput
    _min?: AgentRunMinOrderByAggregateInput
    _sum?: AgentRunSumOrderByAggregateInput
  }

  export type AgentRunScalarWhereWithAggregatesInput = {
    AND?: AgentRunScalarWhereWithAggregatesInput | AgentRunScalarWhereWithAggregatesInput[]
    OR?: AgentRunScalarWhereWithAggregatesInput[]
    NOT?: AgentRunScalarWhereWithAggregatesInput | AgentRunScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AgentRun"> | string
    tenantId?: StringWithAggregatesFilter<"AgentRun"> | string
    controlId?: StringWithAggregatesFilter<"AgentRun"> | string
    controlTitle?: StringNullableWithAggregatesFilter<"AgentRun"> | string | null
    trigger?: EnumAgentRunTriggerWithAggregatesFilter<"AgentRun"> | $Enums.AgentRunTrigger
    status?: EnumAgentRunStatusWithAggregatesFilter<"AgentRun"> | $Enums.AgentRunStatus
    instructions?: StringWithAggregatesFilter<"AgentRun"> | string
    toolConnectionIds?: StringNullableListFilter<"AgentRun">
    aiProvider?: StringNullableWithAggregatesFilter<"AgentRun"> | string | null
    aiModel?: StringNullableWithAggregatesFilter<"AgentRun"> | string | null
    aiCredentialsEncrypted?: StringNullableWithAggregatesFilter<"AgentRun"> | string | null
    evidenceCount?: IntWithAggregatesFilter<"AgentRun"> | number
    errorCount?: IntWithAggregatesFilter<"AgentRun"> | number
    errorMessage?: StringNullableWithAggregatesFilter<"AgentRun"> | string | null
    transcript?: JsonNullableWithAggregatesFilter<"AgentRun">
    summary?: StringNullableWithAggregatesFilter<"AgentRun"> | string | null
    toolCallSummary?: JsonNullableWithAggregatesFilter<"AgentRun">
    startedAt?: DateTimeNullableWithAggregatesFilter<"AgentRun"> | Date | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter<"AgentRun"> | Date | string | null
    durationMs?: IntNullableWithAggregatesFilter<"AgentRun"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"AgentRun"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AgentRun"> | Date | string
  }

  export type IntegrationConnectionWhereInput = {
    AND?: IntegrationConnectionWhereInput | IntegrationConnectionWhereInput[]
    OR?: IntegrationConnectionWhereInput[]
    NOT?: IntegrationConnectionWhereInput | IntegrationConnectionWhereInput[]
    id?: StringFilter<"IntegrationConnection"> | string
    tenantId?: StringFilter<"IntegrationConnection"> | string
    integrationId?: StringFilter<"IntegrationConnection"> | string
    name?: StringFilter<"IntegrationConnection"> | string
    status?: EnumConnectionStatusFilter<"IntegrationConnection"> | $Enums.ConnectionStatus
    secretId?: StringNullableFilter<"IntegrationConnection"> | string | null
    config?: JsonNullableFilter<"IntegrationConnection">
    lastSyncAt?: DateTimeNullableFilter<"IntegrationConnection"> | Date | string | null
    lastErrorMessage?: StringNullableFilter<"IntegrationConnection"> | string | null
    syncFrequencyMinutes?: IntFilter<"IntegrationConnection"> | number
    isActive?: BoolFilter<"IntegrationConnection"> | boolean
    createdAt?: DateTimeFilter<"IntegrationConnection"> | Date | string
    updatedAt?: DateTimeFilter<"IntegrationConnection"> | Date | string
    integration?: XOR<IntegrationScalarRelationFilter, IntegrationWhereInput>
    jobs?: CollectionJobListRelationFilter
    syncLogs?: SyncLogListRelationFilter
    checks?: IntegrationCheckListRelationFilter
    checkControls?: IntegrationCheckControlListRelationFilter
    checkResults?: IntegrationCheckResultListRelationFilter
  }

  export type IntegrationConnectionOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    secretId?: SortOrderInput | SortOrder
    config?: SortOrderInput | SortOrder
    lastSyncAt?: SortOrderInput | SortOrder
    lastErrorMessage?: SortOrderInput | SortOrder
    syncFrequencyMinutes?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    integration?: IntegrationOrderByWithRelationInput
    jobs?: CollectionJobOrderByRelationAggregateInput
    syncLogs?: SyncLogOrderByRelationAggregateInput
    checks?: IntegrationCheckOrderByRelationAggregateInput
    checkControls?: IntegrationCheckControlOrderByRelationAggregateInput
    checkResults?: IntegrationCheckResultOrderByRelationAggregateInput
  }

  export type IntegrationConnectionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_integrationId_name?: IntegrationConnectionTenantIdIntegrationIdNameCompoundUniqueInput
    AND?: IntegrationConnectionWhereInput | IntegrationConnectionWhereInput[]
    OR?: IntegrationConnectionWhereInput[]
    NOT?: IntegrationConnectionWhereInput | IntegrationConnectionWhereInput[]
    tenantId?: StringFilter<"IntegrationConnection"> | string
    integrationId?: StringFilter<"IntegrationConnection"> | string
    name?: StringFilter<"IntegrationConnection"> | string
    status?: EnumConnectionStatusFilter<"IntegrationConnection"> | $Enums.ConnectionStatus
    secretId?: StringNullableFilter<"IntegrationConnection"> | string | null
    config?: JsonNullableFilter<"IntegrationConnection">
    lastSyncAt?: DateTimeNullableFilter<"IntegrationConnection"> | Date | string | null
    lastErrorMessage?: StringNullableFilter<"IntegrationConnection"> | string | null
    syncFrequencyMinutes?: IntFilter<"IntegrationConnection"> | number
    isActive?: BoolFilter<"IntegrationConnection"> | boolean
    createdAt?: DateTimeFilter<"IntegrationConnection"> | Date | string
    updatedAt?: DateTimeFilter<"IntegrationConnection"> | Date | string
    integration?: XOR<IntegrationScalarRelationFilter, IntegrationWhereInput>
    jobs?: CollectionJobListRelationFilter
    syncLogs?: SyncLogListRelationFilter
    checks?: IntegrationCheckListRelationFilter
    checkControls?: IntegrationCheckControlListRelationFilter
    checkResults?: IntegrationCheckResultListRelationFilter
  }, "id" | "tenantId_integrationId_name">

  export type IntegrationConnectionOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    secretId?: SortOrderInput | SortOrder
    config?: SortOrderInput | SortOrder
    lastSyncAt?: SortOrderInput | SortOrder
    lastErrorMessage?: SortOrderInput | SortOrder
    syncFrequencyMinutes?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: IntegrationConnectionCountOrderByAggregateInput
    _avg?: IntegrationConnectionAvgOrderByAggregateInput
    _max?: IntegrationConnectionMaxOrderByAggregateInput
    _min?: IntegrationConnectionMinOrderByAggregateInput
    _sum?: IntegrationConnectionSumOrderByAggregateInput
  }

  export type IntegrationConnectionScalarWhereWithAggregatesInput = {
    AND?: IntegrationConnectionScalarWhereWithAggregatesInput | IntegrationConnectionScalarWhereWithAggregatesInput[]
    OR?: IntegrationConnectionScalarWhereWithAggregatesInput[]
    NOT?: IntegrationConnectionScalarWhereWithAggregatesInput | IntegrationConnectionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IntegrationConnection"> | string
    tenantId?: StringWithAggregatesFilter<"IntegrationConnection"> | string
    integrationId?: StringWithAggregatesFilter<"IntegrationConnection"> | string
    name?: StringWithAggregatesFilter<"IntegrationConnection"> | string
    status?: EnumConnectionStatusWithAggregatesFilter<"IntegrationConnection"> | $Enums.ConnectionStatus
    secretId?: StringNullableWithAggregatesFilter<"IntegrationConnection"> | string | null
    config?: JsonNullableWithAggregatesFilter<"IntegrationConnection">
    lastSyncAt?: DateTimeNullableWithAggregatesFilter<"IntegrationConnection"> | Date | string | null
    lastErrorMessage?: StringNullableWithAggregatesFilter<"IntegrationConnection"> | string | null
    syncFrequencyMinutes?: IntWithAggregatesFilter<"IntegrationConnection"> | number
    isActive?: BoolWithAggregatesFilter<"IntegrationConnection"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"IntegrationConnection"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"IntegrationConnection"> | Date | string
  }

  export type IntegrationCheckWhereInput = {
    AND?: IntegrationCheckWhereInput | IntegrationCheckWhereInput[]
    OR?: IntegrationCheckWhereInput[]
    NOT?: IntegrationCheckWhereInput | IntegrationCheckWhereInput[]
    id?: StringFilter<"IntegrationCheck"> | string
    tenantId?: StringFilter<"IntegrationCheck"> | string
    connectionId?: StringFilter<"IntegrationCheck"> | string
    integrationId?: StringFilter<"IntegrationCheck"> | string
    manifestKey?: StringFilter<"IntegrationCheck"> | string
    title?: StringFilter<"IntegrationCheck"> | string
    description?: StringNullableFilter<"IntegrationCheck"> | string | null
    severity?: EnumIntegrationCheckSeverityFilter<"IntegrationCheck"> | $Enums.IntegrationCheckSeverity
    schedule?: StringFilter<"IntegrationCheck"> | string
    isEnabled?: BoolFilter<"IntegrationCheck"> | boolean
    runner?: StringFilter<"IntegrationCheck"> | string
    spec?: JsonNullableFilter<"IntegrationCheck">
    aiPrompt?: StringNullableFilter<"IntegrationCheck"> | string | null
    aiModel?: StringNullableFilter<"IntegrationCheck"> | string | null
    lastStatus?: EnumIntegrationCheckStatusFilter<"IntegrationCheck"> | $Enums.IntegrationCheckStatus
    lastRunAt?: DateTimeNullableFilter<"IntegrationCheck"> | Date | string | null
    lastEvidenceId?: StringNullableFilter<"IntegrationCheck"> | string | null
    createdAt?: DateTimeFilter<"IntegrationCheck"> | Date | string
    updatedAt?: DateTimeFilter<"IntegrationCheck"> | Date | string
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
    integration?: XOR<IntegrationScalarRelationFilter, IntegrationWhereInput>
    controls?: IntegrationCheckControlListRelationFilter
    results?: IntegrationCheckResultListRelationFilter
  }

  export type IntegrationCheckOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    manifestKey?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    severity?: SortOrder
    schedule?: SortOrder
    isEnabled?: SortOrder
    runner?: SortOrder
    spec?: SortOrderInput | SortOrder
    aiPrompt?: SortOrderInput | SortOrder
    aiModel?: SortOrderInput | SortOrder
    lastStatus?: SortOrder
    lastRunAt?: SortOrderInput | SortOrder
    lastEvidenceId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    connection?: IntegrationConnectionOrderByWithRelationInput
    integration?: IntegrationOrderByWithRelationInput
    controls?: IntegrationCheckControlOrderByRelationAggregateInput
    results?: IntegrationCheckResultOrderByRelationAggregateInput
  }

  export type IntegrationCheckWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    connectionId_manifestKey?: IntegrationCheckConnectionIdManifestKeyCompoundUniqueInput
    AND?: IntegrationCheckWhereInput | IntegrationCheckWhereInput[]
    OR?: IntegrationCheckWhereInput[]
    NOT?: IntegrationCheckWhereInput | IntegrationCheckWhereInput[]
    tenantId?: StringFilter<"IntegrationCheck"> | string
    connectionId?: StringFilter<"IntegrationCheck"> | string
    integrationId?: StringFilter<"IntegrationCheck"> | string
    manifestKey?: StringFilter<"IntegrationCheck"> | string
    title?: StringFilter<"IntegrationCheck"> | string
    description?: StringNullableFilter<"IntegrationCheck"> | string | null
    severity?: EnumIntegrationCheckSeverityFilter<"IntegrationCheck"> | $Enums.IntegrationCheckSeverity
    schedule?: StringFilter<"IntegrationCheck"> | string
    isEnabled?: BoolFilter<"IntegrationCheck"> | boolean
    runner?: StringFilter<"IntegrationCheck"> | string
    spec?: JsonNullableFilter<"IntegrationCheck">
    aiPrompt?: StringNullableFilter<"IntegrationCheck"> | string | null
    aiModel?: StringNullableFilter<"IntegrationCheck"> | string | null
    lastStatus?: EnumIntegrationCheckStatusFilter<"IntegrationCheck"> | $Enums.IntegrationCheckStatus
    lastRunAt?: DateTimeNullableFilter<"IntegrationCheck"> | Date | string | null
    lastEvidenceId?: StringNullableFilter<"IntegrationCheck"> | string | null
    createdAt?: DateTimeFilter<"IntegrationCheck"> | Date | string
    updatedAt?: DateTimeFilter<"IntegrationCheck"> | Date | string
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
    integration?: XOR<IntegrationScalarRelationFilter, IntegrationWhereInput>
    controls?: IntegrationCheckControlListRelationFilter
    results?: IntegrationCheckResultListRelationFilter
  }, "id" | "connectionId_manifestKey">

  export type IntegrationCheckOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    manifestKey?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    severity?: SortOrder
    schedule?: SortOrder
    isEnabled?: SortOrder
    runner?: SortOrder
    spec?: SortOrderInput | SortOrder
    aiPrompt?: SortOrderInput | SortOrder
    aiModel?: SortOrderInput | SortOrder
    lastStatus?: SortOrder
    lastRunAt?: SortOrderInput | SortOrder
    lastEvidenceId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: IntegrationCheckCountOrderByAggregateInput
    _max?: IntegrationCheckMaxOrderByAggregateInput
    _min?: IntegrationCheckMinOrderByAggregateInput
  }

  export type IntegrationCheckScalarWhereWithAggregatesInput = {
    AND?: IntegrationCheckScalarWhereWithAggregatesInput | IntegrationCheckScalarWhereWithAggregatesInput[]
    OR?: IntegrationCheckScalarWhereWithAggregatesInput[]
    NOT?: IntegrationCheckScalarWhereWithAggregatesInput | IntegrationCheckScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IntegrationCheck"> | string
    tenantId?: StringWithAggregatesFilter<"IntegrationCheck"> | string
    connectionId?: StringWithAggregatesFilter<"IntegrationCheck"> | string
    integrationId?: StringWithAggregatesFilter<"IntegrationCheck"> | string
    manifestKey?: StringWithAggregatesFilter<"IntegrationCheck"> | string
    title?: StringWithAggregatesFilter<"IntegrationCheck"> | string
    description?: StringNullableWithAggregatesFilter<"IntegrationCheck"> | string | null
    severity?: EnumIntegrationCheckSeverityWithAggregatesFilter<"IntegrationCheck"> | $Enums.IntegrationCheckSeverity
    schedule?: StringWithAggregatesFilter<"IntegrationCheck"> | string
    isEnabled?: BoolWithAggregatesFilter<"IntegrationCheck"> | boolean
    runner?: StringWithAggregatesFilter<"IntegrationCheck"> | string
    spec?: JsonNullableWithAggregatesFilter<"IntegrationCheck">
    aiPrompt?: StringNullableWithAggregatesFilter<"IntegrationCheck"> | string | null
    aiModel?: StringNullableWithAggregatesFilter<"IntegrationCheck"> | string | null
    lastStatus?: EnumIntegrationCheckStatusWithAggregatesFilter<"IntegrationCheck"> | $Enums.IntegrationCheckStatus
    lastRunAt?: DateTimeNullableWithAggregatesFilter<"IntegrationCheck"> | Date | string | null
    lastEvidenceId?: StringNullableWithAggregatesFilter<"IntegrationCheck"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"IntegrationCheck"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"IntegrationCheck"> | Date | string
  }

  export type IntegrationCheckControlWhereInput = {
    AND?: IntegrationCheckControlWhereInput | IntegrationCheckControlWhereInput[]
    OR?: IntegrationCheckControlWhereInput[]
    NOT?: IntegrationCheckControlWhereInput | IntegrationCheckControlWhereInput[]
    id?: StringFilter<"IntegrationCheckControl"> | string
    tenantId?: StringFilter<"IntegrationCheckControl"> | string
    integrationCheckId?: StringFilter<"IntegrationCheckControl"> | string
    connectionId?: StringFilter<"IntegrationCheckControl"> | string
    controlId?: StringFilter<"IntegrationCheckControl"> | string
    createdAt?: DateTimeFilter<"IntegrationCheckControl"> | Date | string
    integrationCheck?: XOR<IntegrationCheckScalarRelationFilter, IntegrationCheckWhereInput>
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
  }

  export type IntegrationCheckControlOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    controlId?: SortOrder
    createdAt?: SortOrder
    integrationCheck?: IntegrationCheckOrderByWithRelationInput
    connection?: IntegrationConnectionOrderByWithRelationInput
  }

  export type IntegrationCheckControlWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    integrationCheckId_controlId?: IntegrationCheckControlIntegrationCheckIdControlIdCompoundUniqueInput
    AND?: IntegrationCheckControlWhereInput | IntegrationCheckControlWhereInput[]
    OR?: IntegrationCheckControlWhereInput[]
    NOT?: IntegrationCheckControlWhereInput | IntegrationCheckControlWhereInput[]
    tenantId?: StringFilter<"IntegrationCheckControl"> | string
    integrationCheckId?: StringFilter<"IntegrationCheckControl"> | string
    connectionId?: StringFilter<"IntegrationCheckControl"> | string
    controlId?: StringFilter<"IntegrationCheckControl"> | string
    createdAt?: DateTimeFilter<"IntegrationCheckControl"> | Date | string
    integrationCheck?: XOR<IntegrationCheckScalarRelationFilter, IntegrationCheckWhereInput>
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
  }, "id" | "integrationCheckId_controlId">

  export type IntegrationCheckControlOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    controlId?: SortOrder
    createdAt?: SortOrder
    _count?: IntegrationCheckControlCountOrderByAggregateInput
    _max?: IntegrationCheckControlMaxOrderByAggregateInput
    _min?: IntegrationCheckControlMinOrderByAggregateInput
  }

  export type IntegrationCheckControlScalarWhereWithAggregatesInput = {
    AND?: IntegrationCheckControlScalarWhereWithAggregatesInput | IntegrationCheckControlScalarWhereWithAggregatesInput[]
    OR?: IntegrationCheckControlScalarWhereWithAggregatesInput[]
    NOT?: IntegrationCheckControlScalarWhereWithAggregatesInput | IntegrationCheckControlScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IntegrationCheckControl"> | string
    tenantId?: StringWithAggregatesFilter<"IntegrationCheckControl"> | string
    integrationCheckId?: StringWithAggregatesFilter<"IntegrationCheckControl"> | string
    connectionId?: StringWithAggregatesFilter<"IntegrationCheckControl"> | string
    controlId?: StringWithAggregatesFilter<"IntegrationCheckControl"> | string
    createdAt?: DateTimeWithAggregatesFilter<"IntegrationCheckControl"> | Date | string
  }

  export type IntegrationCheckResultWhereInput = {
    AND?: IntegrationCheckResultWhereInput | IntegrationCheckResultWhereInput[]
    OR?: IntegrationCheckResultWhereInput[]
    NOT?: IntegrationCheckResultWhereInput | IntegrationCheckResultWhereInput[]
    id?: StringFilter<"IntegrationCheckResult"> | string
    tenantId?: StringFilter<"IntegrationCheckResult"> | string
    integrationCheckId?: StringFilter<"IntegrationCheckResult"> | string
    connectionId?: StringFilter<"IntegrationCheckResult"> | string
    status?: EnumIntegrationCheckStatusFilter<"IntegrationCheckResult"> | $Enums.IntegrationCheckStatus
    payload?: JsonNullableFilter<"IntegrationCheckResult">
    errorMessage?: StringNullableFilter<"IntegrationCheckResult"> | string | null
    durationMs?: IntNullableFilter<"IntegrationCheckResult"> | number | null
    evidenceId?: StringNullableFilter<"IntegrationCheckResult"> | string | null
    createdAt?: DateTimeFilter<"IntegrationCheckResult"> | Date | string
    integrationCheck?: XOR<IntegrationCheckScalarRelationFilter, IntegrationCheckWhereInput>
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
  }

  export type IntegrationCheckResultOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    status?: SortOrder
    payload?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    evidenceId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    integrationCheck?: IntegrationCheckOrderByWithRelationInput
    connection?: IntegrationConnectionOrderByWithRelationInput
  }

  export type IntegrationCheckResultWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: IntegrationCheckResultWhereInput | IntegrationCheckResultWhereInput[]
    OR?: IntegrationCheckResultWhereInput[]
    NOT?: IntegrationCheckResultWhereInput | IntegrationCheckResultWhereInput[]
    tenantId?: StringFilter<"IntegrationCheckResult"> | string
    integrationCheckId?: StringFilter<"IntegrationCheckResult"> | string
    connectionId?: StringFilter<"IntegrationCheckResult"> | string
    status?: EnumIntegrationCheckStatusFilter<"IntegrationCheckResult"> | $Enums.IntegrationCheckStatus
    payload?: JsonNullableFilter<"IntegrationCheckResult">
    errorMessage?: StringNullableFilter<"IntegrationCheckResult"> | string | null
    durationMs?: IntNullableFilter<"IntegrationCheckResult"> | number | null
    evidenceId?: StringNullableFilter<"IntegrationCheckResult"> | string | null
    createdAt?: DateTimeFilter<"IntegrationCheckResult"> | Date | string
    integrationCheck?: XOR<IntegrationCheckScalarRelationFilter, IntegrationCheckWhereInput>
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
  }, "id">

  export type IntegrationCheckResultOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    status?: SortOrder
    payload?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    evidenceId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: IntegrationCheckResultCountOrderByAggregateInput
    _avg?: IntegrationCheckResultAvgOrderByAggregateInput
    _max?: IntegrationCheckResultMaxOrderByAggregateInput
    _min?: IntegrationCheckResultMinOrderByAggregateInput
    _sum?: IntegrationCheckResultSumOrderByAggregateInput
  }

  export type IntegrationCheckResultScalarWhereWithAggregatesInput = {
    AND?: IntegrationCheckResultScalarWhereWithAggregatesInput | IntegrationCheckResultScalarWhereWithAggregatesInput[]
    OR?: IntegrationCheckResultScalarWhereWithAggregatesInput[]
    NOT?: IntegrationCheckResultScalarWhereWithAggregatesInput | IntegrationCheckResultScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IntegrationCheckResult"> | string
    tenantId?: StringWithAggregatesFilter<"IntegrationCheckResult"> | string
    integrationCheckId?: StringWithAggregatesFilter<"IntegrationCheckResult"> | string
    connectionId?: StringWithAggregatesFilter<"IntegrationCheckResult"> | string
    status?: EnumIntegrationCheckStatusWithAggregatesFilter<"IntegrationCheckResult"> | $Enums.IntegrationCheckStatus
    payload?: JsonNullableWithAggregatesFilter<"IntegrationCheckResult">
    errorMessage?: StringNullableWithAggregatesFilter<"IntegrationCheckResult"> | string | null
    durationMs?: IntNullableWithAggregatesFilter<"IntegrationCheckResult"> | number | null
    evidenceId?: StringNullableWithAggregatesFilter<"IntegrationCheckResult"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"IntegrationCheckResult"> | Date | string
  }

  export type IntegrationWhereInput = {
    AND?: IntegrationWhereInput | IntegrationWhereInput[]
    OR?: IntegrationWhereInput[]
    NOT?: IntegrationWhereInput | IntegrationWhereInput[]
    id?: StringFilter<"Integration"> | string
    name?: StringFilter<"Integration"> | string
    description?: StringNullableFilter<"Integration"> | string | null
    authType?: EnumAuthTypeFilter<"Integration"> | $Enums.AuthType
    category?: EnumIntegrationCategoryFilter<"Integration"> | $Enums.IntegrationCategory
    configSchema?: JsonNullableFilter<"Integration">
    capabilities?: StringNullableListFilter<"Integration">
    isActive?: BoolFilter<"Integration"> | boolean
    createdAt?: DateTimeFilter<"Integration"> | Date | string
    updatedAt?: DateTimeFilter<"Integration"> | Date | string
    connections?: IntegrationConnectionListRelationFilter
    checks?: IntegrationCheckListRelationFilter
  }

  export type IntegrationOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    authType?: SortOrder
    category?: SortOrder
    configSchema?: SortOrderInput | SortOrder
    capabilities?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    connections?: IntegrationConnectionOrderByRelationAggregateInput
    checks?: IntegrationCheckOrderByRelationAggregateInput
  }

  export type IntegrationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: IntegrationWhereInput | IntegrationWhereInput[]
    OR?: IntegrationWhereInput[]
    NOT?: IntegrationWhereInput | IntegrationWhereInput[]
    name?: StringFilter<"Integration"> | string
    description?: StringNullableFilter<"Integration"> | string | null
    authType?: EnumAuthTypeFilter<"Integration"> | $Enums.AuthType
    category?: EnumIntegrationCategoryFilter<"Integration"> | $Enums.IntegrationCategory
    configSchema?: JsonNullableFilter<"Integration">
    capabilities?: StringNullableListFilter<"Integration">
    isActive?: BoolFilter<"Integration"> | boolean
    createdAt?: DateTimeFilter<"Integration"> | Date | string
    updatedAt?: DateTimeFilter<"Integration"> | Date | string
    connections?: IntegrationConnectionListRelationFilter
    checks?: IntegrationCheckListRelationFilter
  }, "id">

  export type IntegrationOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    authType?: SortOrder
    category?: SortOrder
    configSchema?: SortOrderInput | SortOrder
    capabilities?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: IntegrationCountOrderByAggregateInput
    _max?: IntegrationMaxOrderByAggregateInput
    _min?: IntegrationMinOrderByAggregateInput
  }

  export type IntegrationScalarWhereWithAggregatesInput = {
    AND?: IntegrationScalarWhereWithAggregatesInput | IntegrationScalarWhereWithAggregatesInput[]
    OR?: IntegrationScalarWhereWithAggregatesInput[]
    NOT?: IntegrationScalarWhereWithAggregatesInput | IntegrationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Integration"> | string
    name?: StringWithAggregatesFilter<"Integration"> | string
    description?: StringNullableWithAggregatesFilter<"Integration"> | string | null
    authType?: EnumAuthTypeWithAggregatesFilter<"Integration"> | $Enums.AuthType
    category?: EnumIntegrationCategoryWithAggregatesFilter<"Integration"> | $Enums.IntegrationCategory
    configSchema?: JsonNullableWithAggregatesFilter<"Integration">
    capabilities?: StringNullableListFilter<"Integration">
    isActive?: BoolWithAggregatesFilter<"Integration"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Integration"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Integration"> | Date | string
  }

  export type CollectionJobWhereInput = {
    AND?: CollectionJobWhereInput | CollectionJobWhereInput[]
    OR?: CollectionJobWhereInput[]
    NOT?: CollectionJobWhereInput | CollectionJobWhereInput[]
    id?: StringFilter<"CollectionJob"> | string
    tenantId?: StringFilter<"CollectionJob"> | string
    connectionId?: StringFilter<"CollectionJob"> | string
    type?: EnumJobTypeFilter<"CollectionJob"> | $Enums.JobType
    status?: EnumJobStatusFilter<"CollectionJob"> | $Enums.JobStatus
    priority?: IntFilter<"CollectionJob"> | number
    scheduledAt?: DateTimeFilter<"CollectionJob"> | Date | string
    startedAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    nextRunAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    createdAt?: DateTimeFilter<"CollectionJob"> | Date | string
    updatedAt?: DateTimeFilter<"CollectionJob"> | Date | string
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
    runs?: CollectionJobRunListRelationFilter
  }

  export type CollectionJobOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    scheduledAt?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    nextRunAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    connection?: IntegrationConnectionOrderByWithRelationInput
    runs?: CollectionJobRunOrderByRelationAggregateInput
  }

  export type CollectionJobWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CollectionJobWhereInput | CollectionJobWhereInput[]
    OR?: CollectionJobWhereInput[]
    NOT?: CollectionJobWhereInput | CollectionJobWhereInput[]
    tenantId?: StringFilter<"CollectionJob"> | string
    connectionId?: StringFilter<"CollectionJob"> | string
    type?: EnumJobTypeFilter<"CollectionJob"> | $Enums.JobType
    status?: EnumJobStatusFilter<"CollectionJob"> | $Enums.JobStatus
    priority?: IntFilter<"CollectionJob"> | number
    scheduledAt?: DateTimeFilter<"CollectionJob"> | Date | string
    startedAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    nextRunAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    createdAt?: DateTimeFilter<"CollectionJob"> | Date | string
    updatedAt?: DateTimeFilter<"CollectionJob"> | Date | string
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
    runs?: CollectionJobRunListRelationFilter
  }, "id">

  export type CollectionJobOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    scheduledAt?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    nextRunAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CollectionJobCountOrderByAggregateInput
    _avg?: CollectionJobAvgOrderByAggregateInput
    _max?: CollectionJobMaxOrderByAggregateInput
    _min?: CollectionJobMinOrderByAggregateInput
    _sum?: CollectionJobSumOrderByAggregateInput
  }

  export type CollectionJobScalarWhereWithAggregatesInput = {
    AND?: CollectionJobScalarWhereWithAggregatesInput | CollectionJobScalarWhereWithAggregatesInput[]
    OR?: CollectionJobScalarWhereWithAggregatesInput[]
    NOT?: CollectionJobScalarWhereWithAggregatesInput | CollectionJobScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CollectionJob"> | string
    tenantId?: StringWithAggregatesFilter<"CollectionJob"> | string
    connectionId?: StringWithAggregatesFilter<"CollectionJob"> | string
    type?: EnumJobTypeWithAggregatesFilter<"CollectionJob"> | $Enums.JobType
    status?: EnumJobStatusWithAggregatesFilter<"CollectionJob"> | $Enums.JobStatus
    priority?: IntWithAggregatesFilter<"CollectionJob"> | number
    scheduledAt?: DateTimeWithAggregatesFilter<"CollectionJob"> | Date | string
    startedAt?: DateTimeNullableWithAggregatesFilter<"CollectionJob"> | Date | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter<"CollectionJob"> | Date | string | null
    nextRunAt?: DateTimeNullableWithAggregatesFilter<"CollectionJob"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CollectionJob"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CollectionJob"> | Date | string
  }

  export type CollectionJobRunWhereInput = {
    AND?: CollectionJobRunWhereInput | CollectionJobRunWhereInput[]
    OR?: CollectionJobRunWhereInput[]
    NOT?: CollectionJobRunWhereInput | CollectionJobRunWhereInput[]
    id?: StringFilter<"CollectionJobRun"> | string
    jobId?: StringFilter<"CollectionJobRun"> | string
    tenantId?: StringFilter<"CollectionJobRun"> | string
    runNumber?: IntFilter<"CollectionJobRun"> | number
    status?: EnumRunStatusFilter<"CollectionJobRun"> | $Enums.RunStatus
    startedAt?: DateTimeFilter<"CollectionJobRun"> | Date | string
    completedAt?: DateTimeNullableFilter<"CollectionJobRun"> | Date | string | null
    durationMs?: IntNullableFilter<"CollectionJobRun"> | number | null
    evidenceCount?: IntFilter<"CollectionJobRun"> | number
    errorCount?: IntFilter<"CollectionJobRun"> | number
    resultSummary?: JsonNullableFilter<"CollectionJobRun">
    errorDetails?: StringNullableFilter<"CollectionJobRun"> | string | null
    createdAt?: DateTimeFilter<"CollectionJobRun"> | Date | string
    job?: XOR<CollectionJobScalarRelationFilter, CollectionJobWhereInput>
    retries?: CollectionRetryListRelationFilter
  }

  export type CollectionJobRunOrderByWithRelationInput = {
    id?: SortOrder
    jobId?: SortOrder
    tenantId?: SortOrder
    runNumber?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    resultSummary?: SortOrderInput | SortOrder
    errorDetails?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    job?: CollectionJobOrderByWithRelationInput
    retries?: CollectionRetryOrderByRelationAggregateInput
  }

  export type CollectionJobRunWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CollectionJobRunWhereInput | CollectionJobRunWhereInput[]
    OR?: CollectionJobRunWhereInput[]
    NOT?: CollectionJobRunWhereInput | CollectionJobRunWhereInput[]
    jobId?: StringFilter<"CollectionJobRun"> | string
    tenantId?: StringFilter<"CollectionJobRun"> | string
    runNumber?: IntFilter<"CollectionJobRun"> | number
    status?: EnumRunStatusFilter<"CollectionJobRun"> | $Enums.RunStatus
    startedAt?: DateTimeFilter<"CollectionJobRun"> | Date | string
    completedAt?: DateTimeNullableFilter<"CollectionJobRun"> | Date | string | null
    durationMs?: IntNullableFilter<"CollectionJobRun"> | number | null
    evidenceCount?: IntFilter<"CollectionJobRun"> | number
    errorCount?: IntFilter<"CollectionJobRun"> | number
    resultSummary?: JsonNullableFilter<"CollectionJobRun">
    errorDetails?: StringNullableFilter<"CollectionJobRun"> | string | null
    createdAt?: DateTimeFilter<"CollectionJobRun"> | Date | string
    job?: XOR<CollectionJobScalarRelationFilter, CollectionJobWhereInput>
    retries?: CollectionRetryListRelationFilter
  }, "id">

  export type CollectionJobRunOrderByWithAggregationInput = {
    id?: SortOrder
    jobId?: SortOrder
    tenantId?: SortOrder
    runNumber?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    resultSummary?: SortOrderInput | SortOrder
    errorDetails?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CollectionJobRunCountOrderByAggregateInput
    _avg?: CollectionJobRunAvgOrderByAggregateInput
    _max?: CollectionJobRunMaxOrderByAggregateInput
    _min?: CollectionJobRunMinOrderByAggregateInput
    _sum?: CollectionJobRunSumOrderByAggregateInput
  }

  export type CollectionJobRunScalarWhereWithAggregatesInput = {
    AND?: CollectionJobRunScalarWhereWithAggregatesInput | CollectionJobRunScalarWhereWithAggregatesInput[]
    OR?: CollectionJobRunScalarWhereWithAggregatesInput[]
    NOT?: CollectionJobRunScalarWhereWithAggregatesInput | CollectionJobRunScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CollectionJobRun"> | string
    jobId?: StringWithAggregatesFilter<"CollectionJobRun"> | string
    tenantId?: StringWithAggregatesFilter<"CollectionJobRun"> | string
    runNumber?: IntWithAggregatesFilter<"CollectionJobRun"> | number
    status?: EnumRunStatusWithAggregatesFilter<"CollectionJobRun"> | $Enums.RunStatus
    startedAt?: DateTimeWithAggregatesFilter<"CollectionJobRun"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"CollectionJobRun"> | Date | string | null
    durationMs?: IntNullableWithAggregatesFilter<"CollectionJobRun"> | number | null
    evidenceCount?: IntWithAggregatesFilter<"CollectionJobRun"> | number
    errorCount?: IntWithAggregatesFilter<"CollectionJobRun"> | number
    resultSummary?: JsonNullableWithAggregatesFilter<"CollectionJobRun">
    errorDetails?: StringNullableWithAggregatesFilter<"CollectionJobRun"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CollectionJobRun"> | Date | string
  }

  export type CollectionRetryWhereInput = {
    AND?: CollectionRetryWhereInput | CollectionRetryWhereInput[]
    OR?: CollectionRetryWhereInput[]
    NOT?: CollectionRetryWhereInput | CollectionRetryWhereInput[]
    id?: StringFilter<"CollectionRetry"> | string
    jobRunId?: StringFilter<"CollectionRetry"> | string
    tenantId?: StringFilter<"CollectionRetry"> | string
    attemptNumber?: IntFilter<"CollectionRetry"> | number
    status?: EnumRetryStatusFilter<"CollectionRetry"> | $Enums.RetryStatus
    errorMessage?: StringNullableFilter<"CollectionRetry"> | string | null
    scheduledAt?: DateTimeFilter<"CollectionRetry"> | Date | string
    attemptedAt?: DateTimeNullableFilter<"CollectionRetry"> | Date | string | null
    nextRetryAt?: DateTimeNullableFilter<"CollectionRetry"> | Date | string | null
    maxAttempts?: IntFilter<"CollectionRetry"> | number
    backoffMs?: IntFilter<"CollectionRetry"> | number
    createdAt?: DateTimeFilter<"CollectionRetry"> | Date | string
    jobRun?: XOR<CollectionJobRunScalarRelationFilter, CollectionJobRunWhereInput>
  }

  export type CollectionRetryOrderByWithRelationInput = {
    id?: SortOrder
    jobRunId?: SortOrder
    tenantId?: SortOrder
    attemptNumber?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    scheduledAt?: SortOrder
    attemptedAt?: SortOrderInput | SortOrder
    nextRetryAt?: SortOrderInput | SortOrder
    maxAttempts?: SortOrder
    backoffMs?: SortOrder
    createdAt?: SortOrder
    jobRun?: CollectionJobRunOrderByWithRelationInput
  }

  export type CollectionRetryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CollectionRetryWhereInput | CollectionRetryWhereInput[]
    OR?: CollectionRetryWhereInput[]
    NOT?: CollectionRetryWhereInput | CollectionRetryWhereInput[]
    jobRunId?: StringFilter<"CollectionRetry"> | string
    tenantId?: StringFilter<"CollectionRetry"> | string
    attemptNumber?: IntFilter<"CollectionRetry"> | number
    status?: EnumRetryStatusFilter<"CollectionRetry"> | $Enums.RetryStatus
    errorMessage?: StringNullableFilter<"CollectionRetry"> | string | null
    scheduledAt?: DateTimeFilter<"CollectionRetry"> | Date | string
    attemptedAt?: DateTimeNullableFilter<"CollectionRetry"> | Date | string | null
    nextRetryAt?: DateTimeNullableFilter<"CollectionRetry"> | Date | string | null
    maxAttempts?: IntFilter<"CollectionRetry"> | number
    backoffMs?: IntFilter<"CollectionRetry"> | number
    createdAt?: DateTimeFilter<"CollectionRetry"> | Date | string
    jobRun?: XOR<CollectionJobRunScalarRelationFilter, CollectionJobRunWhereInput>
  }, "id">

  export type CollectionRetryOrderByWithAggregationInput = {
    id?: SortOrder
    jobRunId?: SortOrder
    tenantId?: SortOrder
    attemptNumber?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    scheduledAt?: SortOrder
    attemptedAt?: SortOrderInput | SortOrder
    nextRetryAt?: SortOrderInput | SortOrder
    maxAttempts?: SortOrder
    backoffMs?: SortOrder
    createdAt?: SortOrder
    _count?: CollectionRetryCountOrderByAggregateInput
    _avg?: CollectionRetryAvgOrderByAggregateInput
    _max?: CollectionRetryMaxOrderByAggregateInput
    _min?: CollectionRetryMinOrderByAggregateInput
    _sum?: CollectionRetrySumOrderByAggregateInput
  }

  export type CollectionRetryScalarWhereWithAggregatesInput = {
    AND?: CollectionRetryScalarWhereWithAggregatesInput | CollectionRetryScalarWhereWithAggregatesInput[]
    OR?: CollectionRetryScalarWhereWithAggregatesInput[]
    NOT?: CollectionRetryScalarWhereWithAggregatesInput | CollectionRetryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CollectionRetry"> | string
    jobRunId?: StringWithAggregatesFilter<"CollectionRetry"> | string
    tenantId?: StringWithAggregatesFilter<"CollectionRetry"> | string
    attemptNumber?: IntWithAggregatesFilter<"CollectionRetry"> | number
    status?: EnumRetryStatusWithAggregatesFilter<"CollectionRetry"> | $Enums.RetryStatus
    errorMessage?: StringNullableWithAggregatesFilter<"CollectionRetry"> | string | null
    scheduledAt?: DateTimeWithAggregatesFilter<"CollectionRetry"> | Date | string
    attemptedAt?: DateTimeNullableWithAggregatesFilter<"CollectionRetry"> | Date | string | null
    nextRetryAt?: DateTimeNullableWithAggregatesFilter<"CollectionRetry"> | Date | string | null
    maxAttempts?: IntWithAggregatesFilter<"CollectionRetry"> | number
    backoffMs?: IntWithAggregatesFilter<"CollectionRetry"> | number
    createdAt?: DateTimeWithAggregatesFilter<"CollectionRetry"> | Date | string
  }

  export type SecretVaultWhereInput = {
    AND?: SecretVaultWhereInput | SecretVaultWhereInput[]
    OR?: SecretVaultWhereInput[]
    NOT?: SecretVaultWhereInput | SecretVaultWhereInput[]
    id?: StringFilter<"SecretVault"> | string
    tenantId?: StringFilter<"SecretVault"> | string
    scope?: EnumSecretScopeFilter<"SecretVault"> | $Enums.SecretScope
    ownerType?: StringFilter<"SecretVault"> | string
    ownerId?: StringFilter<"SecretVault"> | string
    encryptedPayload?: StringFilter<"SecretVault"> | string
    kmsKeyId?: StringNullableFilter<"SecretVault"> | string | null
    rotatedAt?: DateTimeNullableFilter<"SecretVault"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"SecretVault"> | Date | string | null
    createdAt?: DateTimeFilter<"SecretVault"> | Date | string
    updatedAt?: DateTimeFilter<"SecretVault"> | Date | string
  }

  export type SecretVaultOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    scope?: SortOrder
    ownerType?: SortOrder
    ownerId?: SortOrder
    encryptedPayload?: SortOrder
    kmsKeyId?: SortOrderInput | SortOrder
    rotatedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SecretVaultWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SecretVaultWhereInput | SecretVaultWhereInput[]
    OR?: SecretVaultWhereInput[]
    NOT?: SecretVaultWhereInput | SecretVaultWhereInput[]
    tenantId?: StringFilter<"SecretVault"> | string
    scope?: EnumSecretScopeFilter<"SecretVault"> | $Enums.SecretScope
    ownerType?: StringFilter<"SecretVault"> | string
    ownerId?: StringFilter<"SecretVault"> | string
    encryptedPayload?: StringFilter<"SecretVault"> | string
    kmsKeyId?: StringNullableFilter<"SecretVault"> | string | null
    rotatedAt?: DateTimeNullableFilter<"SecretVault"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"SecretVault"> | Date | string | null
    createdAt?: DateTimeFilter<"SecretVault"> | Date | string
    updatedAt?: DateTimeFilter<"SecretVault"> | Date | string
  }, "id">

  export type SecretVaultOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    scope?: SortOrder
    ownerType?: SortOrder
    ownerId?: SortOrder
    encryptedPayload?: SortOrder
    kmsKeyId?: SortOrderInput | SortOrder
    rotatedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SecretVaultCountOrderByAggregateInput
    _max?: SecretVaultMaxOrderByAggregateInput
    _min?: SecretVaultMinOrderByAggregateInput
  }

  export type SecretVaultScalarWhereWithAggregatesInput = {
    AND?: SecretVaultScalarWhereWithAggregatesInput | SecretVaultScalarWhereWithAggregatesInput[]
    OR?: SecretVaultScalarWhereWithAggregatesInput[]
    NOT?: SecretVaultScalarWhereWithAggregatesInput | SecretVaultScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SecretVault"> | string
    tenantId?: StringWithAggregatesFilter<"SecretVault"> | string
    scope?: EnumSecretScopeWithAggregatesFilter<"SecretVault"> | $Enums.SecretScope
    ownerType?: StringWithAggregatesFilter<"SecretVault"> | string
    ownerId?: StringWithAggregatesFilter<"SecretVault"> | string
    encryptedPayload?: StringWithAggregatesFilter<"SecretVault"> | string
    kmsKeyId?: StringNullableWithAggregatesFilter<"SecretVault"> | string | null
    rotatedAt?: DateTimeNullableWithAggregatesFilter<"SecretVault"> | Date | string | null
    expiresAt?: DateTimeNullableWithAggregatesFilter<"SecretVault"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SecretVault"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SecretVault"> | Date | string
  }

  export type SyncLogWhereInput = {
    AND?: SyncLogWhereInput | SyncLogWhereInput[]
    OR?: SyncLogWhereInput[]
    NOT?: SyncLogWhereInput | SyncLogWhereInput[]
    id?: StringFilter<"SyncLog"> | string
    tenantId?: StringFilter<"SyncLog"> | string
    connectionId?: StringFilter<"SyncLog"> | string
    integrationId?: StringFilter<"SyncLog"> | string
    action?: EnumSyncActionFilter<"SyncLog"> | $Enums.SyncAction
    status?: EnumSyncStatusFilter<"SyncLog"> | $Enums.SyncStatus
    recordsProcessed?: IntFilter<"SyncLog"> | number
    recordsFailed?: IntFilter<"SyncLog"> | number
    startedAt?: DateTimeFilter<"SyncLog"> | Date | string
    completedAt?: DateTimeNullableFilter<"SyncLog"> | Date | string | null
    details?: JsonNullableFilter<"SyncLog">
    createdAt?: DateTimeFilter<"SyncLog"> | Date | string
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
  }

  export type SyncLogOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    action?: SortOrder
    status?: SortOrder
    recordsProcessed?: SortOrder
    recordsFailed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    details?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    connection?: IntegrationConnectionOrderByWithRelationInput
  }

  export type SyncLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SyncLogWhereInput | SyncLogWhereInput[]
    OR?: SyncLogWhereInput[]
    NOT?: SyncLogWhereInput | SyncLogWhereInput[]
    tenantId?: StringFilter<"SyncLog"> | string
    connectionId?: StringFilter<"SyncLog"> | string
    integrationId?: StringFilter<"SyncLog"> | string
    action?: EnumSyncActionFilter<"SyncLog"> | $Enums.SyncAction
    status?: EnumSyncStatusFilter<"SyncLog"> | $Enums.SyncStatus
    recordsProcessed?: IntFilter<"SyncLog"> | number
    recordsFailed?: IntFilter<"SyncLog"> | number
    startedAt?: DateTimeFilter<"SyncLog"> | Date | string
    completedAt?: DateTimeNullableFilter<"SyncLog"> | Date | string | null
    details?: JsonNullableFilter<"SyncLog">
    createdAt?: DateTimeFilter<"SyncLog"> | Date | string
    connection?: XOR<IntegrationConnectionScalarRelationFilter, IntegrationConnectionWhereInput>
  }, "id">

  export type SyncLogOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    action?: SortOrder
    status?: SortOrder
    recordsProcessed?: SortOrder
    recordsFailed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    details?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: SyncLogCountOrderByAggregateInput
    _avg?: SyncLogAvgOrderByAggregateInput
    _max?: SyncLogMaxOrderByAggregateInput
    _min?: SyncLogMinOrderByAggregateInput
    _sum?: SyncLogSumOrderByAggregateInput
  }

  export type SyncLogScalarWhereWithAggregatesInput = {
    AND?: SyncLogScalarWhereWithAggregatesInput | SyncLogScalarWhereWithAggregatesInput[]
    OR?: SyncLogScalarWhereWithAggregatesInput[]
    NOT?: SyncLogScalarWhereWithAggregatesInput | SyncLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SyncLog"> | string
    tenantId?: StringWithAggregatesFilter<"SyncLog"> | string
    connectionId?: StringWithAggregatesFilter<"SyncLog"> | string
    integrationId?: StringWithAggregatesFilter<"SyncLog"> | string
    action?: EnumSyncActionWithAggregatesFilter<"SyncLog"> | $Enums.SyncAction
    status?: EnumSyncStatusWithAggregatesFilter<"SyncLog"> | $Enums.SyncStatus
    recordsProcessed?: IntWithAggregatesFilter<"SyncLog"> | number
    recordsFailed?: IntWithAggregatesFilter<"SyncLog"> | number
    startedAt?: DateTimeWithAggregatesFilter<"SyncLog"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"SyncLog"> | Date | string | null
    details?: JsonNullableWithAggregatesFilter<"SyncLog">
    createdAt?: DateTimeWithAggregatesFilter<"SyncLog"> | Date | string
  }

  export type AgentRunCreateInput = {
    id?: string
    tenantId: string
    controlId: string
    controlTitle?: string | null
    trigger?: $Enums.AgentRunTrigger
    status?: $Enums.AgentRunStatus
    instructions: string
    toolConnectionIds?: AgentRunCreatetoolConnectionIdsInput | string[]
    aiProvider?: string | null
    aiModel?: string | null
    aiCredentialsEncrypted?: string | null
    evidenceCount?: number
    errorCount?: number
    errorMessage?: string | null
    transcript?: NullableJsonNullValueInput | InputJsonValue
    summary?: string | null
    toolCallSummary?: NullableJsonNullValueInput | InputJsonValue
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    durationMs?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentRunUncheckedCreateInput = {
    id?: string
    tenantId: string
    controlId: string
    controlTitle?: string | null
    trigger?: $Enums.AgentRunTrigger
    status?: $Enums.AgentRunStatus
    instructions: string
    toolConnectionIds?: AgentRunCreatetoolConnectionIdsInput | string[]
    aiProvider?: string | null
    aiModel?: string | null
    aiCredentialsEncrypted?: string | null
    evidenceCount?: number
    errorCount?: number
    errorMessage?: string | null
    transcript?: NullableJsonNullValueInput | InputJsonValue
    summary?: string | null
    toolCallSummary?: NullableJsonNullValueInput | InputJsonValue
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    durationMs?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentRunUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    controlTitle?: NullableStringFieldUpdateOperationsInput | string | null
    trigger?: EnumAgentRunTriggerFieldUpdateOperationsInput | $Enums.AgentRunTrigger
    status?: EnumAgentRunStatusFieldUpdateOperationsInput | $Enums.AgentRunStatus
    instructions?: StringFieldUpdateOperationsInput | string
    toolConnectionIds?: AgentRunUpdatetoolConnectionIdsInput | string[]
    aiProvider?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    aiCredentialsEncrypted?: NullableStringFieldUpdateOperationsInput | string | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    transcript?: NullableJsonNullValueInput | InputJsonValue
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    toolCallSummary?: NullableJsonNullValueInput | InputJsonValue
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentRunUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    controlTitle?: NullableStringFieldUpdateOperationsInput | string | null
    trigger?: EnumAgentRunTriggerFieldUpdateOperationsInput | $Enums.AgentRunTrigger
    status?: EnumAgentRunStatusFieldUpdateOperationsInput | $Enums.AgentRunStatus
    instructions?: StringFieldUpdateOperationsInput | string
    toolConnectionIds?: AgentRunUpdatetoolConnectionIdsInput | string[]
    aiProvider?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    aiCredentialsEncrypted?: NullableStringFieldUpdateOperationsInput | string | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    transcript?: NullableJsonNullValueInput | InputJsonValue
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    toolCallSummary?: NullableJsonNullValueInput | InputJsonValue
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentRunCreateManyInput = {
    id?: string
    tenantId: string
    controlId: string
    controlTitle?: string | null
    trigger?: $Enums.AgentRunTrigger
    status?: $Enums.AgentRunStatus
    instructions: string
    toolConnectionIds?: AgentRunCreatetoolConnectionIdsInput | string[]
    aiProvider?: string | null
    aiModel?: string | null
    aiCredentialsEncrypted?: string | null
    evidenceCount?: number
    errorCount?: number
    errorMessage?: string | null
    transcript?: NullableJsonNullValueInput | InputJsonValue
    summary?: string | null
    toolCallSummary?: NullableJsonNullValueInput | InputJsonValue
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    durationMs?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentRunUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    controlTitle?: NullableStringFieldUpdateOperationsInput | string | null
    trigger?: EnumAgentRunTriggerFieldUpdateOperationsInput | $Enums.AgentRunTrigger
    status?: EnumAgentRunStatusFieldUpdateOperationsInput | $Enums.AgentRunStatus
    instructions?: StringFieldUpdateOperationsInput | string
    toolConnectionIds?: AgentRunUpdatetoolConnectionIdsInput | string[]
    aiProvider?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    aiCredentialsEncrypted?: NullableStringFieldUpdateOperationsInput | string | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    transcript?: NullableJsonNullValueInput | InputJsonValue
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    toolCallSummary?: NullableJsonNullValueInput | InputJsonValue
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentRunUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    controlTitle?: NullableStringFieldUpdateOperationsInput | string | null
    trigger?: EnumAgentRunTriggerFieldUpdateOperationsInput | $Enums.AgentRunTrigger
    status?: EnumAgentRunStatusFieldUpdateOperationsInput | $Enums.AgentRunStatus
    instructions?: StringFieldUpdateOperationsInput | string
    toolConnectionIds?: AgentRunUpdatetoolConnectionIdsInput | string[]
    aiProvider?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    aiCredentialsEncrypted?: NullableStringFieldUpdateOperationsInput | string | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    transcript?: NullableJsonNullValueInput | InputJsonValue
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    toolCallSummary?: NullableJsonNullValueInput | InputJsonValue
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationConnectionCreateInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    integration: IntegrationCreateNestedOneWithoutConnectionsInput
    jobs?: CollectionJobCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionUncheckedCreateInput = {
    id?: string
    tenantId: string
    integrationId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    jobs?: CollectionJobUncheckedCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogUncheckedCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckUncheckedCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultUncheckedCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integration?: IntegrationUpdateOneRequiredWithoutConnectionsNestedInput
    jobs?: CollectionJobUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobs?: CollectionJobUncheckedUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUncheckedUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUncheckedUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUncheckedUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUncheckedUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionCreateManyInput = {
    id?: string
    tenantId: string
    integrationId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type IntegrationConnectionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationConnectionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckCreateInput = {
    id?: string
    tenantId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutChecksInput
    integration: IntegrationCreateNestedOneWithoutChecksInput
    controls?: IntegrationCheckControlCreateNestedManyWithoutIntegrationCheckInput
    results?: IntegrationCheckResultCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckUncheckedCreateInput = {
    id?: string
    tenantId: string
    connectionId: string
    integrationId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    controls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutIntegrationCheckInput
    results?: IntegrationCheckResultUncheckedCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutChecksNestedInput
    integration?: IntegrationUpdateOneRequiredWithoutChecksNestedInput
    controls?: IntegrationCheckControlUpdateManyWithoutIntegrationCheckNestedInput
    results?: IntegrationCheckResultUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationCheckUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    controls?: IntegrationCheckControlUncheckedUpdateManyWithoutIntegrationCheckNestedInput
    results?: IntegrationCheckResultUncheckedUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationCheckCreateManyInput = {
    id?: string
    tenantId: string
    connectionId: string
    integrationId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type IntegrationCheckUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckControlCreateInput = {
    id?: string
    tenantId: string
    controlId: string
    createdAt?: Date | string
    integrationCheck: IntegrationCheckCreateNestedOneWithoutControlsInput
    connection: IntegrationConnectionCreateNestedOneWithoutCheckControlsInput
  }

  export type IntegrationCheckControlUncheckedCreateInput = {
    id?: string
    tenantId: string
    integrationCheckId: string
    connectionId: string
    controlId: string
    createdAt?: Date | string
  }

  export type IntegrationCheckControlUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integrationCheck?: IntegrationCheckUpdateOneRequiredWithoutControlsNestedInput
    connection?: IntegrationConnectionUpdateOneRequiredWithoutCheckControlsNestedInput
  }

  export type IntegrationCheckControlUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationCheckId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckControlCreateManyInput = {
    id?: string
    tenantId: string
    integrationCheckId: string
    connectionId: string
    controlId: string
    createdAt?: Date | string
  }

  export type IntegrationCheckControlUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckControlUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationCheckId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckResultCreateInput = {
    id?: string
    tenantId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
    integrationCheck: IntegrationCheckCreateNestedOneWithoutResultsInput
    connection: IntegrationConnectionCreateNestedOneWithoutCheckResultsInput
  }

  export type IntegrationCheckResultUncheckedCreateInput = {
    id?: string
    tenantId: string
    integrationCheckId: string
    connectionId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
  }

  export type IntegrationCheckResultUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integrationCheck?: IntegrationCheckUpdateOneRequiredWithoutResultsNestedInput
    connection?: IntegrationConnectionUpdateOneRequiredWithoutCheckResultsNestedInput
  }

  export type IntegrationCheckResultUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationCheckId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckResultCreateManyInput = {
    id?: string
    tenantId: string
    integrationCheckId: string
    connectionId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
  }

  export type IntegrationCheckResultUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckResultUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationCheckId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCreateInput = {
    id: string
    name: string
    description?: string | null
    authType: $Enums.AuthType
    category: $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationCreatecapabilitiesInput | string[]
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    connections?: IntegrationConnectionCreateNestedManyWithoutIntegrationInput
    checks?: IntegrationCheckCreateNestedManyWithoutIntegrationInput
  }

  export type IntegrationUncheckedCreateInput = {
    id: string
    name: string
    description?: string | null
    authType: $Enums.AuthType
    category: $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationCreatecapabilitiesInput | string[]
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    connections?: IntegrationConnectionUncheckedCreateNestedManyWithoutIntegrationInput
    checks?: IntegrationCheckUncheckedCreateNestedManyWithoutIntegrationInput
  }

  export type IntegrationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    authType?: EnumAuthTypeFieldUpdateOperationsInput | $Enums.AuthType
    category?: EnumIntegrationCategoryFieldUpdateOperationsInput | $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationUpdatecapabilitiesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connections?: IntegrationConnectionUpdateManyWithoutIntegrationNestedInput
    checks?: IntegrationCheckUpdateManyWithoutIntegrationNestedInput
  }

  export type IntegrationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    authType?: EnumAuthTypeFieldUpdateOperationsInput | $Enums.AuthType
    category?: EnumIntegrationCategoryFieldUpdateOperationsInput | $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationUpdatecapabilitiesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connections?: IntegrationConnectionUncheckedUpdateManyWithoutIntegrationNestedInput
    checks?: IntegrationCheckUncheckedUpdateManyWithoutIntegrationNestedInput
  }

  export type IntegrationCreateManyInput = {
    id: string
    name: string
    description?: string | null
    authType: $Enums.AuthType
    category: $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationCreatecapabilitiesInput | string[]
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type IntegrationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    authType?: EnumAuthTypeFieldUpdateOperationsInput | $Enums.AuthType
    category?: EnumIntegrationCategoryFieldUpdateOperationsInput | $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationUpdatecapabilitiesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    authType?: EnumAuthTypeFieldUpdateOperationsInput | $Enums.AuthType
    category?: EnumIntegrationCategoryFieldUpdateOperationsInput | $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationUpdatecapabilitiesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionJobCreateInput = {
    id?: string
    tenantId: string
    type: $Enums.JobType
    status?: $Enums.JobStatus
    priority?: number
    scheduledAt?: Date | string
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    nextRunAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutJobsInput
    runs?: CollectionJobRunCreateNestedManyWithoutJobInput
  }

  export type CollectionJobUncheckedCreateInput = {
    id?: string
    tenantId: string
    connectionId: string
    type: $Enums.JobType
    status?: $Enums.JobStatus
    priority?: number
    scheduledAt?: Date | string
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    nextRunAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    runs?: CollectionJobRunUncheckedCreateNestedManyWithoutJobInput
  }

  export type CollectionJobUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutJobsNestedInput
    runs?: CollectionJobRunUpdateManyWithoutJobNestedInput
  }

  export type CollectionJobUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    runs?: CollectionJobRunUncheckedUpdateManyWithoutJobNestedInput
  }

  export type CollectionJobCreateManyInput = {
    id?: string
    tenantId: string
    connectionId: string
    type: $Enums.JobType
    status?: $Enums.JobStatus
    priority?: number
    scheduledAt?: Date | string
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    nextRunAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CollectionJobUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionJobUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionJobRunCreateInput = {
    id?: string
    tenantId: string
    runNumber: number
    status?: $Enums.RunStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    evidenceCount?: number
    errorCount?: number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: string | null
    createdAt?: Date | string
    job: CollectionJobCreateNestedOneWithoutRunsInput
    retries?: CollectionRetryCreateNestedManyWithoutJobRunInput
  }

  export type CollectionJobRunUncheckedCreateInput = {
    id?: string
    jobId: string
    tenantId: string
    runNumber: number
    status?: $Enums.RunStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    evidenceCount?: number
    errorCount?: number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: string | null
    createdAt?: Date | string
    retries?: CollectionRetryUncheckedCreateNestedManyWithoutJobRunInput
  }

  export type CollectionJobRunUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: CollectionJobUpdateOneRequiredWithoutRunsNestedInput
    retries?: CollectionRetryUpdateManyWithoutJobRunNestedInput
  }

  export type CollectionJobRunUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    retries?: CollectionRetryUncheckedUpdateManyWithoutJobRunNestedInput
  }

  export type CollectionJobRunCreateManyInput = {
    id?: string
    jobId: string
    tenantId: string
    runNumber: number
    status?: $Enums.RunStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    evidenceCount?: number
    errorCount?: number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: string | null
    createdAt?: Date | string
  }

  export type CollectionJobRunUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionJobRunUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionRetryCreateInput = {
    id?: string
    tenantId: string
    attemptNumber: number
    status?: $Enums.RetryStatus
    errorMessage?: string | null
    scheduledAt?: Date | string
    attemptedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    maxAttempts?: number
    backoffMs?: number
    createdAt?: Date | string
    jobRun: CollectionJobRunCreateNestedOneWithoutRetriesInput
  }

  export type CollectionRetryUncheckedCreateInput = {
    id?: string
    jobRunId: string
    tenantId: string
    attemptNumber: number
    status?: $Enums.RetryStatus
    errorMessage?: string | null
    scheduledAt?: Date | string
    attemptedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    maxAttempts?: number
    backoffMs?: number
    createdAt?: Date | string
  }

  export type CollectionRetryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    attemptNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRetryStatusFieldUpdateOperationsInput | $Enums.RetryStatus
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    maxAttempts?: IntFieldUpdateOperationsInput | number
    backoffMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobRun?: CollectionJobRunUpdateOneRequiredWithoutRetriesNestedInput
  }

  export type CollectionRetryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobRunId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    attemptNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRetryStatusFieldUpdateOperationsInput | $Enums.RetryStatus
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    maxAttempts?: IntFieldUpdateOperationsInput | number
    backoffMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionRetryCreateManyInput = {
    id?: string
    jobRunId: string
    tenantId: string
    attemptNumber: number
    status?: $Enums.RetryStatus
    errorMessage?: string | null
    scheduledAt?: Date | string
    attemptedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    maxAttempts?: number
    backoffMs?: number
    createdAt?: Date | string
  }

  export type CollectionRetryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    attemptNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRetryStatusFieldUpdateOperationsInput | $Enums.RetryStatus
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    maxAttempts?: IntFieldUpdateOperationsInput | number
    backoffMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionRetryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobRunId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    attemptNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRetryStatusFieldUpdateOperationsInput | $Enums.RetryStatus
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    maxAttempts?: IntFieldUpdateOperationsInput | number
    backoffMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecretVaultCreateInput = {
    id?: string
    tenantId: string
    scope?: $Enums.SecretScope
    ownerType: string
    ownerId: string
    encryptedPayload: string
    kmsKeyId?: string | null
    rotatedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SecretVaultUncheckedCreateInput = {
    id?: string
    tenantId: string
    scope?: $Enums.SecretScope
    ownerType: string
    ownerId: string
    encryptedPayload: string
    kmsKeyId?: string | null
    rotatedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SecretVaultUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    scope?: EnumSecretScopeFieldUpdateOperationsInput | $Enums.SecretScope
    ownerType?: StringFieldUpdateOperationsInput | string
    ownerId?: StringFieldUpdateOperationsInput | string
    encryptedPayload?: StringFieldUpdateOperationsInput | string
    kmsKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    rotatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecretVaultUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    scope?: EnumSecretScopeFieldUpdateOperationsInput | $Enums.SecretScope
    ownerType?: StringFieldUpdateOperationsInput | string
    ownerId?: StringFieldUpdateOperationsInput | string
    encryptedPayload?: StringFieldUpdateOperationsInput | string
    kmsKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    rotatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecretVaultCreateManyInput = {
    id?: string
    tenantId: string
    scope?: $Enums.SecretScope
    ownerType: string
    ownerId: string
    encryptedPayload: string
    kmsKeyId?: string | null
    rotatedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SecretVaultUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    scope?: EnumSecretScopeFieldUpdateOperationsInput | $Enums.SecretScope
    ownerType?: StringFieldUpdateOperationsInput | string
    ownerId?: StringFieldUpdateOperationsInput | string
    encryptedPayload?: StringFieldUpdateOperationsInput | string
    kmsKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    rotatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SecretVaultUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    scope?: EnumSecretScopeFieldUpdateOperationsInput | $Enums.SecretScope
    ownerType?: StringFieldUpdateOperationsInput | string
    ownerId?: StringFieldUpdateOperationsInput | string
    encryptedPayload?: StringFieldUpdateOperationsInput | string
    kmsKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    rotatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncLogCreateInput = {
    id?: string
    tenantId: string
    integrationId: string
    action: $Enums.SyncAction
    status?: $Enums.SyncStatus
    recordsProcessed?: number
    recordsFailed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutSyncLogsInput
  }

  export type SyncLogUncheckedCreateInput = {
    id?: string
    tenantId: string
    connectionId: string
    integrationId: string
    action: $Enums.SyncAction
    status?: $Enums.SyncStatus
    recordsProcessed?: number
    recordsFailed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SyncLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    action?: EnumSyncActionFieldUpdateOperationsInput | $Enums.SyncAction
    status?: EnumSyncStatusFieldUpdateOperationsInput | $Enums.SyncStatus
    recordsProcessed?: IntFieldUpdateOperationsInput | number
    recordsFailed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutSyncLogsNestedInput
  }

  export type SyncLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    action?: EnumSyncActionFieldUpdateOperationsInput | $Enums.SyncAction
    status?: EnumSyncStatusFieldUpdateOperationsInput | $Enums.SyncStatus
    recordsProcessed?: IntFieldUpdateOperationsInput | number
    recordsFailed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncLogCreateManyInput = {
    id?: string
    tenantId: string
    connectionId: string
    integrationId: string
    action: $Enums.SyncAction
    status?: $Enums.SyncStatus
    recordsProcessed?: number
    recordsFailed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SyncLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    action?: EnumSyncActionFieldUpdateOperationsInput | $Enums.SyncAction
    status?: EnumSyncStatusFieldUpdateOperationsInput | $Enums.SyncStatus
    recordsProcessed?: IntFieldUpdateOperationsInput | number
    recordsFailed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    action?: EnumSyncActionFieldUpdateOperationsInput | $Enums.SyncAction
    status?: EnumSyncStatusFieldUpdateOperationsInput | $Enums.SyncStatus
    recordsProcessed?: IntFieldUpdateOperationsInput | number
    recordsFailed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumAgentRunTriggerFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunTrigger | EnumAgentRunTriggerFieldRefInput<$PrismaModel>
    in?: $Enums.AgentRunTrigger[] | ListEnumAgentRunTriggerFieldRefInput<$PrismaModel>
    notIn?: $Enums.AgentRunTrigger[] | ListEnumAgentRunTriggerFieldRefInput<$PrismaModel>
    not?: NestedEnumAgentRunTriggerFilter<$PrismaModel> | $Enums.AgentRunTrigger
  }

  export type EnumAgentRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunStatus | EnumAgentRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AgentRunStatus[] | ListEnumAgentRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AgentRunStatus[] | ListEnumAgentRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAgentRunStatusFilter<$PrismaModel> | $Enums.AgentRunStatus
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AgentRunCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    controlId?: SortOrder
    controlTitle?: SortOrder
    trigger?: SortOrder
    status?: SortOrder
    instructions?: SortOrder
    toolConnectionIds?: SortOrder
    aiProvider?: SortOrder
    aiModel?: SortOrder
    aiCredentialsEncrypted?: SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    errorMessage?: SortOrder
    transcript?: SortOrder
    summary?: SortOrder
    toolCallSummary?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentRunAvgOrderByAggregateInput = {
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    durationMs?: SortOrder
  }

  export type AgentRunMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    controlId?: SortOrder
    controlTitle?: SortOrder
    trigger?: SortOrder
    status?: SortOrder
    instructions?: SortOrder
    aiProvider?: SortOrder
    aiModel?: SortOrder
    aiCredentialsEncrypted?: SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    errorMessage?: SortOrder
    summary?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentRunMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    controlId?: SortOrder
    controlTitle?: SortOrder
    trigger?: SortOrder
    status?: SortOrder
    instructions?: SortOrder
    aiProvider?: SortOrder
    aiModel?: SortOrder
    aiCredentialsEncrypted?: SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    errorMessage?: SortOrder
    summary?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentRunSumOrderByAggregateInput = {
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    durationMs?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumAgentRunTriggerWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunTrigger | EnumAgentRunTriggerFieldRefInput<$PrismaModel>
    in?: $Enums.AgentRunTrigger[] | ListEnumAgentRunTriggerFieldRefInput<$PrismaModel>
    notIn?: $Enums.AgentRunTrigger[] | ListEnumAgentRunTriggerFieldRefInput<$PrismaModel>
    not?: NestedEnumAgentRunTriggerWithAggregatesFilter<$PrismaModel> | $Enums.AgentRunTrigger
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAgentRunTriggerFilter<$PrismaModel>
    _max?: NestedEnumAgentRunTriggerFilter<$PrismaModel>
  }

  export type EnumAgentRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunStatus | EnumAgentRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AgentRunStatus[] | ListEnumAgentRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AgentRunStatus[] | ListEnumAgentRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAgentRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.AgentRunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAgentRunStatusFilter<$PrismaModel>
    _max?: NestedEnumAgentRunStatusFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumConnectionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ConnectionStatus | EnumConnectionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ConnectionStatus[] | ListEnumConnectionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ConnectionStatus[] | ListEnumConnectionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumConnectionStatusFilter<$PrismaModel> | $Enums.ConnectionStatus
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type IntegrationScalarRelationFilter = {
    is?: IntegrationWhereInput
    isNot?: IntegrationWhereInput
  }

  export type CollectionJobListRelationFilter = {
    every?: CollectionJobWhereInput
    some?: CollectionJobWhereInput
    none?: CollectionJobWhereInput
  }

  export type SyncLogListRelationFilter = {
    every?: SyncLogWhereInput
    some?: SyncLogWhereInput
    none?: SyncLogWhereInput
  }

  export type IntegrationCheckListRelationFilter = {
    every?: IntegrationCheckWhereInput
    some?: IntegrationCheckWhereInput
    none?: IntegrationCheckWhereInput
  }

  export type IntegrationCheckControlListRelationFilter = {
    every?: IntegrationCheckControlWhereInput
    some?: IntegrationCheckControlWhereInput
    none?: IntegrationCheckControlWhereInput
  }

  export type IntegrationCheckResultListRelationFilter = {
    every?: IntegrationCheckResultWhereInput
    some?: IntegrationCheckResultWhereInput
    none?: IntegrationCheckResultWhereInput
  }

  export type CollectionJobOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SyncLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IntegrationCheckOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IntegrationCheckControlOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IntegrationCheckResultOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IntegrationConnectionTenantIdIntegrationIdNameCompoundUniqueInput = {
    tenantId: string
    integrationId: string
    name: string
  }

  export type IntegrationConnectionCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    secretId?: SortOrder
    config?: SortOrder
    lastSyncAt?: SortOrder
    lastErrorMessage?: SortOrder
    syncFrequencyMinutes?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntegrationConnectionAvgOrderByAggregateInput = {
    syncFrequencyMinutes?: SortOrder
  }

  export type IntegrationConnectionMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    secretId?: SortOrder
    lastSyncAt?: SortOrder
    lastErrorMessage?: SortOrder
    syncFrequencyMinutes?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntegrationConnectionMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationId?: SortOrder
    name?: SortOrder
    status?: SortOrder
    secretId?: SortOrder
    lastSyncAt?: SortOrder
    lastErrorMessage?: SortOrder
    syncFrequencyMinutes?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntegrationConnectionSumOrderByAggregateInput = {
    syncFrequencyMinutes?: SortOrder
  }

  export type EnumConnectionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ConnectionStatus | EnumConnectionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ConnectionStatus[] | ListEnumConnectionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ConnectionStatus[] | ListEnumConnectionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumConnectionStatusWithAggregatesFilter<$PrismaModel> | $Enums.ConnectionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumConnectionStatusFilter<$PrismaModel>
    _max?: NestedEnumConnectionStatusFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumIntegrationCheckSeverityFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCheckSeverity | EnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCheckSeverity[] | ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCheckSeverity[] | ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCheckSeverityFilter<$PrismaModel> | $Enums.IntegrationCheckSeverity
  }

  export type EnumIntegrationCheckStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCheckStatus | EnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCheckStatus[] | ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCheckStatus[] | ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCheckStatusFilter<$PrismaModel> | $Enums.IntegrationCheckStatus
  }

  export type IntegrationConnectionScalarRelationFilter = {
    is?: IntegrationConnectionWhereInput
    isNot?: IntegrationConnectionWhereInput
  }

  export type IntegrationCheckConnectionIdManifestKeyCompoundUniqueInput = {
    connectionId: string
    manifestKey: string
  }

  export type IntegrationCheckCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    manifestKey?: SortOrder
    title?: SortOrder
    description?: SortOrder
    severity?: SortOrder
    schedule?: SortOrder
    isEnabled?: SortOrder
    runner?: SortOrder
    spec?: SortOrder
    aiPrompt?: SortOrder
    aiModel?: SortOrder
    lastStatus?: SortOrder
    lastRunAt?: SortOrder
    lastEvidenceId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntegrationCheckMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    manifestKey?: SortOrder
    title?: SortOrder
    description?: SortOrder
    severity?: SortOrder
    schedule?: SortOrder
    isEnabled?: SortOrder
    runner?: SortOrder
    aiPrompt?: SortOrder
    aiModel?: SortOrder
    lastStatus?: SortOrder
    lastRunAt?: SortOrder
    lastEvidenceId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntegrationCheckMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    manifestKey?: SortOrder
    title?: SortOrder
    description?: SortOrder
    severity?: SortOrder
    schedule?: SortOrder
    isEnabled?: SortOrder
    runner?: SortOrder
    aiPrompt?: SortOrder
    aiModel?: SortOrder
    lastStatus?: SortOrder
    lastRunAt?: SortOrder
    lastEvidenceId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumIntegrationCheckSeverityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCheckSeverity | EnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCheckSeverity[] | ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCheckSeverity[] | ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCheckSeverityWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationCheckSeverity
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntegrationCheckSeverityFilter<$PrismaModel>
    _max?: NestedEnumIntegrationCheckSeverityFilter<$PrismaModel>
  }

  export type EnumIntegrationCheckStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCheckStatus | EnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCheckStatus[] | ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCheckStatus[] | ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCheckStatusWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationCheckStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntegrationCheckStatusFilter<$PrismaModel>
    _max?: NestedEnumIntegrationCheckStatusFilter<$PrismaModel>
  }

  export type IntegrationCheckScalarRelationFilter = {
    is?: IntegrationCheckWhereInput
    isNot?: IntegrationCheckWhereInput
  }

  export type IntegrationCheckControlIntegrationCheckIdControlIdCompoundUniqueInput = {
    integrationCheckId: string
    controlId: string
  }

  export type IntegrationCheckControlCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    controlId?: SortOrder
    createdAt?: SortOrder
  }

  export type IntegrationCheckControlMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    controlId?: SortOrder
    createdAt?: SortOrder
  }

  export type IntegrationCheckControlMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    controlId?: SortOrder
    createdAt?: SortOrder
  }

  export type IntegrationCheckResultCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    status?: SortOrder
    payload?: SortOrder
    errorMessage?: SortOrder
    durationMs?: SortOrder
    evidenceId?: SortOrder
    createdAt?: SortOrder
  }

  export type IntegrationCheckResultAvgOrderByAggregateInput = {
    durationMs?: SortOrder
  }

  export type IntegrationCheckResultMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrder
    durationMs?: SortOrder
    evidenceId?: SortOrder
    createdAt?: SortOrder
  }

  export type IntegrationCheckResultMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    integrationCheckId?: SortOrder
    connectionId?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrder
    durationMs?: SortOrder
    evidenceId?: SortOrder
    createdAt?: SortOrder
  }

  export type IntegrationCheckResultSumOrderByAggregateInput = {
    durationMs?: SortOrder
  }

  export type EnumAuthTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthType | EnumAuthTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AuthType[] | ListEnumAuthTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuthType[] | ListEnumAuthTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAuthTypeFilter<$PrismaModel> | $Enums.AuthType
  }

  export type EnumIntegrationCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCategory | EnumIntegrationCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCategory[] | ListEnumIntegrationCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCategory[] | ListEnumIntegrationCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCategoryFilter<$PrismaModel> | $Enums.IntegrationCategory
  }

  export type IntegrationConnectionListRelationFilter = {
    every?: IntegrationConnectionWhereInput
    some?: IntegrationConnectionWhereInput
    none?: IntegrationConnectionWhereInput
  }

  export type IntegrationConnectionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IntegrationCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    authType?: SortOrder
    category?: SortOrder
    configSchema?: SortOrder
    capabilities?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntegrationMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    authType?: SortOrder
    category?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntegrationMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    authType?: SortOrder
    category?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumAuthTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthType | EnumAuthTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AuthType[] | ListEnumAuthTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuthType[] | ListEnumAuthTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAuthTypeWithAggregatesFilter<$PrismaModel> | $Enums.AuthType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAuthTypeFilter<$PrismaModel>
    _max?: NestedEnumAuthTypeFilter<$PrismaModel>
  }

  export type EnumIntegrationCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCategory | EnumIntegrationCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCategory[] | ListEnumIntegrationCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCategory[] | ListEnumIntegrationCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCategoryWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntegrationCategoryFilter<$PrismaModel>
    _max?: NestedEnumIntegrationCategoryFilter<$PrismaModel>
  }

  export type EnumJobTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.JobType | EnumJobTypeFieldRefInput<$PrismaModel>
    in?: $Enums.JobType[] | ListEnumJobTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobType[] | ListEnumJobTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumJobTypeFilter<$PrismaModel> | $Enums.JobType
  }

  export type EnumJobStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusFilter<$PrismaModel> | $Enums.JobStatus
  }

  export type CollectionJobRunListRelationFilter = {
    every?: CollectionJobRunWhereInput
    some?: CollectionJobRunWhereInput
    none?: CollectionJobRunWhereInput
  }

  export type CollectionJobRunOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CollectionJobCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    scheduledAt?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    nextRunAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CollectionJobAvgOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type CollectionJobMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    scheduledAt?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    nextRunAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CollectionJobMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    scheduledAt?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    nextRunAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CollectionJobSumOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type EnumJobTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobType | EnumJobTypeFieldRefInput<$PrismaModel>
    in?: $Enums.JobType[] | ListEnumJobTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobType[] | ListEnumJobTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumJobTypeWithAggregatesFilter<$PrismaModel> | $Enums.JobType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobTypeFilter<$PrismaModel>
    _max?: NestedEnumJobTypeFilter<$PrismaModel>
  }

  export type EnumJobStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusWithAggregatesFilter<$PrismaModel> | $Enums.JobStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobStatusFilter<$PrismaModel>
    _max?: NestedEnumJobStatusFilter<$PrismaModel>
  }

  export type EnumRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RunStatus | EnumRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRunStatusFilter<$PrismaModel> | $Enums.RunStatus
  }

  export type CollectionJobScalarRelationFilter = {
    is?: CollectionJobWhereInput
    isNot?: CollectionJobWhereInput
  }

  export type CollectionRetryListRelationFilter = {
    every?: CollectionRetryWhereInput
    some?: CollectionRetryWhereInput
    none?: CollectionRetryWhereInput
  }

  export type CollectionRetryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CollectionJobRunCountOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    tenantId?: SortOrder
    runNumber?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    resultSummary?: SortOrder
    errorDetails?: SortOrder
    createdAt?: SortOrder
  }

  export type CollectionJobRunAvgOrderByAggregateInput = {
    runNumber?: SortOrder
    durationMs?: SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
  }

  export type CollectionJobRunMaxOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    tenantId?: SortOrder
    runNumber?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    errorDetails?: SortOrder
    createdAt?: SortOrder
  }

  export type CollectionJobRunMinOrderByAggregateInput = {
    id?: SortOrder
    jobId?: SortOrder
    tenantId?: SortOrder
    runNumber?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    durationMs?: SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
    errorDetails?: SortOrder
    createdAt?: SortOrder
  }

  export type CollectionJobRunSumOrderByAggregateInput = {
    runNumber?: SortOrder
    durationMs?: SortOrder
    evidenceCount?: SortOrder
    errorCount?: SortOrder
  }

  export type EnumRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RunStatus | EnumRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.RunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRunStatusFilter<$PrismaModel>
    _max?: NestedEnumRunStatusFilter<$PrismaModel>
  }

  export type EnumRetryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RetryStatus | EnumRetryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RetryStatus[] | ListEnumRetryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RetryStatus[] | ListEnumRetryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRetryStatusFilter<$PrismaModel> | $Enums.RetryStatus
  }

  export type CollectionJobRunScalarRelationFilter = {
    is?: CollectionJobRunWhereInput
    isNot?: CollectionJobRunWhereInput
  }

  export type CollectionRetryCountOrderByAggregateInput = {
    id?: SortOrder
    jobRunId?: SortOrder
    tenantId?: SortOrder
    attemptNumber?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrder
    scheduledAt?: SortOrder
    attemptedAt?: SortOrder
    nextRetryAt?: SortOrder
    maxAttempts?: SortOrder
    backoffMs?: SortOrder
    createdAt?: SortOrder
  }

  export type CollectionRetryAvgOrderByAggregateInput = {
    attemptNumber?: SortOrder
    maxAttempts?: SortOrder
    backoffMs?: SortOrder
  }

  export type CollectionRetryMaxOrderByAggregateInput = {
    id?: SortOrder
    jobRunId?: SortOrder
    tenantId?: SortOrder
    attemptNumber?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrder
    scheduledAt?: SortOrder
    attemptedAt?: SortOrder
    nextRetryAt?: SortOrder
    maxAttempts?: SortOrder
    backoffMs?: SortOrder
    createdAt?: SortOrder
  }

  export type CollectionRetryMinOrderByAggregateInput = {
    id?: SortOrder
    jobRunId?: SortOrder
    tenantId?: SortOrder
    attemptNumber?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrder
    scheduledAt?: SortOrder
    attemptedAt?: SortOrder
    nextRetryAt?: SortOrder
    maxAttempts?: SortOrder
    backoffMs?: SortOrder
    createdAt?: SortOrder
  }

  export type CollectionRetrySumOrderByAggregateInput = {
    attemptNumber?: SortOrder
    maxAttempts?: SortOrder
    backoffMs?: SortOrder
  }

  export type EnumRetryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RetryStatus | EnumRetryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RetryStatus[] | ListEnumRetryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RetryStatus[] | ListEnumRetryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRetryStatusWithAggregatesFilter<$PrismaModel> | $Enums.RetryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRetryStatusFilter<$PrismaModel>
    _max?: NestedEnumRetryStatusFilter<$PrismaModel>
  }

  export type EnumSecretScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.SecretScope | EnumSecretScopeFieldRefInput<$PrismaModel>
    in?: $Enums.SecretScope[] | ListEnumSecretScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SecretScope[] | ListEnumSecretScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumSecretScopeFilter<$PrismaModel> | $Enums.SecretScope
  }

  export type SecretVaultCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    scope?: SortOrder
    ownerType?: SortOrder
    ownerId?: SortOrder
    encryptedPayload?: SortOrder
    kmsKeyId?: SortOrder
    rotatedAt?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SecretVaultMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    scope?: SortOrder
    ownerType?: SortOrder
    ownerId?: SortOrder
    encryptedPayload?: SortOrder
    kmsKeyId?: SortOrder
    rotatedAt?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SecretVaultMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    scope?: SortOrder
    ownerType?: SortOrder
    ownerId?: SortOrder
    encryptedPayload?: SortOrder
    kmsKeyId?: SortOrder
    rotatedAt?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumSecretScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SecretScope | EnumSecretScopeFieldRefInput<$PrismaModel>
    in?: $Enums.SecretScope[] | ListEnumSecretScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SecretScope[] | ListEnumSecretScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumSecretScopeWithAggregatesFilter<$PrismaModel> | $Enums.SecretScope
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSecretScopeFilter<$PrismaModel>
    _max?: NestedEnumSecretScopeFilter<$PrismaModel>
  }

  export type EnumSyncActionFilter<$PrismaModel = never> = {
    equals?: $Enums.SyncAction | EnumSyncActionFieldRefInput<$PrismaModel>
    in?: $Enums.SyncAction[] | ListEnumSyncActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.SyncAction[] | ListEnumSyncActionFieldRefInput<$PrismaModel>
    not?: NestedEnumSyncActionFilter<$PrismaModel> | $Enums.SyncAction
  }

  export type EnumSyncStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SyncStatus | EnumSyncStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SyncStatus[] | ListEnumSyncStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SyncStatus[] | ListEnumSyncStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSyncStatusFilter<$PrismaModel> | $Enums.SyncStatus
  }

  export type SyncLogCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    action?: SortOrder
    status?: SortOrder
    recordsProcessed?: SortOrder
    recordsFailed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    details?: SortOrder
    createdAt?: SortOrder
  }

  export type SyncLogAvgOrderByAggregateInput = {
    recordsProcessed?: SortOrder
    recordsFailed?: SortOrder
  }

  export type SyncLogMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    action?: SortOrder
    status?: SortOrder
    recordsProcessed?: SortOrder
    recordsFailed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SyncLogMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    connectionId?: SortOrder
    integrationId?: SortOrder
    action?: SortOrder
    status?: SortOrder
    recordsProcessed?: SortOrder
    recordsFailed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SyncLogSumOrderByAggregateInput = {
    recordsProcessed?: SortOrder
    recordsFailed?: SortOrder
  }

  export type EnumSyncActionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SyncAction | EnumSyncActionFieldRefInput<$PrismaModel>
    in?: $Enums.SyncAction[] | ListEnumSyncActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.SyncAction[] | ListEnumSyncActionFieldRefInput<$PrismaModel>
    not?: NestedEnumSyncActionWithAggregatesFilter<$PrismaModel> | $Enums.SyncAction
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSyncActionFilter<$PrismaModel>
    _max?: NestedEnumSyncActionFilter<$PrismaModel>
  }

  export type EnumSyncStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SyncStatus | EnumSyncStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SyncStatus[] | ListEnumSyncStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SyncStatus[] | ListEnumSyncStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSyncStatusWithAggregatesFilter<$PrismaModel> | $Enums.SyncStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSyncStatusFilter<$PrismaModel>
    _max?: NestedEnumSyncStatusFilter<$PrismaModel>
  }

  export type AgentRunCreatetoolConnectionIdsInput = {
    set: string[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumAgentRunTriggerFieldUpdateOperationsInput = {
    set?: $Enums.AgentRunTrigger
  }

  export type EnumAgentRunStatusFieldUpdateOperationsInput = {
    set?: $Enums.AgentRunStatus
  }

  export type AgentRunUpdatetoolConnectionIdsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntegrationCreateNestedOneWithoutConnectionsInput = {
    create?: XOR<IntegrationCreateWithoutConnectionsInput, IntegrationUncheckedCreateWithoutConnectionsInput>
    connectOrCreate?: IntegrationCreateOrConnectWithoutConnectionsInput
    connect?: IntegrationWhereUniqueInput
  }

  export type CollectionJobCreateNestedManyWithoutConnectionInput = {
    create?: XOR<CollectionJobCreateWithoutConnectionInput, CollectionJobUncheckedCreateWithoutConnectionInput> | CollectionJobCreateWithoutConnectionInput[] | CollectionJobUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: CollectionJobCreateOrConnectWithoutConnectionInput | CollectionJobCreateOrConnectWithoutConnectionInput[]
    createMany?: CollectionJobCreateManyConnectionInputEnvelope
    connect?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
  }

  export type SyncLogCreateNestedManyWithoutConnectionInput = {
    create?: XOR<SyncLogCreateWithoutConnectionInput, SyncLogUncheckedCreateWithoutConnectionInput> | SyncLogCreateWithoutConnectionInput[] | SyncLogUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: SyncLogCreateOrConnectWithoutConnectionInput | SyncLogCreateOrConnectWithoutConnectionInput[]
    createMany?: SyncLogCreateManyConnectionInputEnvelope
    connect?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
  }

  export type IntegrationCheckCreateNestedManyWithoutConnectionInput = {
    create?: XOR<IntegrationCheckCreateWithoutConnectionInput, IntegrationCheckUncheckedCreateWithoutConnectionInput> | IntegrationCheckCreateWithoutConnectionInput[] | IntegrationCheckUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutConnectionInput | IntegrationCheckCreateOrConnectWithoutConnectionInput[]
    createMany?: IntegrationCheckCreateManyConnectionInputEnvelope
    connect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
  }

  export type IntegrationCheckControlCreateNestedManyWithoutConnectionInput = {
    create?: XOR<IntegrationCheckControlCreateWithoutConnectionInput, IntegrationCheckControlUncheckedCreateWithoutConnectionInput> | IntegrationCheckControlCreateWithoutConnectionInput[] | IntegrationCheckControlUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckControlCreateOrConnectWithoutConnectionInput | IntegrationCheckControlCreateOrConnectWithoutConnectionInput[]
    createMany?: IntegrationCheckControlCreateManyConnectionInputEnvelope
    connect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
  }

  export type IntegrationCheckResultCreateNestedManyWithoutConnectionInput = {
    create?: XOR<IntegrationCheckResultCreateWithoutConnectionInput, IntegrationCheckResultUncheckedCreateWithoutConnectionInput> | IntegrationCheckResultCreateWithoutConnectionInput[] | IntegrationCheckResultUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckResultCreateOrConnectWithoutConnectionInput | IntegrationCheckResultCreateOrConnectWithoutConnectionInput[]
    createMany?: IntegrationCheckResultCreateManyConnectionInputEnvelope
    connect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
  }

  export type CollectionJobUncheckedCreateNestedManyWithoutConnectionInput = {
    create?: XOR<CollectionJobCreateWithoutConnectionInput, CollectionJobUncheckedCreateWithoutConnectionInput> | CollectionJobCreateWithoutConnectionInput[] | CollectionJobUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: CollectionJobCreateOrConnectWithoutConnectionInput | CollectionJobCreateOrConnectWithoutConnectionInput[]
    createMany?: CollectionJobCreateManyConnectionInputEnvelope
    connect?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
  }

  export type SyncLogUncheckedCreateNestedManyWithoutConnectionInput = {
    create?: XOR<SyncLogCreateWithoutConnectionInput, SyncLogUncheckedCreateWithoutConnectionInput> | SyncLogCreateWithoutConnectionInput[] | SyncLogUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: SyncLogCreateOrConnectWithoutConnectionInput | SyncLogCreateOrConnectWithoutConnectionInput[]
    createMany?: SyncLogCreateManyConnectionInputEnvelope
    connect?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
  }

  export type IntegrationCheckUncheckedCreateNestedManyWithoutConnectionInput = {
    create?: XOR<IntegrationCheckCreateWithoutConnectionInput, IntegrationCheckUncheckedCreateWithoutConnectionInput> | IntegrationCheckCreateWithoutConnectionInput[] | IntegrationCheckUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutConnectionInput | IntegrationCheckCreateOrConnectWithoutConnectionInput[]
    createMany?: IntegrationCheckCreateManyConnectionInputEnvelope
    connect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
  }

  export type IntegrationCheckControlUncheckedCreateNestedManyWithoutConnectionInput = {
    create?: XOR<IntegrationCheckControlCreateWithoutConnectionInput, IntegrationCheckControlUncheckedCreateWithoutConnectionInput> | IntegrationCheckControlCreateWithoutConnectionInput[] | IntegrationCheckControlUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckControlCreateOrConnectWithoutConnectionInput | IntegrationCheckControlCreateOrConnectWithoutConnectionInput[]
    createMany?: IntegrationCheckControlCreateManyConnectionInputEnvelope
    connect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
  }

  export type IntegrationCheckResultUncheckedCreateNestedManyWithoutConnectionInput = {
    create?: XOR<IntegrationCheckResultCreateWithoutConnectionInput, IntegrationCheckResultUncheckedCreateWithoutConnectionInput> | IntegrationCheckResultCreateWithoutConnectionInput[] | IntegrationCheckResultUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckResultCreateOrConnectWithoutConnectionInput | IntegrationCheckResultCreateOrConnectWithoutConnectionInput[]
    createMany?: IntegrationCheckResultCreateManyConnectionInputEnvelope
    connect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
  }

  export type EnumConnectionStatusFieldUpdateOperationsInput = {
    set?: $Enums.ConnectionStatus
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type IntegrationUpdateOneRequiredWithoutConnectionsNestedInput = {
    create?: XOR<IntegrationCreateWithoutConnectionsInput, IntegrationUncheckedCreateWithoutConnectionsInput>
    connectOrCreate?: IntegrationCreateOrConnectWithoutConnectionsInput
    upsert?: IntegrationUpsertWithoutConnectionsInput
    connect?: IntegrationWhereUniqueInput
    update?: XOR<XOR<IntegrationUpdateToOneWithWhereWithoutConnectionsInput, IntegrationUpdateWithoutConnectionsInput>, IntegrationUncheckedUpdateWithoutConnectionsInput>
  }

  export type CollectionJobUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<CollectionJobCreateWithoutConnectionInput, CollectionJobUncheckedCreateWithoutConnectionInput> | CollectionJobCreateWithoutConnectionInput[] | CollectionJobUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: CollectionJobCreateOrConnectWithoutConnectionInput | CollectionJobCreateOrConnectWithoutConnectionInput[]
    upsert?: CollectionJobUpsertWithWhereUniqueWithoutConnectionInput | CollectionJobUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: CollectionJobCreateManyConnectionInputEnvelope
    set?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
    disconnect?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
    delete?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
    connect?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
    update?: CollectionJobUpdateWithWhereUniqueWithoutConnectionInput | CollectionJobUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: CollectionJobUpdateManyWithWhereWithoutConnectionInput | CollectionJobUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: CollectionJobScalarWhereInput | CollectionJobScalarWhereInput[]
  }

  export type SyncLogUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<SyncLogCreateWithoutConnectionInput, SyncLogUncheckedCreateWithoutConnectionInput> | SyncLogCreateWithoutConnectionInput[] | SyncLogUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: SyncLogCreateOrConnectWithoutConnectionInput | SyncLogCreateOrConnectWithoutConnectionInput[]
    upsert?: SyncLogUpsertWithWhereUniqueWithoutConnectionInput | SyncLogUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: SyncLogCreateManyConnectionInputEnvelope
    set?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
    disconnect?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
    delete?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
    connect?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
    update?: SyncLogUpdateWithWhereUniqueWithoutConnectionInput | SyncLogUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: SyncLogUpdateManyWithWhereWithoutConnectionInput | SyncLogUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: SyncLogScalarWhereInput | SyncLogScalarWhereInput[]
  }

  export type IntegrationCheckUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<IntegrationCheckCreateWithoutConnectionInput, IntegrationCheckUncheckedCreateWithoutConnectionInput> | IntegrationCheckCreateWithoutConnectionInput[] | IntegrationCheckUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutConnectionInput | IntegrationCheckCreateOrConnectWithoutConnectionInput[]
    upsert?: IntegrationCheckUpsertWithWhereUniqueWithoutConnectionInput | IntegrationCheckUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: IntegrationCheckCreateManyConnectionInputEnvelope
    set?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    disconnect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    delete?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    connect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    update?: IntegrationCheckUpdateWithWhereUniqueWithoutConnectionInput | IntegrationCheckUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: IntegrationCheckUpdateManyWithWhereWithoutConnectionInput | IntegrationCheckUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: IntegrationCheckScalarWhereInput | IntegrationCheckScalarWhereInput[]
  }

  export type IntegrationCheckControlUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<IntegrationCheckControlCreateWithoutConnectionInput, IntegrationCheckControlUncheckedCreateWithoutConnectionInput> | IntegrationCheckControlCreateWithoutConnectionInput[] | IntegrationCheckControlUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckControlCreateOrConnectWithoutConnectionInput | IntegrationCheckControlCreateOrConnectWithoutConnectionInput[]
    upsert?: IntegrationCheckControlUpsertWithWhereUniqueWithoutConnectionInput | IntegrationCheckControlUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: IntegrationCheckControlCreateManyConnectionInputEnvelope
    set?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    disconnect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    delete?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    connect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    update?: IntegrationCheckControlUpdateWithWhereUniqueWithoutConnectionInput | IntegrationCheckControlUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: IntegrationCheckControlUpdateManyWithWhereWithoutConnectionInput | IntegrationCheckControlUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: IntegrationCheckControlScalarWhereInput | IntegrationCheckControlScalarWhereInput[]
  }

  export type IntegrationCheckResultUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<IntegrationCheckResultCreateWithoutConnectionInput, IntegrationCheckResultUncheckedCreateWithoutConnectionInput> | IntegrationCheckResultCreateWithoutConnectionInput[] | IntegrationCheckResultUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckResultCreateOrConnectWithoutConnectionInput | IntegrationCheckResultCreateOrConnectWithoutConnectionInput[]
    upsert?: IntegrationCheckResultUpsertWithWhereUniqueWithoutConnectionInput | IntegrationCheckResultUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: IntegrationCheckResultCreateManyConnectionInputEnvelope
    set?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    disconnect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    delete?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    connect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    update?: IntegrationCheckResultUpdateWithWhereUniqueWithoutConnectionInput | IntegrationCheckResultUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: IntegrationCheckResultUpdateManyWithWhereWithoutConnectionInput | IntegrationCheckResultUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: IntegrationCheckResultScalarWhereInput | IntegrationCheckResultScalarWhereInput[]
  }

  export type CollectionJobUncheckedUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<CollectionJobCreateWithoutConnectionInput, CollectionJobUncheckedCreateWithoutConnectionInput> | CollectionJobCreateWithoutConnectionInput[] | CollectionJobUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: CollectionJobCreateOrConnectWithoutConnectionInput | CollectionJobCreateOrConnectWithoutConnectionInput[]
    upsert?: CollectionJobUpsertWithWhereUniqueWithoutConnectionInput | CollectionJobUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: CollectionJobCreateManyConnectionInputEnvelope
    set?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
    disconnect?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
    delete?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
    connect?: CollectionJobWhereUniqueInput | CollectionJobWhereUniqueInput[]
    update?: CollectionJobUpdateWithWhereUniqueWithoutConnectionInput | CollectionJobUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: CollectionJobUpdateManyWithWhereWithoutConnectionInput | CollectionJobUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: CollectionJobScalarWhereInput | CollectionJobScalarWhereInput[]
  }

  export type SyncLogUncheckedUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<SyncLogCreateWithoutConnectionInput, SyncLogUncheckedCreateWithoutConnectionInput> | SyncLogCreateWithoutConnectionInput[] | SyncLogUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: SyncLogCreateOrConnectWithoutConnectionInput | SyncLogCreateOrConnectWithoutConnectionInput[]
    upsert?: SyncLogUpsertWithWhereUniqueWithoutConnectionInput | SyncLogUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: SyncLogCreateManyConnectionInputEnvelope
    set?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
    disconnect?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
    delete?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
    connect?: SyncLogWhereUniqueInput | SyncLogWhereUniqueInput[]
    update?: SyncLogUpdateWithWhereUniqueWithoutConnectionInput | SyncLogUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: SyncLogUpdateManyWithWhereWithoutConnectionInput | SyncLogUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: SyncLogScalarWhereInput | SyncLogScalarWhereInput[]
  }

  export type IntegrationCheckUncheckedUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<IntegrationCheckCreateWithoutConnectionInput, IntegrationCheckUncheckedCreateWithoutConnectionInput> | IntegrationCheckCreateWithoutConnectionInput[] | IntegrationCheckUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutConnectionInput | IntegrationCheckCreateOrConnectWithoutConnectionInput[]
    upsert?: IntegrationCheckUpsertWithWhereUniqueWithoutConnectionInput | IntegrationCheckUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: IntegrationCheckCreateManyConnectionInputEnvelope
    set?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    disconnect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    delete?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    connect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    update?: IntegrationCheckUpdateWithWhereUniqueWithoutConnectionInput | IntegrationCheckUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: IntegrationCheckUpdateManyWithWhereWithoutConnectionInput | IntegrationCheckUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: IntegrationCheckScalarWhereInput | IntegrationCheckScalarWhereInput[]
  }

  export type IntegrationCheckControlUncheckedUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<IntegrationCheckControlCreateWithoutConnectionInput, IntegrationCheckControlUncheckedCreateWithoutConnectionInput> | IntegrationCheckControlCreateWithoutConnectionInput[] | IntegrationCheckControlUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckControlCreateOrConnectWithoutConnectionInput | IntegrationCheckControlCreateOrConnectWithoutConnectionInput[]
    upsert?: IntegrationCheckControlUpsertWithWhereUniqueWithoutConnectionInput | IntegrationCheckControlUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: IntegrationCheckControlCreateManyConnectionInputEnvelope
    set?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    disconnect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    delete?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    connect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    update?: IntegrationCheckControlUpdateWithWhereUniqueWithoutConnectionInput | IntegrationCheckControlUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: IntegrationCheckControlUpdateManyWithWhereWithoutConnectionInput | IntegrationCheckControlUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: IntegrationCheckControlScalarWhereInput | IntegrationCheckControlScalarWhereInput[]
  }

  export type IntegrationCheckResultUncheckedUpdateManyWithoutConnectionNestedInput = {
    create?: XOR<IntegrationCheckResultCreateWithoutConnectionInput, IntegrationCheckResultUncheckedCreateWithoutConnectionInput> | IntegrationCheckResultCreateWithoutConnectionInput[] | IntegrationCheckResultUncheckedCreateWithoutConnectionInput[]
    connectOrCreate?: IntegrationCheckResultCreateOrConnectWithoutConnectionInput | IntegrationCheckResultCreateOrConnectWithoutConnectionInput[]
    upsert?: IntegrationCheckResultUpsertWithWhereUniqueWithoutConnectionInput | IntegrationCheckResultUpsertWithWhereUniqueWithoutConnectionInput[]
    createMany?: IntegrationCheckResultCreateManyConnectionInputEnvelope
    set?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    disconnect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    delete?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    connect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    update?: IntegrationCheckResultUpdateWithWhereUniqueWithoutConnectionInput | IntegrationCheckResultUpdateWithWhereUniqueWithoutConnectionInput[]
    updateMany?: IntegrationCheckResultUpdateManyWithWhereWithoutConnectionInput | IntegrationCheckResultUpdateManyWithWhereWithoutConnectionInput[]
    deleteMany?: IntegrationCheckResultScalarWhereInput | IntegrationCheckResultScalarWhereInput[]
  }

  export type IntegrationConnectionCreateNestedOneWithoutChecksInput = {
    create?: XOR<IntegrationConnectionCreateWithoutChecksInput, IntegrationConnectionUncheckedCreateWithoutChecksInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutChecksInput
    connect?: IntegrationConnectionWhereUniqueInput
  }

  export type IntegrationCreateNestedOneWithoutChecksInput = {
    create?: XOR<IntegrationCreateWithoutChecksInput, IntegrationUncheckedCreateWithoutChecksInput>
    connectOrCreate?: IntegrationCreateOrConnectWithoutChecksInput
    connect?: IntegrationWhereUniqueInput
  }

  export type IntegrationCheckControlCreateNestedManyWithoutIntegrationCheckInput = {
    create?: XOR<IntegrationCheckControlCreateWithoutIntegrationCheckInput, IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput> | IntegrationCheckControlCreateWithoutIntegrationCheckInput[] | IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput[]
    connectOrCreate?: IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput | IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput[]
    createMany?: IntegrationCheckControlCreateManyIntegrationCheckInputEnvelope
    connect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
  }

  export type IntegrationCheckResultCreateNestedManyWithoutIntegrationCheckInput = {
    create?: XOR<IntegrationCheckResultCreateWithoutIntegrationCheckInput, IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput> | IntegrationCheckResultCreateWithoutIntegrationCheckInput[] | IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput[]
    connectOrCreate?: IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput | IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput[]
    createMany?: IntegrationCheckResultCreateManyIntegrationCheckInputEnvelope
    connect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
  }

  export type IntegrationCheckControlUncheckedCreateNestedManyWithoutIntegrationCheckInput = {
    create?: XOR<IntegrationCheckControlCreateWithoutIntegrationCheckInput, IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput> | IntegrationCheckControlCreateWithoutIntegrationCheckInput[] | IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput[]
    connectOrCreate?: IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput | IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput[]
    createMany?: IntegrationCheckControlCreateManyIntegrationCheckInputEnvelope
    connect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
  }

  export type IntegrationCheckResultUncheckedCreateNestedManyWithoutIntegrationCheckInput = {
    create?: XOR<IntegrationCheckResultCreateWithoutIntegrationCheckInput, IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput> | IntegrationCheckResultCreateWithoutIntegrationCheckInput[] | IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput[]
    connectOrCreate?: IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput | IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput[]
    createMany?: IntegrationCheckResultCreateManyIntegrationCheckInputEnvelope
    connect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
  }

  export type EnumIntegrationCheckSeverityFieldUpdateOperationsInput = {
    set?: $Enums.IntegrationCheckSeverity
  }

  export type EnumIntegrationCheckStatusFieldUpdateOperationsInput = {
    set?: $Enums.IntegrationCheckStatus
  }

  export type IntegrationConnectionUpdateOneRequiredWithoutChecksNestedInput = {
    create?: XOR<IntegrationConnectionCreateWithoutChecksInput, IntegrationConnectionUncheckedCreateWithoutChecksInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutChecksInput
    upsert?: IntegrationConnectionUpsertWithoutChecksInput
    connect?: IntegrationConnectionWhereUniqueInput
    update?: XOR<XOR<IntegrationConnectionUpdateToOneWithWhereWithoutChecksInput, IntegrationConnectionUpdateWithoutChecksInput>, IntegrationConnectionUncheckedUpdateWithoutChecksInput>
  }

  export type IntegrationUpdateOneRequiredWithoutChecksNestedInput = {
    create?: XOR<IntegrationCreateWithoutChecksInput, IntegrationUncheckedCreateWithoutChecksInput>
    connectOrCreate?: IntegrationCreateOrConnectWithoutChecksInput
    upsert?: IntegrationUpsertWithoutChecksInput
    connect?: IntegrationWhereUniqueInput
    update?: XOR<XOR<IntegrationUpdateToOneWithWhereWithoutChecksInput, IntegrationUpdateWithoutChecksInput>, IntegrationUncheckedUpdateWithoutChecksInput>
  }

  export type IntegrationCheckControlUpdateManyWithoutIntegrationCheckNestedInput = {
    create?: XOR<IntegrationCheckControlCreateWithoutIntegrationCheckInput, IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput> | IntegrationCheckControlCreateWithoutIntegrationCheckInput[] | IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput[]
    connectOrCreate?: IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput | IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput[]
    upsert?: IntegrationCheckControlUpsertWithWhereUniqueWithoutIntegrationCheckInput | IntegrationCheckControlUpsertWithWhereUniqueWithoutIntegrationCheckInput[]
    createMany?: IntegrationCheckControlCreateManyIntegrationCheckInputEnvelope
    set?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    disconnect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    delete?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    connect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    update?: IntegrationCheckControlUpdateWithWhereUniqueWithoutIntegrationCheckInput | IntegrationCheckControlUpdateWithWhereUniqueWithoutIntegrationCheckInput[]
    updateMany?: IntegrationCheckControlUpdateManyWithWhereWithoutIntegrationCheckInput | IntegrationCheckControlUpdateManyWithWhereWithoutIntegrationCheckInput[]
    deleteMany?: IntegrationCheckControlScalarWhereInput | IntegrationCheckControlScalarWhereInput[]
  }

  export type IntegrationCheckResultUpdateManyWithoutIntegrationCheckNestedInput = {
    create?: XOR<IntegrationCheckResultCreateWithoutIntegrationCheckInput, IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput> | IntegrationCheckResultCreateWithoutIntegrationCheckInput[] | IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput[]
    connectOrCreate?: IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput | IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput[]
    upsert?: IntegrationCheckResultUpsertWithWhereUniqueWithoutIntegrationCheckInput | IntegrationCheckResultUpsertWithWhereUniqueWithoutIntegrationCheckInput[]
    createMany?: IntegrationCheckResultCreateManyIntegrationCheckInputEnvelope
    set?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    disconnect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    delete?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    connect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    update?: IntegrationCheckResultUpdateWithWhereUniqueWithoutIntegrationCheckInput | IntegrationCheckResultUpdateWithWhereUniqueWithoutIntegrationCheckInput[]
    updateMany?: IntegrationCheckResultUpdateManyWithWhereWithoutIntegrationCheckInput | IntegrationCheckResultUpdateManyWithWhereWithoutIntegrationCheckInput[]
    deleteMany?: IntegrationCheckResultScalarWhereInput | IntegrationCheckResultScalarWhereInput[]
  }

  export type IntegrationCheckControlUncheckedUpdateManyWithoutIntegrationCheckNestedInput = {
    create?: XOR<IntegrationCheckControlCreateWithoutIntegrationCheckInput, IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput> | IntegrationCheckControlCreateWithoutIntegrationCheckInput[] | IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput[]
    connectOrCreate?: IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput | IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput[]
    upsert?: IntegrationCheckControlUpsertWithWhereUniqueWithoutIntegrationCheckInput | IntegrationCheckControlUpsertWithWhereUniqueWithoutIntegrationCheckInput[]
    createMany?: IntegrationCheckControlCreateManyIntegrationCheckInputEnvelope
    set?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    disconnect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    delete?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    connect?: IntegrationCheckControlWhereUniqueInput | IntegrationCheckControlWhereUniqueInput[]
    update?: IntegrationCheckControlUpdateWithWhereUniqueWithoutIntegrationCheckInput | IntegrationCheckControlUpdateWithWhereUniqueWithoutIntegrationCheckInput[]
    updateMany?: IntegrationCheckControlUpdateManyWithWhereWithoutIntegrationCheckInput | IntegrationCheckControlUpdateManyWithWhereWithoutIntegrationCheckInput[]
    deleteMany?: IntegrationCheckControlScalarWhereInput | IntegrationCheckControlScalarWhereInput[]
  }

  export type IntegrationCheckResultUncheckedUpdateManyWithoutIntegrationCheckNestedInput = {
    create?: XOR<IntegrationCheckResultCreateWithoutIntegrationCheckInput, IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput> | IntegrationCheckResultCreateWithoutIntegrationCheckInput[] | IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput[]
    connectOrCreate?: IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput | IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput[]
    upsert?: IntegrationCheckResultUpsertWithWhereUniqueWithoutIntegrationCheckInput | IntegrationCheckResultUpsertWithWhereUniqueWithoutIntegrationCheckInput[]
    createMany?: IntegrationCheckResultCreateManyIntegrationCheckInputEnvelope
    set?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    disconnect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    delete?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    connect?: IntegrationCheckResultWhereUniqueInput | IntegrationCheckResultWhereUniqueInput[]
    update?: IntegrationCheckResultUpdateWithWhereUniqueWithoutIntegrationCheckInput | IntegrationCheckResultUpdateWithWhereUniqueWithoutIntegrationCheckInput[]
    updateMany?: IntegrationCheckResultUpdateManyWithWhereWithoutIntegrationCheckInput | IntegrationCheckResultUpdateManyWithWhereWithoutIntegrationCheckInput[]
    deleteMany?: IntegrationCheckResultScalarWhereInput | IntegrationCheckResultScalarWhereInput[]
  }

  export type IntegrationCheckCreateNestedOneWithoutControlsInput = {
    create?: XOR<IntegrationCheckCreateWithoutControlsInput, IntegrationCheckUncheckedCreateWithoutControlsInput>
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutControlsInput
    connect?: IntegrationCheckWhereUniqueInput
  }

  export type IntegrationConnectionCreateNestedOneWithoutCheckControlsInput = {
    create?: XOR<IntegrationConnectionCreateWithoutCheckControlsInput, IntegrationConnectionUncheckedCreateWithoutCheckControlsInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutCheckControlsInput
    connect?: IntegrationConnectionWhereUniqueInput
  }

  export type IntegrationCheckUpdateOneRequiredWithoutControlsNestedInput = {
    create?: XOR<IntegrationCheckCreateWithoutControlsInput, IntegrationCheckUncheckedCreateWithoutControlsInput>
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutControlsInput
    upsert?: IntegrationCheckUpsertWithoutControlsInput
    connect?: IntegrationCheckWhereUniqueInput
    update?: XOR<XOR<IntegrationCheckUpdateToOneWithWhereWithoutControlsInput, IntegrationCheckUpdateWithoutControlsInput>, IntegrationCheckUncheckedUpdateWithoutControlsInput>
  }

  export type IntegrationConnectionUpdateOneRequiredWithoutCheckControlsNestedInput = {
    create?: XOR<IntegrationConnectionCreateWithoutCheckControlsInput, IntegrationConnectionUncheckedCreateWithoutCheckControlsInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutCheckControlsInput
    upsert?: IntegrationConnectionUpsertWithoutCheckControlsInput
    connect?: IntegrationConnectionWhereUniqueInput
    update?: XOR<XOR<IntegrationConnectionUpdateToOneWithWhereWithoutCheckControlsInput, IntegrationConnectionUpdateWithoutCheckControlsInput>, IntegrationConnectionUncheckedUpdateWithoutCheckControlsInput>
  }

  export type IntegrationCheckCreateNestedOneWithoutResultsInput = {
    create?: XOR<IntegrationCheckCreateWithoutResultsInput, IntegrationCheckUncheckedCreateWithoutResultsInput>
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutResultsInput
    connect?: IntegrationCheckWhereUniqueInput
  }

  export type IntegrationConnectionCreateNestedOneWithoutCheckResultsInput = {
    create?: XOR<IntegrationConnectionCreateWithoutCheckResultsInput, IntegrationConnectionUncheckedCreateWithoutCheckResultsInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutCheckResultsInput
    connect?: IntegrationConnectionWhereUniqueInput
  }

  export type IntegrationCheckUpdateOneRequiredWithoutResultsNestedInput = {
    create?: XOR<IntegrationCheckCreateWithoutResultsInput, IntegrationCheckUncheckedCreateWithoutResultsInput>
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutResultsInput
    upsert?: IntegrationCheckUpsertWithoutResultsInput
    connect?: IntegrationCheckWhereUniqueInput
    update?: XOR<XOR<IntegrationCheckUpdateToOneWithWhereWithoutResultsInput, IntegrationCheckUpdateWithoutResultsInput>, IntegrationCheckUncheckedUpdateWithoutResultsInput>
  }

  export type IntegrationConnectionUpdateOneRequiredWithoutCheckResultsNestedInput = {
    create?: XOR<IntegrationConnectionCreateWithoutCheckResultsInput, IntegrationConnectionUncheckedCreateWithoutCheckResultsInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutCheckResultsInput
    upsert?: IntegrationConnectionUpsertWithoutCheckResultsInput
    connect?: IntegrationConnectionWhereUniqueInput
    update?: XOR<XOR<IntegrationConnectionUpdateToOneWithWhereWithoutCheckResultsInput, IntegrationConnectionUpdateWithoutCheckResultsInput>, IntegrationConnectionUncheckedUpdateWithoutCheckResultsInput>
  }

  export type IntegrationCreatecapabilitiesInput = {
    set: string[]
  }

  export type IntegrationConnectionCreateNestedManyWithoutIntegrationInput = {
    create?: XOR<IntegrationConnectionCreateWithoutIntegrationInput, IntegrationConnectionUncheckedCreateWithoutIntegrationInput> | IntegrationConnectionCreateWithoutIntegrationInput[] | IntegrationConnectionUncheckedCreateWithoutIntegrationInput[]
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutIntegrationInput | IntegrationConnectionCreateOrConnectWithoutIntegrationInput[]
    createMany?: IntegrationConnectionCreateManyIntegrationInputEnvelope
    connect?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
  }

  export type IntegrationCheckCreateNestedManyWithoutIntegrationInput = {
    create?: XOR<IntegrationCheckCreateWithoutIntegrationInput, IntegrationCheckUncheckedCreateWithoutIntegrationInput> | IntegrationCheckCreateWithoutIntegrationInput[] | IntegrationCheckUncheckedCreateWithoutIntegrationInput[]
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutIntegrationInput | IntegrationCheckCreateOrConnectWithoutIntegrationInput[]
    createMany?: IntegrationCheckCreateManyIntegrationInputEnvelope
    connect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
  }

  export type IntegrationConnectionUncheckedCreateNestedManyWithoutIntegrationInput = {
    create?: XOR<IntegrationConnectionCreateWithoutIntegrationInput, IntegrationConnectionUncheckedCreateWithoutIntegrationInput> | IntegrationConnectionCreateWithoutIntegrationInput[] | IntegrationConnectionUncheckedCreateWithoutIntegrationInput[]
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutIntegrationInput | IntegrationConnectionCreateOrConnectWithoutIntegrationInput[]
    createMany?: IntegrationConnectionCreateManyIntegrationInputEnvelope
    connect?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
  }

  export type IntegrationCheckUncheckedCreateNestedManyWithoutIntegrationInput = {
    create?: XOR<IntegrationCheckCreateWithoutIntegrationInput, IntegrationCheckUncheckedCreateWithoutIntegrationInput> | IntegrationCheckCreateWithoutIntegrationInput[] | IntegrationCheckUncheckedCreateWithoutIntegrationInput[]
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutIntegrationInput | IntegrationCheckCreateOrConnectWithoutIntegrationInput[]
    createMany?: IntegrationCheckCreateManyIntegrationInputEnvelope
    connect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
  }

  export type EnumAuthTypeFieldUpdateOperationsInput = {
    set?: $Enums.AuthType
  }

  export type EnumIntegrationCategoryFieldUpdateOperationsInput = {
    set?: $Enums.IntegrationCategory
  }

  export type IntegrationUpdatecapabilitiesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type IntegrationConnectionUpdateManyWithoutIntegrationNestedInput = {
    create?: XOR<IntegrationConnectionCreateWithoutIntegrationInput, IntegrationConnectionUncheckedCreateWithoutIntegrationInput> | IntegrationConnectionCreateWithoutIntegrationInput[] | IntegrationConnectionUncheckedCreateWithoutIntegrationInput[]
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutIntegrationInput | IntegrationConnectionCreateOrConnectWithoutIntegrationInput[]
    upsert?: IntegrationConnectionUpsertWithWhereUniqueWithoutIntegrationInput | IntegrationConnectionUpsertWithWhereUniqueWithoutIntegrationInput[]
    createMany?: IntegrationConnectionCreateManyIntegrationInputEnvelope
    set?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
    disconnect?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
    delete?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
    connect?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
    update?: IntegrationConnectionUpdateWithWhereUniqueWithoutIntegrationInput | IntegrationConnectionUpdateWithWhereUniqueWithoutIntegrationInput[]
    updateMany?: IntegrationConnectionUpdateManyWithWhereWithoutIntegrationInput | IntegrationConnectionUpdateManyWithWhereWithoutIntegrationInput[]
    deleteMany?: IntegrationConnectionScalarWhereInput | IntegrationConnectionScalarWhereInput[]
  }

  export type IntegrationCheckUpdateManyWithoutIntegrationNestedInput = {
    create?: XOR<IntegrationCheckCreateWithoutIntegrationInput, IntegrationCheckUncheckedCreateWithoutIntegrationInput> | IntegrationCheckCreateWithoutIntegrationInput[] | IntegrationCheckUncheckedCreateWithoutIntegrationInput[]
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutIntegrationInput | IntegrationCheckCreateOrConnectWithoutIntegrationInput[]
    upsert?: IntegrationCheckUpsertWithWhereUniqueWithoutIntegrationInput | IntegrationCheckUpsertWithWhereUniqueWithoutIntegrationInput[]
    createMany?: IntegrationCheckCreateManyIntegrationInputEnvelope
    set?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    disconnect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    delete?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    connect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    update?: IntegrationCheckUpdateWithWhereUniqueWithoutIntegrationInput | IntegrationCheckUpdateWithWhereUniqueWithoutIntegrationInput[]
    updateMany?: IntegrationCheckUpdateManyWithWhereWithoutIntegrationInput | IntegrationCheckUpdateManyWithWhereWithoutIntegrationInput[]
    deleteMany?: IntegrationCheckScalarWhereInput | IntegrationCheckScalarWhereInput[]
  }

  export type IntegrationConnectionUncheckedUpdateManyWithoutIntegrationNestedInput = {
    create?: XOR<IntegrationConnectionCreateWithoutIntegrationInput, IntegrationConnectionUncheckedCreateWithoutIntegrationInput> | IntegrationConnectionCreateWithoutIntegrationInput[] | IntegrationConnectionUncheckedCreateWithoutIntegrationInput[]
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutIntegrationInput | IntegrationConnectionCreateOrConnectWithoutIntegrationInput[]
    upsert?: IntegrationConnectionUpsertWithWhereUniqueWithoutIntegrationInput | IntegrationConnectionUpsertWithWhereUniqueWithoutIntegrationInput[]
    createMany?: IntegrationConnectionCreateManyIntegrationInputEnvelope
    set?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
    disconnect?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
    delete?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
    connect?: IntegrationConnectionWhereUniqueInput | IntegrationConnectionWhereUniqueInput[]
    update?: IntegrationConnectionUpdateWithWhereUniqueWithoutIntegrationInput | IntegrationConnectionUpdateWithWhereUniqueWithoutIntegrationInput[]
    updateMany?: IntegrationConnectionUpdateManyWithWhereWithoutIntegrationInput | IntegrationConnectionUpdateManyWithWhereWithoutIntegrationInput[]
    deleteMany?: IntegrationConnectionScalarWhereInput | IntegrationConnectionScalarWhereInput[]
  }

  export type IntegrationCheckUncheckedUpdateManyWithoutIntegrationNestedInput = {
    create?: XOR<IntegrationCheckCreateWithoutIntegrationInput, IntegrationCheckUncheckedCreateWithoutIntegrationInput> | IntegrationCheckCreateWithoutIntegrationInput[] | IntegrationCheckUncheckedCreateWithoutIntegrationInput[]
    connectOrCreate?: IntegrationCheckCreateOrConnectWithoutIntegrationInput | IntegrationCheckCreateOrConnectWithoutIntegrationInput[]
    upsert?: IntegrationCheckUpsertWithWhereUniqueWithoutIntegrationInput | IntegrationCheckUpsertWithWhereUniqueWithoutIntegrationInput[]
    createMany?: IntegrationCheckCreateManyIntegrationInputEnvelope
    set?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    disconnect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    delete?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    connect?: IntegrationCheckWhereUniqueInput | IntegrationCheckWhereUniqueInput[]
    update?: IntegrationCheckUpdateWithWhereUniqueWithoutIntegrationInput | IntegrationCheckUpdateWithWhereUniqueWithoutIntegrationInput[]
    updateMany?: IntegrationCheckUpdateManyWithWhereWithoutIntegrationInput | IntegrationCheckUpdateManyWithWhereWithoutIntegrationInput[]
    deleteMany?: IntegrationCheckScalarWhereInput | IntegrationCheckScalarWhereInput[]
  }

  export type IntegrationConnectionCreateNestedOneWithoutJobsInput = {
    create?: XOR<IntegrationConnectionCreateWithoutJobsInput, IntegrationConnectionUncheckedCreateWithoutJobsInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutJobsInput
    connect?: IntegrationConnectionWhereUniqueInput
  }

  export type CollectionJobRunCreateNestedManyWithoutJobInput = {
    create?: XOR<CollectionJobRunCreateWithoutJobInput, CollectionJobRunUncheckedCreateWithoutJobInput> | CollectionJobRunCreateWithoutJobInput[] | CollectionJobRunUncheckedCreateWithoutJobInput[]
    connectOrCreate?: CollectionJobRunCreateOrConnectWithoutJobInput | CollectionJobRunCreateOrConnectWithoutJobInput[]
    createMany?: CollectionJobRunCreateManyJobInputEnvelope
    connect?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
  }

  export type CollectionJobRunUncheckedCreateNestedManyWithoutJobInput = {
    create?: XOR<CollectionJobRunCreateWithoutJobInput, CollectionJobRunUncheckedCreateWithoutJobInput> | CollectionJobRunCreateWithoutJobInput[] | CollectionJobRunUncheckedCreateWithoutJobInput[]
    connectOrCreate?: CollectionJobRunCreateOrConnectWithoutJobInput | CollectionJobRunCreateOrConnectWithoutJobInput[]
    createMany?: CollectionJobRunCreateManyJobInputEnvelope
    connect?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
  }

  export type EnumJobTypeFieldUpdateOperationsInput = {
    set?: $Enums.JobType
  }

  export type EnumJobStatusFieldUpdateOperationsInput = {
    set?: $Enums.JobStatus
  }

  export type IntegrationConnectionUpdateOneRequiredWithoutJobsNestedInput = {
    create?: XOR<IntegrationConnectionCreateWithoutJobsInput, IntegrationConnectionUncheckedCreateWithoutJobsInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutJobsInput
    upsert?: IntegrationConnectionUpsertWithoutJobsInput
    connect?: IntegrationConnectionWhereUniqueInput
    update?: XOR<XOR<IntegrationConnectionUpdateToOneWithWhereWithoutJobsInput, IntegrationConnectionUpdateWithoutJobsInput>, IntegrationConnectionUncheckedUpdateWithoutJobsInput>
  }

  export type CollectionJobRunUpdateManyWithoutJobNestedInput = {
    create?: XOR<CollectionJobRunCreateWithoutJobInput, CollectionJobRunUncheckedCreateWithoutJobInput> | CollectionJobRunCreateWithoutJobInput[] | CollectionJobRunUncheckedCreateWithoutJobInput[]
    connectOrCreate?: CollectionJobRunCreateOrConnectWithoutJobInput | CollectionJobRunCreateOrConnectWithoutJobInput[]
    upsert?: CollectionJobRunUpsertWithWhereUniqueWithoutJobInput | CollectionJobRunUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: CollectionJobRunCreateManyJobInputEnvelope
    set?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
    disconnect?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
    delete?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
    connect?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
    update?: CollectionJobRunUpdateWithWhereUniqueWithoutJobInput | CollectionJobRunUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: CollectionJobRunUpdateManyWithWhereWithoutJobInput | CollectionJobRunUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: CollectionJobRunScalarWhereInput | CollectionJobRunScalarWhereInput[]
  }

  export type CollectionJobRunUncheckedUpdateManyWithoutJobNestedInput = {
    create?: XOR<CollectionJobRunCreateWithoutJobInput, CollectionJobRunUncheckedCreateWithoutJobInput> | CollectionJobRunCreateWithoutJobInput[] | CollectionJobRunUncheckedCreateWithoutJobInput[]
    connectOrCreate?: CollectionJobRunCreateOrConnectWithoutJobInput | CollectionJobRunCreateOrConnectWithoutJobInput[]
    upsert?: CollectionJobRunUpsertWithWhereUniqueWithoutJobInput | CollectionJobRunUpsertWithWhereUniqueWithoutJobInput[]
    createMany?: CollectionJobRunCreateManyJobInputEnvelope
    set?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
    disconnect?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
    delete?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
    connect?: CollectionJobRunWhereUniqueInput | CollectionJobRunWhereUniqueInput[]
    update?: CollectionJobRunUpdateWithWhereUniqueWithoutJobInput | CollectionJobRunUpdateWithWhereUniqueWithoutJobInput[]
    updateMany?: CollectionJobRunUpdateManyWithWhereWithoutJobInput | CollectionJobRunUpdateManyWithWhereWithoutJobInput[]
    deleteMany?: CollectionJobRunScalarWhereInput | CollectionJobRunScalarWhereInput[]
  }

  export type CollectionJobCreateNestedOneWithoutRunsInput = {
    create?: XOR<CollectionJobCreateWithoutRunsInput, CollectionJobUncheckedCreateWithoutRunsInput>
    connectOrCreate?: CollectionJobCreateOrConnectWithoutRunsInput
    connect?: CollectionJobWhereUniqueInput
  }

  export type CollectionRetryCreateNestedManyWithoutJobRunInput = {
    create?: XOR<CollectionRetryCreateWithoutJobRunInput, CollectionRetryUncheckedCreateWithoutJobRunInput> | CollectionRetryCreateWithoutJobRunInput[] | CollectionRetryUncheckedCreateWithoutJobRunInput[]
    connectOrCreate?: CollectionRetryCreateOrConnectWithoutJobRunInput | CollectionRetryCreateOrConnectWithoutJobRunInput[]
    createMany?: CollectionRetryCreateManyJobRunInputEnvelope
    connect?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
  }

  export type CollectionRetryUncheckedCreateNestedManyWithoutJobRunInput = {
    create?: XOR<CollectionRetryCreateWithoutJobRunInput, CollectionRetryUncheckedCreateWithoutJobRunInput> | CollectionRetryCreateWithoutJobRunInput[] | CollectionRetryUncheckedCreateWithoutJobRunInput[]
    connectOrCreate?: CollectionRetryCreateOrConnectWithoutJobRunInput | CollectionRetryCreateOrConnectWithoutJobRunInput[]
    createMany?: CollectionRetryCreateManyJobRunInputEnvelope
    connect?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
  }

  export type EnumRunStatusFieldUpdateOperationsInput = {
    set?: $Enums.RunStatus
  }

  export type CollectionJobUpdateOneRequiredWithoutRunsNestedInput = {
    create?: XOR<CollectionJobCreateWithoutRunsInput, CollectionJobUncheckedCreateWithoutRunsInput>
    connectOrCreate?: CollectionJobCreateOrConnectWithoutRunsInput
    upsert?: CollectionJobUpsertWithoutRunsInput
    connect?: CollectionJobWhereUniqueInput
    update?: XOR<XOR<CollectionJobUpdateToOneWithWhereWithoutRunsInput, CollectionJobUpdateWithoutRunsInput>, CollectionJobUncheckedUpdateWithoutRunsInput>
  }

  export type CollectionRetryUpdateManyWithoutJobRunNestedInput = {
    create?: XOR<CollectionRetryCreateWithoutJobRunInput, CollectionRetryUncheckedCreateWithoutJobRunInput> | CollectionRetryCreateWithoutJobRunInput[] | CollectionRetryUncheckedCreateWithoutJobRunInput[]
    connectOrCreate?: CollectionRetryCreateOrConnectWithoutJobRunInput | CollectionRetryCreateOrConnectWithoutJobRunInput[]
    upsert?: CollectionRetryUpsertWithWhereUniqueWithoutJobRunInput | CollectionRetryUpsertWithWhereUniqueWithoutJobRunInput[]
    createMany?: CollectionRetryCreateManyJobRunInputEnvelope
    set?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
    disconnect?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
    delete?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
    connect?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
    update?: CollectionRetryUpdateWithWhereUniqueWithoutJobRunInput | CollectionRetryUpdateWithWhereUniqueWithoutJobRunInput[]
    updateMany?: CollectionRetryUpdateManyWithWhereWithoutJobRunInput | CollectionRetryUpdateManyWithWhereWithoutJobRunInput[]
    deleteMany?: CollectionRetryScalarWhereInput | CollectionRetryScalarWhereInput[]
  }

  export type CollectionRetryUncheckedUpdateManyWithoutJobRunNestedInput = {
    create?: XOR<CollectionRetryCreateWithoutJobRunInput, CollectionRetryUncheckedCreateWithoutJobRunInput> | CollectionRetryCreateWithoutJobRunInput[] | CollectionRetryUncheckedCreateWithoutJobRunInput[]
    connectOrCreate?: CollectionRetryCreateOrConnectWithoutJobRunInput | CollectionRetryCreateOrConnectWithoutJobRunInput[]
    upsert?: CollectionRetryUpsertWithWhereUniqueWithoutJobRunInput | CollectionRetryUpsertWithWhereUniqueWithoutJobRunInput[]
    createMany?: CollectionRetryCreateManyJobRunInputEnvelope
    set?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
    disconnect?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
    delete?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
    connect?: CollectionRetryWhereUniqueInput | CollectionRetryWhereUniqueInput[]
    update?: CollectionRetryUpdateWithWhereUniqueWithoutJobRunInput | CollectionRetryUpdateWithWhereUniqueWithoutJobRunInput[]
    updateMany?: CollectionRetryUpdateManyWithWhereWithoutJobRunInput | CollectionRetryUpdateManyWithWhereWithoutJobRunInput[]
    deleteMany?: CollectionRetryScalarWhereInput | CollectionRetryScalarWhereInput[]
  }

  export type CollectionJobRunCreateNestedOneWithoutRetriesInput = {
    create?: XOR<CollectionJobRunCreateWithoutRetriesInput, CollectionJobRunUncheckedCreateWithoutRetriesInput>
    connectOrCreate?: CollectionJobRunCreateOrConnectWithoutRetriesInput
    connect?: CollectionJobRunWhereUniqueInput
  }

  export type EnumRetryStatusFieldUpdateOperationsInput = {
    set?: $Enums.RetryStatus
  }

  export type CollectionJobRunUpdateOneRequiredWithoutRetriesNestedInput = {
    create?: XOR<CollectionJobRunCreateWithoutRetriesInput, CollectionJobRunUncheckedCreateWithoutRetriesInput>
    connectOrCreate?: CollectionJobRunCreateOrConnectWithoutRetriesInput
    upsert?: CollectionJobRunUpsertWithoutRetriesInput
    connect?: CollectionJobRunWhereUniqueInput
    update?: XOR<XOR<CollectionJobRunUpdateToOneWithWhereWithoutRetriesInput, CollectionJobRunUpdateWithoutRetriesInput>, CollectionJobRunUncheckedUpdateWithoutRetriesInput>
  }

  export type EnumSecretScopeFieldUpdateOperationsInput = {
    set?: $Enums.SecretScope
  }

  export type IntegrationConnectionCreateNestedOneWithoutSyncLogsInput = {
    create?: XOR<IntegrationConnectionCreateWithoutSyncLogsInput, IntegrationConnectionUncheckedCreateWithoutSyncLogsInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutSyncLogsInput
    connect?: IntegrationConnectionWhereUniqueInput
  }

  export type EnumSyncActionFieldUpdateOperationsInput = {
    set?: $Enums.SyncAction
  }

  export type EnumSyncStatusFieldUpdateOperationsInput = {
    set?: $Enums.SyncStatus
  }

  export type IntegrationConnectionUpdateOneRequiredWithoutSyncLogsNestedInput = {
    create?: XOR<IntegrationConnectionCreateWithoutSyncLogsInput, IntegrationConnectionUncheckedCreateWithoutSyncLogsInput>
    connectOrCreate?: IntegrationConnectionCreateOrConnectWithoutSyncLogsInput
    upsert?: IntegrationConnectionUpsertWithoutSyncLogsInput
    connect?: IntegrationConnectionWhereUniqueInput
    update?: XOR<XOR<IntegrationConnectionUpdateToOneWithWhereWithoutSyncLogsInput, IntegrationConnectionUpdateWithoutSyncLogsInput>, IntegrationConnectionUncheckedUpdateWithoutSyncLogsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumAgentRunTriggerFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunTrigger | EnumAgentRunTriggerFieldRefInput<$PrismaModel>
    in?: $Enums.AgentRunTrigger[] | ListEnumAgentRunTriggerFieldRefInput<$PrismaModel>
    notIn?: $Enums.AgentRunTrigger[] | ListEnumAgentRunTriggerFieldRefInput<$PrismaModel>
    not?: NestedEnumAgentRunTriggerFilter<$PrismaModel> | $Enums.AgentRunTrigger
  }

  export type NestedEnumAgentRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunStatus | EnumAgentRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AgentRunStatus[] | ListEnumAgentRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AgentRunStatus[] | ListEnumAgentRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAgentRunStatusFilter<$PrismaModel> | $Enums.AgentRunStatus
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedEnumAgentRunTriggerWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunTrigger | EnumAgentRunTriggerFieldRefInput<$PrismaModel>
    in?: $Enums.AgentRunTrigger[] | ListEnumAgentRunTriggerFieldRefInput<$PrismaModel>
    notIn?: $Enums.AgentRunTrigger[] | ListEnumAgentRunTriggerFieldRefInput<$PrismaModel>
    not?: NestedEnumAgentRunTriggerWithAggregatesFilter<$PrismaModel> | $Enums.AgentRunTrigger
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAgentRunTriggerFilter<$PrismaModel>
    _max?: NestedEnumAgentRunTriggerFilter<$PrismaModel>
  }

  export type NestedEnumAgentRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunStatus | EnumAgentRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AgentRunStatus[] | ListEnumAgentRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AgentRunStatus[] | ListEnumAgentRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAgentRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.AgentRunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAgentRunStatusFilter<$PrismaModel>
    _max?: NestedEnumAgentRunStatusFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumConnectionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ConnectionStatus | EnumConnectionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ConnectionStatus[] | ListEnumConnectionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ConnectionStatus[] | ListEnumConnectionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumConnectionStatusFilter<$PrismaModel> | $Enums.ConnectionStatus
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumConnectionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ConnectionStatus | EnumConnectionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ConnectionStatus[] | ListEnumConnectionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ConnectionStatus[] | ListEnumConnectionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumConnectionStatusWithAggregatesFilter<$PrismaModel> | $Enums.ConnectionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumConnectionStatusFilter<$PrismaModel>
    _max?: NestedEnumConnectionStatusFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumIntegrationCheckSeverityFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCheckSeverity | EnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCheckSeverity[] | ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCheckSeverity[] | ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCheckSeverityFilter<$PrismaModel> | $Enums.IntegrationCheckSeverity
  }

  export type NestedEnumIntegrationCheckStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCheckStatus | EnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCheckStatus[] | ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCheckStatus[] | ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCheckStatusFilter<$PrismaModel> | $Enums.IntegrationCheckStatus
  }

  export type NestedEnumIntegrationCheckSeverityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCheckSeverity | EnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCheckSeverity[] | ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCheckSeverity[] | ListEnumIntegrationCheckSeverityFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCheckSeverityWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationCheckSeverity
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntegrationCheckSeverityFilter<$PrismaModel>
    _max?: NestedEnumIntegrationCheckSeverityFilter<$PrismaModel>
  }

  export type NestedEnumIntegrationCheckStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCheckStatus | EnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCheckStatus[] | ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCheckStatus[] | ListEnumIntegrationCheckStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCheckStatusWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationCheckStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntegrationCheckStatusFilter<$PrismaModel>
    _max?: NestedEnumIntegrationCheckStatusFilter<$PrismaModel>
  }

  export type NestedEnumAuthTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthType | EnumAuthTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AuthType[] | ListEnumAuthTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuthType[] | ListEnumAuthTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAuthTypeFilter<$PrismaModel> | $Enums.AuthType
  }

  export type NestedEnumIntegrationCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCategory | EnumIntegrationCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCategory[] | ListEnumIntegrationCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCategory[] | ListEnumIntegrationCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCategoryFilter<$PrismaModel> | $Enums.IntegrationCategory
  }

  export type NestedEnumAuthTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthType | EnumAuthTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AuthType[] | ListEnumAuthTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuthType[] | ListEnumAuthTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAuthTypeWithAggregatesFilter<$PrismaModel> | $Enums.AuthType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAuthTypeFilter<$PrismaModel>
    _max?: NestedEnumAuthTypeFilter<$PrismaModel>
  }

  export type NestedEnumIntegrationCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationCategory | EnumIntegrationCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationCategory[] | ListEnumIntegrationCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationCategory[] | ListEnumIntegrationCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationCategoryWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntegrationCategoryFilter<$PrismaModel>
    _max?: NestedEnumIntegrationCategoryFilter<$PrismaModel>
  }

  export type NestedEnumJobTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.JobType | EnumJobTypeFieldRefInput<$PrismaModel>
    in?: $Enums.JobType[] | ListEnumJobTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobType[] | ListEnumJobTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumJobTypeFilter<$PrismaModel> | $Enums.JobType
  }

  export type NestedEnumJobStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusFilter<$PrismaModel> | $Enums.JobStatus
  }

  export type NestedEnumJobTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobType | EnumJobTypeFieldRefInput<$PrismaModel>
    in?: $Enums.JobType[] | ListEnumJobTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobType[] | ListEnumJobTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumJobTypeWithAggregatesFilter<$PrismaModel> | $Enums.JobType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobTypeFilter<$PrismaModel>
    _max?: NestedEnumJobTypeFilter<$PrismaModel>
  }

  export type NestedEnumJobStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusWithAggregatesFilter<$PrismaModel> | $Enums.JobStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobStatusFilter<$PrismaModel>
    _max?: NestedEnumJobStatusFilter<$PrismaModel>
  }

  export type NestedEnumRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RunStatus | EnumRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRunStatusFilter<$PrismaModel> | $Enums.RunStatus
  }

  export type NestedEnumRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RunStatus | EnumRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.RunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRunStatusFilter<$PrismaModel>
    _max?: NestedEnumRunStatusFilter<$PrismaModel>
  }

  export type NestedEnumRetryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RetryStatus | EnumRetryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RetryStatus[] | ListEnumRetryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RetryStatus[] | ListEnumRetryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRetryStatusFilter<$PrismaModel> | $Enums.RetryStatus
  }

  export type NestedEnumRetryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RetryStatus | EnumRetryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RetryStatus[] | ListEnumRetryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RetryStatus[] | ListEnumRetryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRetryStatusWithAggregatesFilter<$PrismaModel> | $Enums.RetryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRetryStatusFilter<$PrismaModel>
    _max?: NestedEnumRetryStatusFilter<$PrismaModel>
  }

  export type NestedEnumSecretScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.SecretScope | EnumSecretScopeFieldRefInput<$PrismaModel>
    in?: $Enums.SecretScope[] | ListEnumSecretScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SecretScope[] | ListEnumSecretScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumSecretScopeFilter<$PrismaModel> | $Enums.SecretScope
  }

  export type NestedEnumSecretScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SecretScope | EnumSecretScopeFieldRefInput<$PrismaModel>
    in?: $Enums.SecretScope[] | ListEnumSecretScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SecretScope[] | ListEnumSecretScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumSecretScopeWithAggregatesFilter<$PrismaModel> | $Enums.SecretScope
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSecretScopeFilter<$PrismaModel>
    _max?: NestedEnumSecretScopeFilter<$PrismaModel>
  }

  export type NestedEnumSyncActionFilter<$PrismaModel = never> = {
    equals?: $Enums.SyncAction | EnumSyncActionFieldRefInput<$PrismaModel>
    in?: $Enums.SyncAction[] | ListEnumSyncActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.SyncAction[] | ListEnumSyncActionFieldRefInput<$PrismaModel>
    not?: NestedEnumSyncActionFilter<$PrismaModel> | $Enums.SyncAction
  }

  export type NestedEnumSyncStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SyncStatus | EnumSyncStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SyncStatus[] | ListEnumSyncStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SyncStatus[] | ListEnumSyncStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSyncStatusFilter<$PrismaModel> | $Enums.SyncStatus
  }

  export type NestedEnumSyncActionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SyncAction | EnumSyncActionFieldRefInput<$PrismaModel>
    in?: $Enums.SyncAction[] | ListEnumSyncActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.SyncAction[] | ListEnumSyncActionFieldRefInput<$PrismaModel>
    not?: NestedEnumSyncActionWithAggregatesFilter<$PrismaModel> | $Enums.SyncAction
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSyncActionFilter<$PrismaModel>
    _max?: NestedEnumSyncActionFilter<$PrismaModel>
  }

  export type NestedEnumSyncStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SyncStatus | EnumSyncStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SyncStatus[] | ListEnumSyncStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SyncStatus[] | ListEnumSyncStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSyncStatusWithAggregatesFilter<$PrismaModel> | $Enums.SyncStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSyncStatusFilter<$PrismaModel>
    _max?: NestedEnumSyncStatusFilter<$PrismaModel>
  }

  export type IntegrationCreateWithoutConnectionsInput = {
    id: string
    name: string
    description?: string | null
    authType: $Enums.AuthType
    category: $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationCreatecapabilitiesInput | string[]
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    checks?: IntegrationCheckCreateNestedManyWithoutIntegrationInput
  }

  export type IntegrationUncheckedCreateWithoutConnectionsInput = {
    id: string
    name: string
    description?: string | null
    authType: $Enums.AuthType
    category: $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationCreatecapabilitiesInput | string[]
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    checks?: IntegrationCheckUncheckedCreateNestedManyWithoutIntegrationInput
  }

  export type IntegrationCreateOrConnectWithoutConnectionsInput = {
    where: IntegrationWhereUniqueInput
    create: XOR<IntegrationCreateWithoutConnectionsInput, IntegrationUncheckedCreateWithoutConnectionsInput>
  }

  export type CollectionJobCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    type: $Enums.JobType
    status?: $Enums.JobStatus
    priority?: number
    scheduledAt?: Date | string
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    nextRunAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    runs?: CollectionJobRunCreateNestedManyWithoutJobInput
  }

  export type CollectionJobUncheckedCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    type: $Enums.JobType
    status?: $Enums.JobStatus
    priority?: number
    scheduledAt?: Date | string
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    nextRunAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    runs?: CollectionJobRunUncheckedCreateNestedManyWithoutJobInput
  }

  export type CollectionJobCreateOrConnectWithoutConnectionInput = {
    where: CollectionJobWhereUniqueInput
    create: XOR<CollectionJobCreateWithoutConnectionInput, CollectionJobUncheckedCreateWithoutConnectionInput>
  }

  export type CollectionJobCreateManyConnectionInputEnvelope = {
    data: CollectionJobCreateManyConnectionInput | CollectionJobCreateManyConnectionInput[]
    skipDuplicates?: boolean
  }

  export type SyncLogCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    integrationId: string
    action: $Enums.SyncAction
    status?: $Enums.SyncStatus
    recordsProcessed?: number
    recordsFailed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SyncLogUncheckedCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    integrationId: string
    action: $Enums.SyncAction
    status?: $Enums.SyncStatus
    recordsProcessed?: number
    recordsFailed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SyncLogCreateOrConnectWithoutConnectionInput = {
    where: SyncLogWhereUniqueInput
    create: XOR<SyncLogCreateWithoutConnectionInput, SyncLogUncheckedCreateWithoutConnectionInput>
  }

  export type SyncLogCreateManyConnectionInputEnvelope = {
    data: SyncLogCreateManyConnectionInput | SyncLogCreateManyConnectionInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationCheckCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    integration: IntegrationCreateNestedOneWithoutChecksInput
    controls?: IntegrationCheckControlCreateNestedManyWithoutIntegrationCheckInput
    results?: IntegrationCheckResultCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckUncheckedCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    integrationId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    controls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutIntegrationCheckInput
    results?: IntegrationCheckResultUncheckedCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckCreateOrConnectWithoutConnectionInput = {
    where: IntegrationCheckWhereUniqueInput
    create: XOR<IntegrationCheckCreateWithoutConnectionInput, IntegrationCheckUncheckedCreateWithoutConnectionInput>
  }

  export type IntegrationCheckCreateManyConnectionInputEnvelope = {
    data: IntegrationCheckCreateManyConnectionInput | IntegrationCheckCreateManyConnectionInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationCheckControlCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    controlId: string
    createdAt?: Date | string
    integrationCheck: IntegrationCheckCreateNestedOneWithoutControlsInput
  }

  export type IntegrationCheckControlUncheckedCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    integrationCheckId: string
    controlId: string
    createdAt?: Date | string
  }

  export type IntegrationCheckControlCreateOrConnectWithoutConnectionInput = {
    where: IntegrationCheckControlWhereUniqueInput
    create: XOR<IntegrationCheckControlCreateWithoutConnectionInput, IntegrationCheckControlUncheckedCreateWithoutConnectionInput>
  }

  export type IntegrationCheckControlCreateManyConnectionInputEnvelope = {
    data: IntegrationCheckControlCreateManyConnectionInput | IntegrationCheckControlCreateManyConnectionInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationCheckResultCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
    integrationCheck: IntegrationCheckCreateNestedOneWithoutResultsInput
  }

  export type IntegrationCheckResultUncheckedCreateWithoutConnectionInput = {
    id?: string
    tenantId: string
    integrationCheckId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
  }

  export type IntegrationCheckResultCreateOrConnectWithoutConnectionInput = {
    where: IntegrationCheckResultWhereUniqueInput
    create: XOR<IntegrationCheckResultCreateWithoutConnectionInput, IntegrationCheckResultUncheckedCreateWithoutConnectionInput>
  }

  export type IntegrationCheckResultCreateManyConnectionInputEnvelope = {
    data: IntegrationCheckResultCreateManyConnectionInput | IntegrationCheckResultCreateManyConnectionInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationUpsertWithoutConnectionsInput = {
    update: XOR<IntegrationUpdateWithoutConnectionsInput, IntegrationUncheckedUpdateWithoutConnectionsInput>
    create: XOR<IntegrationCreateWithoutConnectionsInput, IntegrationUncheckedCreateWithoutConnectionsInput>
    where?: IntegrationWhereInput
  }

  export type IntegrationUpdateToOneWithWhereWithoutConnectionsInput = {
    where?: IntegrationWhereInput
    data: XOR<IntegrationUpdateWithoutConnectionsInput, IntegrationUncheckedUpdateWithoutConnectionsInput>
  }

  export type IntegrationUpdateWithoutConnectionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    authType?: EnumAuthTypeFieldUpdateOperationsInput | $Enums.AuthType
    category?: EnumIntegrationCategoryFieldUpdateOperationsInput | $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationUpdatecapabilitiesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checks?: IntegrationCheckUpdateManyWithoutIntegrationNestedInput
  }

  export type IntegrationUncheckedUpdateWithoutConnectionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    authType?: EnumAuthTypeFieldUpdateOperationsInput | $Enums.AuthType
    category?: EnumIntegrationCategoryFieldUpdateOperationsInput | $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationUpdatecapabilitiesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checks?: IntegrationCheckUncheckedUpdateManyWithoutIntegrationNestedInput
  }

  export type CollectionJobUpsertWithWhereUniqueWithoutConnectionInput = {
    where: CollectionJobWhereUniqueInput
    update: XOR<CollectionJobUpdateWithoutConnectionInput, CollectionJobUncheckedUpdateWithoutConnectionInput>
    create: XOR<CollectionJobCreateWithoutConnectionInput, CollectionJobUncheckedCreateWithoutConnectionInput>
  }

  export type CollectionJobUpdateWithWhereUniqueWithoutConnectionInput = {
    where: CollectionJobWhereUniqueInput
    data: XOR<CollectionJobUpdateWithoutConnectionInput, CollectionJobUncheckedUpdateWithoutConnectionInput>
  }

  export type CollectionJobUpdateManyWithWhereWithoutConnectionInput = {
    where: CollectionJobScalarWhereInput
    data: XOR<CollectionJobUpdateManyMutationInput, CollectionJobUncheckedUpdateManyWithoutConnectionInput>
  }

  export type CollectionJobScalarWhereInput = {
    AND?: CollectionJobScalarWhereInput | CollectionJobScalarWhereInput[]
    OR?: CollectionJobScalarWhereInput[]
    NOT?: CollectionJobScalarWhereInput | CollectionJobScalarWhereInput[]
    id?: StringFilter<"CollectionJob"> | string
    tenantId?: StringFilter<"CollectionJob"> | string
    connectionId?: StringFilter<"CollectionJob"> | string
    type?: EnumJobTypeFilter<"CollectionJob"> | $Enums.JobType
    status?: EnumJobStatusFilter<"CollectionJob"> | $Enums.JobStatus
    priority?: IntFilter<"CollectionJob"> | number
    scheduledAt?: DateTimeFilter<"CollectionJob"> | Date | string
    startedAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    nextRunAt?: DateTimeNullableFilter<"CollectionJob"> | Date | string | null
    createdAt?: DateTimeFilter<"CollectionJob"> | Date | string
    updatedAt?: DateTimeFilter<"CollectionJob"> | Date | string
  }

  export type SyncLogUpsertWithWhereUniqueWithoutConnectionInput = {
    where: SyncLogWhereUniqueInput
    update: XOR<SyncLogUpdateWithoutConnectionInput, SyncLogUncheckedUpdateWithoutConnectionInput>
    create: XOR<SyncLogCreateWithoutConnectionInput, SyncLogUncheckedCreateWithoutConnectionInput>
  }

  export type SyncLogUpdateWithWhereUniqueWithoutConnectionInput = {
    where: SyncLogWhereUniqueInput
    data: XOR<SyncLogUpdateWithoutConnectionInput, SyncLogUncheckedUpdateWithoutConnectionInput>
  }

  export type SyncLogUpdateManyWithWhereWithoutConnectionInput = {
    where: SyncLogScalarWhereInput
    data: XOR<SyncLogUpdateManyMutationInput, SyncLogUncheckedUpdateManyWithoutConnectionInput>
  }

  export type SyncLogScalarWhereInput = {
    AND?: SyncLogScalarWhereInput | SyncLogScalarWhereInput[]
    OR?: SyncLogScalarWhereInput[]
    NOT?: SyncLogScalarWhereInput | SyncLogScalarWhereInput[]
    id?: StringFilter<"SyncLog"> | string
    tenantId?: StringFilter<"SyncLog"> | string
    connectionId?: StringFilter<"SyncLog"> | string
    integrationId?: StringFilter<"SyncLog"> | string
    action?: EnumSyncActionFilter<"SyncLog"> | $Enums.SyncAction
    status?: EnumSyncStatusFilter<"SyncLog"> | $Enums.SyncStatus
    recordsProcessed?: IntFilter<"SyncLog"> | number
    recordsFailed?: IntFilter<"SyncLog"> | number
    startedAt?: DateTimeFilter<"SyncLog"> | Date | string
    completedAt?: DateTimeNullableFilter<"SyncLog"> | Date | string | null
    details?: JsonNullableFilter<"SyncLog">
    createdAt?: DateTimeFilter<"SyncLog"> | Date | string
  }

  export type IntegrationCheckUpsertWithWhereUniqueWithoutConnectionInput = {
    where: IntegrationCheckWhereUniqueInput
    update: XOR<IntegrationCheckUpdateWithoutConnectionInput, IntegrationCheckUncheckedUpdateWithoutConnectionInput>
    create: XOR<IntegrationCheckCreateWithoutConnectionInput, IntegrationCheckUncheckedCreateWithoutConnectionInput>
  }

  export type IntegrationCheckUpdateWithWhereUniqueWithoutConnectionInput = {
    where: IntegrationCheckWhereUniqueInput
    data: XOR<IntegrationCheckUpdateWithoutConnectionInput, IntegrationCheckUncheckedUpdateWithoutConnectionInput>
  }

  export type IntegrationCheckUpdateManyWithWhereWithoutConnectionInput = {
    where: IntegrationCheckScalarWhereInput
    data: XOR<IntegrationCheckUpdateManyMutationInput, IntegrationCheckUncheckedUpdateManyWithoutConnectionInput>
  }

  export type IntegrationCheckScalarWhereInput = {
    AND?: IntegrationCheckScalarWhereInput | IntegrationCheckScalarWhereInput[]
    OR?: IntegrationCheckScalarWhereInput[]
    NOT?: IntegrationCheckScalarWhereInput | IntegrationCheckScalarWhereInput[]
    id?: StringFilter<"IntegrationCheck"> | string
    tenantId?: StringFilter<"IntegrationCheck"> | string
    connectionId?: StringFilter<"IntegrationCheck"> | string
    integrationId?: StringFilter<"IntegrationCheck"> | string
    manifestKey?: StringFilter<"IntegrationCheck"> | string
    title?: StringFilter<"IntegrationCheck"> | string
    description?: StringNullableFilter<"IntegrationCheck"> | string | null
    severity?: EnumIntegrationCheckSeverityFilter<"IntegrationCheck"> | $Enums.IntegrationCheckSeverity
    schedule?: StringFilter<"IntegrationCheck"> | string
    isEnabled?: BoolFilter<"IntegrationCheck"> | boolean
    runner?: StringFilter<"IntegrationCheck"> | string
    spec?: JsonNullableFilter<"IntegrationCheck">
    aiPrompt?: StringNullableFilter<"IntegrationCheck"> | string | null
    aiModel?: StringNullableFilter<"IntegrationCheck"> | string | null
    lastStatus?: EnumIntegrationCheckStatusFilter<"IntegrationCheck"> | $Enums.IntegrationCheckStatus
    lastRunAt?: DateTimeNullableFilter<"IntegrationCheck"> | Date | string | null
    lastEvidenceId?: StringNullableFilter<"IntegrationCheck"> | string | null
    createdAt?: DateTimeFilter<"IntegrationCheck"> | Date | string
    updatedAt?: DateTimeFilter<"IntegrationCheck"> | Date | string
  }

  export type IntegrationCheckControlUpsertWithWhereUniqueWithoutConnectionInput = {
    where: IntegrationCheckControlWhereUniqueInput
    update: XOR<IntegrationCheckControlUpdateWithoutConnectionInput, IntegrationCheckControlUncheckedUpdateWithoutConnectionInput>
    create: XOR<IntegrationCheckControlCreateWithoutConnectionInput, IntegrationCheckControlUncheckedCreateWithoutConnectionInput>
  }

  export type IntegrationCheckControlUpdateWithWhereUniqueWithoutConnectionInput = {
    where: IntegrationCheckControlWhereUniqueInput
    data: XOR<IntegrationCheckControlUpdateWithoutConnectionInput, IntegrationCheckControlUncheckedUpdateWithoutConnectionInput>
  }

  export type IntegrationCheckControlUpdateManyWithWhereWithoutConnectionInput = {
    where: IntegrationCheckControlScalarWhereInput
    data: XOR<IntegrationCheckControlUpdateManyMutationInput, IntegrationCheckControlUncheckedUpdateManyWithoutConnectionInput>
  }

  export type IntegrationCheckControlScalarWhereInput = {
    AND?: IntegrationCheckControlScalarWhereInput | IntegrationCheckControlScalarWhereInput[]
    OR?: IntegrationCheckControlScalarWhereInput[]
    NOT?: IntegrationCheckControlScalarWhereInput | IntegrationCheckControlScalarWhereInput[]
    id?: StringFilter<"IntegrationCheckControl"> | string
    tenantId?: StringFilter<"IntegrationCheckControl"> | string
    integrationCheckId?: StringFilter<"IntegrationCheckControl"> | string
    connectionId?: StringFilter<"IntegrationCheckControl"> | string
    controlId?: StringFilter<"IntegrationCheckControl"> | string
    createdAt?: DateTimeFilter<"IntegrationCheckControl"> | Date | string
  }

  export type IntegrationCheckResultUpsertWithWhereUniqueWithoutConnectionInput = {
    where: IntegrationCheckResultWhereUniqueInput
    update: XOR<IntegrationCheckResultUpdateWithoutConnectionInput, IntegrationCheckResultUncheckedUpdateWithoutConnectionInput>
    create: XOR<IntegrationCheckResultCreateWithoutConnectionInput, IntegrationCheckResultUncheckedCreateWithoutConnectionInput>
  }

  export type IntegrationCheckResultUpdateWithWhereUniqueWithoutConnectionInput = {
    where: IntegrationCheckResultWhereUniqueInput
    data: XOR<IntegrationCheckResultUpdateWithoutConnectionInput, IntegrationCheckResultUncheckedUpdateWithoutConnectionInput>
  }

  export type IntegrationCheckResultUpdateManyWithWhereWithoutConnectionInput = {
    where: IntegrationCheckResultScalarWhereInput
    data: XOR<IntegrationCheckResultUpdateManyMutationInput, IntegrationCheckResultUncheckedUpdateManyWithoutConnectionInput>
  }

  export type IntegrationCheckResultScalarWhereInput = {
    AND?: IntegrationCheckResultScalarWhereInput | IntegrationCheckResultScalarWhereInput[]
    OR?: IntegrationCheckResultScalarWhereInput[]
    NOT?: IntegrationCheckResultScalarWhereInput | IntegrationCheckResultScalarWhereInput[]
    id?: StringFilter<"IntegrationCheckResult"> | string
    tenantId?: StringFilter<"IntegrationCheckResult"> | string
    integrationCheckId?: StringFilter<"IntegrationCheckResult"> | string
    connectionId?: StringFilter<"IntegrationCheckResult"> | string
    status?: EnumIntegrationCheckStatusFilter<"IntegrationCheckResult"> | $Enums.IntegrationCheckStatus
    payload?: JsonNullableFilter<"IntegrationCheckResult">
    errorMessage?: StringNullableFilter<"IntegrationCheckResult"> | string | null
    durationMs?: IntNullableFilter<"IntegrationCheckResult"> | number | null
    evidenceId?: StringNullableFilter<"IntegrationCheckResult"> | string | null
    createdAt?: DateTimeFilter<"IntegrationCheckResult"> | Date | string
  }

  export type IntegrationConnectionCreateWithoutChecksInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    integration: IntegrationCreateNestedOneWithoutConnectionsInput
    jobs?: CollectionJobCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionUncheckedCreateWithoutChecksInput = {
    id?: string
    tenantId: string
    integrationId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    jobs?: CollectionJobUncheckedCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogUncheckedCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultUncheckedCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionCreateOrConnectWithoutChecksInput = {
    where: IntegrationConnectionWhereUniqueInput
    create: XOR<IntegrationConnectionCreateWithoutChecksInput, IntegrationConnectionUncheckedCreateWithoutChecksInput>
  }

  export type IntegrationCreateWithoutChecksInput = {
    id: string
    name: string
    description?: string | null
    authType: $Enums.AuthType
    category: $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationCreatecapabilitiesInput | string[]
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    connections?: IntegrationConnectionCreateNestedManyWithoutIntegrationInput
  }

  export type IntegrationUncheckedCreateWithoutChecksInput = {
    id: string
    name: string
    description?: string | null
    authType: $Enums.AuthType
    category: $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationCreatecapabilitiesInput | string[]
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    connections?: IntegrationConnectionUncheckedCreateNestedManyWithoutIntegrationInput
  }

  export type IntegrationCreateOrConnectWithoutChecksInput = {
    where: IntegrationWhereUniqueInput
    create: XOR<IntegrationCreateWithoutChecksInput, IntegrationUncheckedCreateWithoutChecksInput>
  }

  export type IntegrationCheckControlCreateWithoutIntegrationCheckInput = {
    id?: string
    tenantId: string
    controlId: string
    createdAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutCheckControlsInput
  }

  export type IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput = {
    id?: string
    tenantId: string
    connectionId: string
    controlId: string
    createdAt?: Date | string
  }

  export type IntegrationCheckControlCreateOrConnectWithoutIntegrationCheckInput = {
    where: IntegrationCheckControlWhereUniqueInput
    create: XOR<IntegrationCheckControlCreateWithoutIntegrationCheckInput, IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput>
  }

  export type IntegrationCheckControlCreateManyIntegrationCheckInputEnvelope = {
    data: IntegrationCheckControlCreateManyIntegrationCheckInput | IntegrationCheckControlCreateManyIntegrationCheckInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationCheckResultCreateWithoutIntegrationCheckInput = {
    id?: string
    tenantId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutCheckResultsInput
  }

  export type IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput = {
    id?: string
    tenantId: string
    connectionId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
  }

  export type IntegrationCheckResultCreateOrConnectWithoutIntegrationCheckInput = {
    where: IntegrationCheckResultWhereUniqueInput
    create: XOR<IntegrationCheckResultCreateWithoutIntegrationCheckInput, IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput>
  }

  export type IntegrationCheckResultCreateManyIntegrationCheckInputEnvelope = {
    data: IntegrationCheckResultCreateManyIntegrationCheckInput | IntegrationCheckResultCreateManyIntegrationCheckInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationConnectionUpsertWithoutChecksInput = {
    update: XOR<IntegrationConnectionUpdateWithoutChecksInput, IntegrationConnectionUncheckedUpdateWithoutChecksInput>
    create: XOR<IntegrationConnectionCreateWithoutChecksInput, IntegrationConnectionUncheckedCreateWithoutChecksInput>
    where?: IntegrationConnectionWhereInput
  }

  export type IntegrationConnectionUpdateToOneWithWhereWithoutChecksInput = {
    where?: IntegrationConnectionWhereInput
    data: XOR<IntegrationConnectionUpdateWithoutChecksInput, IntegrationConnectionUncheckedUpdateWithoutChecksInput>
  }

  export type IntegrationConnectionUpdateWithoutChecksInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integration?: IntegrationUpdateOneRequiredWithoutConnectionsNestedInput
    jobs?: CollectionJobUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionUncheckedUpdateWithoutChecksInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobs?: CollectionJobUncheckedUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUncheckedUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUncheckedUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUncheckedUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationUpsertWithoutChecksInput = {
    update: XOR<IntegrationUpdateWithoutChecksInput, IntegrationUncheckedUpdateWithoutChecksInput>
    create: XOR<IntegrationCreateWithoutChecksInput, IntegrationUncheckedCreateWithoutChecksInput>
    where?: IntegrationWhereInput
  }

  export type IntegrationUpdateToOneWithWhereWithoutChecksInput = {
    where?: IntegrationWhereInput
    data: XOR<IntegrationUpdateWithoutChecksInput, IntegrationUncheckedUpdateWithoutChecksInput>
  }

  export type IntegrationUpdateWithoutChecksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    authType?: EnumAuthTypeFieldUpdateOperationsInput | $Enums.AuthType
    category?: EnumIntegrationCategoryFieldUpdateOperationsInput | $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationUpdatecapabilitiesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connections?: IntegrationConnectionUpdateManyWithoutIntegrationNestedInput
  }

  export type IntegrationUncheckedUpdateWithoutChecksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    authType?: EnumAuthTypeFieldUpdateOperationsInput | $Enums.AuthType
    category?: EnumIntegrationCategoryFieldUpdateOperationsInput | $Enums.IntegrationCategory
    configSchema?: NullableJsonNullValueInput | InputJsonValue
    capabilities?: IntegrationUpdatecapabilitiesInput | string[]
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connections?: IntegrationConnectionUncheckedUpdateManyWithoutIntegrationNestedInput
  }

  export type IntegrationCheckControlUpsertWithWhereUniqueWithoutIntegrationCheckInput = {
    where: IntegrationCheckControlWhereUniqueInput
    update: XOR<IntegrationCheckControlUpdateWithoutIntegrationCheckInput, IntegrationCheckControlUncheckedUpdateWithoutIntegrationCheckInput>
    create: XOR<IntegrationCheckControlCreateWithoutIntegrationCheckInput, IntegrationCheckControlUncheckedCreateWithoutIntegrationCheckInput>
  }

  export type IntegrationCheckControlUpdateWithWhereUniqueWithoutIntegrationCheckInput = {
    where: IntegrationCheckControlWhereUniqueInput
    data: XOR<IntegrationCheckControlUpdateWithoutIntegrationCheckInput, IntegrationCheckControlUncheckedUpdateWithoutIntegrationCheckInput>
  }

  export type IntegrationCheckControlUpdateManyWithWhereWithoutIntegrationCheckInput = {
    where: IntegrationCheckControlScalarWhereInput
    data: XOR<IntegrationCheckControlUpdateManyMutationInput, IntegrationCheckControlUncheckedUpdateManyWithoutIntegrationCheckInput>
  }

  export type IntegrationCheckResultUpsertWithWhereUniqueWithoutIntegrationCheckInput = {
    where: IntegrationCheckResultWhereUniqueInput
    update: XOR<IntegrationCheckResultUpdateWithoutIntegrationCheckInput, IntegrationCheckResultUncheckedUpdateWithoutIntegrationCheckInput>
    create: XOR<IntegrationCheckResultCreateWithoutIntegrationCheckInput, IntegrationCheckResultUncheckedCreateWithoutIntegrationCheckInput>
  }

  export type IntegrationCheckResultUpdateWithWhereUniqueWithoutIntegrationCheckInput = {
    where: IntegrationCheckResultWhereUniqueInput
    data: XOR<IntegrationCheckResultUpdateWithoutIntegrationCheckInput, IntegrationCheckResultUncheckedUpdateWithoutIntegrationCheckInput>
  }

  export type IntegrationCheckResultUpdateManyWithWhereWithoutIntegrationCheckInput = {
    where: IntegrationCheckResultScalarWhereInput
    data: XOR<IntegrationCheckResultUpdateManyMutationInput, IntegrationCheckResultUncheckedUpdateManyWithoutIntegrationCheckInput>
  }

  export type IntegrationCheckCreateWithoutControlsInput = {
    id?: string
    tenantId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutChecksInput
    integration: IntegrationCreateNestedOneWithoutChecksInput
    results?: IntegrationCheckResultCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckUncheckedCreateWithoutControlsInput = {
    id?: string
    tenantId: string
    connectionId: string
    integrationId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    results?: IntegrationCheckResultUncheckedCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckCreateOrConnectWithoutControlsInput = {
    where: IntegrationCheckWhereUniqueInput
    create: XOR<IntegrationCheckCreateWithoutControlsInput, IntegrationCheckUncheckedCreateWithoutControlsInput>
  }

  export type IntegrationConnectionCreateWithoutCheckControlsInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    integration: IntegrationCreateNestedOneWithoutConnectionsInput
    jobs?: CollectionJobCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionUncheckedCreateWithoutCheckControlsInput = {
    id?: string
    tenantId: string
    integrationId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    jobs?: CollectionJobUncheckedCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogUncheckedCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckUncheckedCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultUncheckedCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionCreateOrConnectWithoutCheckControlsInput = {
    where: IntegrationConnectionWhereUniqueInput
    create: XOR<IntegrationConnectionCreateWithoutCheckControlsInput, IntegrationConnectionUncheckedCreateWithoutCheckControlsInput>
  }

  export type IntegrationCheckUpsertWithoutControlsInput = {
    update: XOR<IntegrationCheckUpdateWithoutControlsInput, IntegrationCheckUncheckedUpdateWithoutControlsInput>
    create: XOR<IntegrationCheckCreateWithoutControlsInput, IntegrationCheckUncheckedCreateWithoutControlsInput>
    where?: IntegrationCheckWhereInput
  }

  export type IntegrationCheckUpdateToOneWithWhereWithoutControlsInput = {
    where?: IntegrationCheckWhereInput
    data: XOR<IntegrationCheckUpdateWithoutControlsInput, IntegrationCheckUncheckedUpdateWithoutControlsInput>
  }

  export type IntegrationCheckUpdateWithoutControlsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutChecksNestedInput
    integration?: IntegrationUpdateOneRequiredWithoutChecksNestedInput
    results?: IntegrationCheckResultUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationCheckUncheckedUpdateWithoutControlsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    results?: IntegrationCheckResultUncheckedUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationConnectionUpsertWithoutCheckControlsInput = {
    update: XOR<IntegrationConnectionUpdateWithoutCheckControlsInput, IntegrationConnectionUncheckedUpdateWithoutCheckControlsInput>
    create: XOR<IntegrationConnectionCreateWithoutCheckControlsInput, IntegrationConnectionUncheckedCreateWithoutCheckControlsInput>
    where?: IntegrationConnectionWhereInput
  }

  export type IntegrationConnectionUpdateToOneWithWhereWithoutCheckControlsInput = {
    where?: IntegrationConnectionWhereInput
    data: XOR<IntegrationConnectionUpdateWithoutCheckControlsInput, IntegrationConnectionUncheckedUpdateWithoutCheckControlsInput>
  }

  export type IntegrationConnectionUpdateWithoutCheckControlsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integration?: IntegrationUpdateOneRequiredWithoutConnectionsNestedInput
    jobs?: CollectionJobUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionUncheckedUpdateWithoutCheckControlsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobs?: CollectionJobUncheckedUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUncheckedUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUncheckedUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUncheckedUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationCheckCreateWithoutResultsInput = {
    id?: string
    tenantId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutChecksInput
    integration: IntegrationCreateNestedOneWithoutChecksInput
    controls?: IntegrationCheckControlCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckUncheckedCreateWithoutResultsInput = {
    id?: string
    tenantId: string
    connectionId: string
    integrationId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    controls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckCreateOrConnectWithoutResultsInput = {
    where: IntegrationCheckWhereUniqueInput
    create: XOR<IntegrationCheckCreateWithoutResultsInput, IntegrationCheckUncheckedCreateWithoutResultsInput>
  }

  export type IntegrationConnectionCreateWithoutCheckResultsInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    integration: IntegrationCreateNestedOneWithoutConnectionsInput
    jobs?: CollectionJobCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionUncheckedCreateWithoutCheckResultsInput = {
    id?: string
    tenantId: string
    integrationId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    jobs?: CollectionJobUncheckedCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogUncheckedCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckUncheckedCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionCreateOrConnectWithoutCheckResultsInput = {
    where: IntegrationConnectionWhereUniqueInput
    create: XOR<IntegrationConnectionCreateWithoutCheckResultsInput, IntegrationConnectionUncheckedCreateWithoutCheckResultsInput>
  }

  export type IntegrationCheckUpsertWithoutResultsInput = {
    update: XOR<IntegrationCheckUpdateWithoutResultsInput, IntegrationCheckUncheckedUpdateWithoutResultsInput>
    create: XOR<IntegrationCheckCreateWithoutResultsInput, IntegrationCheckUncheckedCreateWithoutResultsInput>
    where?: IntegrationCheckWhereInput
  }

  export type IntegrationCheckUpdateToOneWithWhereWithoutResultsInput = {
    where?: IntegrationCheckWhereInput
    data: XOR<IntegrationCheckUpdateWithoutResultsInput, IntegrationCheckUncheckedUpdateWithoutResultsInput>
  }

  export type IntegrationCheckUpdateWithoutResultsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutChecksNestedInput
    integration?: IntegrationUpdateOneRequiredWithoutChecksNestedInput
    controls?: IntegrationCheckControlUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationCheckUncheckedUpdateWithoutResultsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    controls?: IntegrationCheckControlUncheckedUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationConnectionUpsertWithoutCheckResultsInput = {
    update: XOR<IntegrationConnectionUpdateWithoutCheckResultsInput, IntegrationConnectionUncheckedUpdateWithoutCheckResultsInput>
    create: XOR<IntegrationConnectionCreateWithoutCheckResultsInput, IntegrationConnectionUncheckedCreateWithoutCheckResultsInput>
    where?: IntegrationConnectionWhereInput
  }

  export type IntegrationConnectionUpdateToOneWithWhereWithoutCheckResultsInput = {
    where?: IntegrationConnectionWhereInput
    data: XOR<IntegrationConnectionUpdateWithoutCheckResultsInput, IntegrationConnectionUncheckedUpdateWithoutCheckResultsInput>
  }

  export type IntegrationConnectionUpdateWithoutCheckResultsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integration?: IntegrationUpdateOneRequiredWithoutConnectionsNestedInput
    jobs?: CollectionJobUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionUncheckedUpdateWithoutCheckResultsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobs?: CollectionJobUncheckedUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUncheckedUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUncheckedUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUncheckedUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionCreateWithoutIntegrationInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    jobs?: CollectionJobCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionUncheckedCreateWithoutIntegrationInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    jobs?: CollectionJobUncheckedCreateNestedManyWithoutConnectionInput
    syncLogs?: SyncLogUncheckedCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckUncheckedCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultUncheckedCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionCreateOrConnectWithoutIntegrationInput = {
    where: IntegrationConnectionWhereUniqueInput
    create: XOR<IntegrationConnectionCreateWithoutIntegrationInput, IntegrationConnectionUncheckedCreateWithoutIntegrationInput>
  }

  export type IntegrationConnectionCreateManyIntegrationInputEnvelope = {
    data: IntegrationConnectionCreateManyIntegrationInput | IntegrationConnectionCreateManyIntegrationInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationCheckCreateWithoutIntegrationInput = {
    id?: string
    tenantId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutChecksInput
    controls?: IntegrationCheckControlCreateNestedManyWithoutIntegrationCheckInput
    results?: IntegrationCheckResultCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckUncheckedCreateWithoutIntegrationInput = {
    id?: string
    tenantId: string
    connectionId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    controls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutIntegrationCheckInput
    results?: IntegrationCheckResultUncheckedCreateNestedManyWithoutIntegrationCheckInput
  }

  export type IntegrationCheckCreateOrConnectWithoutIntegrationInput = {
    where: IntegrationCheckWhereUniqueInput
    create: XOR<IntegrationCheckCreateWithoutIntegrationInput, IntegrationCheckUncheckedCreateWithoutIntegrationInput>
  }

  export type IntegrationCheckCreateManyIntegrationInputEnvelope = {
    data: IntegrationCheckCreateManyIntegrationInput | IntegrationCheckCreateManyIntegrationInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationConnectionUpsertWithWhereUniqueWithoutIntegrationInput = {
    where: IntegrationConnectionWhereUniqueInput
    update: XOR<IntegrationConnectionUpdateWithoutIntegrationInput, IntegrationConnectionUncheckedUpdateWithoutIntegrationInput>
    create: XOR<IntegrationConnectionCreateWithoutIntegrationInput, IntegrationConnectionUncheckedCreateWithoutIntegrationInput>
  }

  export type IntegrationConnectionUpdateWithWhereUniqueWithoutIntegrationInput = {
    where: IntegrationConnectionWhereUniqueInput
    data: XOR<IntegrationConnectionUpdateWithoutIntegrationInput, IntegrationConnectionUncheckedUpdateWithoutIntegrationInput>
  }

  export type IntegrationConnectionUpdateManyWithWhereWithoutIntegrationInput = {
    where: IntegrationConnectionScalarWhereInput
    data: XOR<IntegrationConnectionUpdateManyMutationInput, IntegrationConnectionUncheckedUpdateManyWithoutIntegrationInput>
  }

  export type IntegrationConnectionScalarWhereInput = {
    AND?: IntegrationConnectionScalarWhereInput | IntegrationConnectionScalarWhereInput[]
    OR?: IntegrationConnectionScalarWhereInput[]
    NOT?: IntegrationConnectionScalarWhereInput | IntegrationConnectionScalarWhereInput[]
    id?: StringFilter<"IntegrationConnection"> | string
    tenantId?: StringFilter<"IntegrationConnection"> | string
    integrationId?: StringFilter<"IntegrationConnection"> | string
    name?: StringFilter<"IntegrationConnection"> | string
    status?: EnumConnectionStatusFilter<"IntegrationConnection"> | $Enums.ConnectionStatus
    secretId?: StringNullableFilter<"IntegrationConnection"> | string | null
    config?: JsonNullableFilter<"IntegrationConnection">
    lastSyncAt?: DateTimeNullableFilter<"IntegrationConnection"> | Date | string | null
    lastErrorMessage?: StringNullableFilter<"IntegrationConnection"> | string | null
    syncFrequencyMinutes?: IntFilter<"IntegrationConnection"> | number
    isActive?: BoolFilter<"IntegrationConnection"> | boolean
    createdAt?: DateTimeFilter<"IntegrationConnection"> | Date | string
    updatedAt?: DateTimeFilter<"IntegrationConnection"> | Date | string
  }

  export type IntegrationCheckUpsertWithWhereUniqueWithoutIntegrationInput = {
    where: IntegrationCheckWhereUniqueInput
    update: XOR<IntegrationCheckUpdateWithoutIntegrationInput, IntegrationCheckUncheckedUpdateWithoutIntegrationInput>
    create: XOR<IntegrationCheckCreateWithoutIntegrationInput, IntegrationCheckUncheckedCreateWithoutIntegrationInput>
  }

  export type IntegrationCheckUpdateWithWhereUniqueWithoutIntegrationInput = {
    where: IntegrationCheckWhereUniqueInput
    data: XOR<IntegrationCheckUpdateWithoutIntegrationInput, IntegrationCheckUncheckedUpdateWithoutIntegrationInput>
  }

  export type IntegrationCheckUpdateManyWithWhereWithoutIntegrationInput = {
    where: IntegrationCheckScalarWhereInput
    data: XOR<IntegrationCheckUpdateManyMutationInput, IntegrationCheckUncheckedUpdateManyWithoutIntegrationInput>
  }

  export type IntegrationConnectionCreateWithoutJobsInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    integration: IntegrationCreateNestedOneWithoutConnectionsInput
    syncLogs?: SyncLogCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionUncheckedCreateWithoutJobsInput = {
    id?: string
    tenantId: string
    integrationId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    syncLogs?: SyncLogUncheckedCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckUncheckedCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultUncheckedCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionCreateOrConnectWithoutJobsInput = {
    where: IntegrationConnectionWhereUniqueInput
    create: XOR<IntegrationConnectionCreateWithoutJobsInput, IntegrationConnectionUncheckedCreateWithoutJobsInput>
  }

  export type CollectionJobRunCreateWithoutJobInput = {
    id?: string
    tenantId: string
    runNumber: number
    status?: $Enums.RunStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    evidenceCount?: number
    errorCount?: number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: string | null
    createdAt?: Date | string
    retries?: CollectionRetryCreateNestedManyWithoutJobRunInput
  }

  export type CollectionJobRunUncheckedCreateWithoutJobInput = {
    id?: string
    tenantId: string
    runNumber: number
    status?: $Enums.RunStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    evidenceCount?: number
    errorCount?: number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: string | null
    createdAt?: Date | string
    retries?: CollectionRetryUncheckedCreateNestedManyWithoutJobRunInput
  }

  export type CollectionJobRunCreateOrConnectWithoutJobInput = {
    where: CollectionJobRunWhereUniqueInput
    create: XOR<CollectionJobRunCreateWithoutJobInput, CollectionJobRunUncheckedCreateWithoutJobInput>
  }

  export type CollectionJobRunCreateManyJobInputEnvelope = {
    data: CollectionJobRunCreateManyJobInput | CollectionJobRunCreateManyJobInput[]
    skipDuplicates?: boolean
  }

  export type IntegrationConnectionUpsertWithoutJobsInput = {
    update: XOR<IntegrationConnectionUpdateWithoutJobsInput, IntegrationConnectionUncheckedUpdateWithoutJobsInput>
    create: XOR<IntegrationConnectionCreateWithoutJobsInput, IntegrationConnectionUncheckedCreateWithoutJobsInput>
    where?: IntegrationConnectionWhereInput
  }

  export type IntegrationConnectionUpdateToOneWithWhereWithoutJobsInput = {
    where?: IntegrationConnectionWhereInput
    data: XOR<IntegrationConnectionUpdateWithoutJobsInput, IntegrationConnectionUncheckedUpdateWithoutJobsInput>
  }

  export type IntegrationConnectionUpdateWithoutJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integration?: IntegrationUpdateOneRequiredWithoutConnectionsNestedInput
    syncLogs?: SyncLogUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionUncheckedUpdateWithoutJobsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncLogs?: SyncLogUncheckedUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUncheckedUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUncheckedUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUncheckedUpdateManyWithoutConnectionNestedInput
  }

  export type CollectionJobRunUpsertWithWhereUniqueWithoutJobInput = {
    where: CollectionJobRunWhereUniqueInput
    update: XOR<CollectionJobRunUpdateWithoutJobInput, CollectionJobRunUncheckedUpdateWithoutJobInput>
    create: XOR<CollectionJobRunCreateWithoutJobInput, CollectionJobRunUncheckedCreateWithoutJobInput>
  }

  export type CollectionJobRunUpdateWithWhereUniqueWithoutJobInput = {
    where: CollectionJobRunWhereUniqueInput
    data: XOR<CollectionJobRunUpdateWithoutJobInput, CollectionJobRunUncheckedUpdateWithoutJobInput>
  }

  export type CollectionJobRunUpdateManyWithWhereWithoutJobInput = {
    where: CollectionJobRunScalarWhereInput
    data: XOR<CollectionJobRunUpdateManyMutationInput, CollectionJobRunUncheckedUpdateManyWithoutJobInput>
  }

  export type CollectionJobRunScalarWhereInput = {
    AND?: CollectionJobRunScalarWhereInput | CollectionJobRunScalarWhereInput[]
    OR?: CollectionJobRunScalarWhereInput[]
    NOT?: CollectionJobRunScalarWhereInput | CollectionJobRunScalarWhereInput[]
    id?: StringFilter<"CollectionJobRun"> | string
    jobId?: StringFilter<"CollectionJobRun"> | string
    tenantId?: StringFilter<"CollectionJobRun"> | string
    runNumber?: IntFilter<"CollectionJobRun"> | number
    status?: EnumRunStatusFilter<"CollectionJobRun"> | $Enums.RunStatus
    startedAt?: DateTimeFilter<"CollectionJobRun"> | Date | string
    completedAt?: DateTimeNullableFilter<"CollectionJobRun"> | Date | string | null
    durationMs?: IntNullableFilter<"CollectionJobRun"> | number | null
    evidenceCount?: IntFilter<"CollectionJobRun"> | number
    errorCount?: IntFilter<"CollectionJobRun"> | number
    resultSummary?: JsonNullableFilter<"CollectionJobRun">
    errorDetails?: StringNullableFilter<"CollectionJobRun"> | string | null
    createdAt?: DateTimeFilter<"CollectionJobRun"> | Date | string
  }

  export type CollectionJobCreateWithoutRunsInput = {
    id?: string
    tenantId: string
    type: $Enums.JobType
    status?: $Enums.JobStatus
    priority?: number
    scheduledAt?: Date | string
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    nextRunAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    connection: IntegrationConnectionCreateNestedOneWithoutJobsInput
  }

  export type CollectionJobUncheckedCreateWithoutRunsInput = {
    id?: string
    tenantId: string
    connectionId: string
    type: $Enums.JobType
    status?: $Enums.JobStatus
    priority?: number
    scheduledAt?: Date | string
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    nextRunAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CollectionJobCreateOrConnectWithoutRunsInput = {
    where: CollectionJobWhereUniqueInput
    create: XOR<CollectionJobCreateWithoutRunsInput, CollectionJobUncheckedCreateWithoutRunsInput>
  }

  export type CollectionRetryCreateWithoutJobRunInput = {
    id?: string
    tenantId: string
    attemptNumber: number
    status?: $Enums.RetryStatus
    errorMessage?: string | null
    scheduledAt?: Date | string
    attemptedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    maxAttempts?: number
    backoffMs?: number
    createdAt?: Date | string
  }

  export type CollectionRetryUncheckedCreateWithoutJobRunInput = {
    id?: string
    tenantId: string
    attemptNumber: number
    status?: $Enums.RetryStatus
    errorMessage?: string | null
    scheduledAt?: Date | string
    attemptedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    maxAttempts?: number
    backoffMs?: number
    createdAt?: Date | string
  }

  export type CollectionRetryCreateOrConnectWithoutJobRunInput = {
    where: CollectionRetryWhereUniqueInput
    create: XOR<CollectionRetryCreateWithoutJobRunInput, CollectionRetryUncheckedCreateWithoutJobRunInput>
  }

  export type CollectionRetryCreateManyJobRunInputEnvelope = {
    data: CollectionRetryCreateManyJobRunInput | CollectionRetryCreateManyJobRunInput[]
    skipDuplicates?: boolean
  }

  export type CollectionJobUpsertWithoutRunsInput = {
    update: XOR<CollectionJobUpdateWithoutRunsInput, CollectionJobUncheckedUpdateWithoutRunsInput>
    create: XOR<CollectionJobCreateWithoutRunsInput, CollectionJobUncheckedCreateWithoutRunsInput>
    where?: CollectionJobWhereInput
  }

  export type CollectionJobUpdateToOneWithWhereWithoutRunsInput = {
    where?: CollectionJobWhereInput
    data: XOR<CollectionJobUpdateWithoutRunsInput, CollectionJobUncheckedUpdateWithoutRunsInput>
  }

  export type CollectionJobUpdateWithoutRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutJobsNestedInput
  }

  export type CollectionJobUncheckedUpdateWithoutRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionRetryUpsertWithWhereUniqueWithoutJobRunInput = {
    where: CollectionRetryWhereUniqueInput
    update: XOR<CollectionRetryUpdateWithoutJobRunInput, CollectionRetryUncheckedUpdateWithoutJobRunInput>
    create: XOR<CollectionRetryCreateWithoutJobRunInput, CollectionRetryUncheckedCreateWithoutJobRunInput>
  }

  export type CollectionRetryUpdateWithWhereUniqueWithoutJobRunInput = {
    where: CollectionRetryWhereUniqueInput
    data: XOR<CollectionRetryUpdateWithoutJobRunInput, CollectionRetryUncheckedUpdateWithoutJobRunInput>
  }

  export type CollectionRetryUpdateManyWithWhereWithoutJobRunInput = {
    where: CollectionRetryScalarWhereInput
    data: XOR<CollectionRetryUpdateManyMutationInput, CollectionRetryUncheckedUpdateManyWithoutJobRunInput>
  }

  export type CollectionRetryScalarWhereInput = {
    AND?: CollectionRetryScalarWhereInput | CollectionRetryScalarWhereInput[]
    OR?: CollectionRetryScalarWhereInput[]
    NOT?: CollectionRetryScalarWhereInput | CollectionRetryScalarWhereInput[]
    id?: StringFilter<"CollectionRetry"> | string
    jobRunId?: StringFilter<"CollectionRetry"> | string
    tenantId?: StringFilter<"CollectionRetry"> | string
    attemptNumber?: IntFilter<"CollectionRetry"> | number
    status?: EnumRetryStatusFilter<"CollectionRetry"> | $Enums.RetryStatus
    errorMessage?: StringNullableFilter<"CollectionRetry"> | string | null
    scheduledAt?: DateTimeFilter<"CollectionRetry"> | Date | string
    attemptedAt?: DateTimeNullableFilter<"CollectionRetry"> | Date | string | null
    nextRetryAt?: DateTimeNullableFilter<"CollectionRetry"> | Date | string | null
    maxAttempts?: IntFilter<"CollectionRetry"> | number
    backoffMs?: IntFilter<"CollectionRetry"> | number
    createdAt?: DateTimeFilter<"CollectionRetry"> | Date | string
  }

  export type CollectionJobRunCreateWithoutRetriesInput = {
    id?: string
    tenantId: string
    runNumber: number
    status?: $Enums.RunStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    evidenceCount?: number
    errorCount?: number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: string | null
    createdAt?: Date | string
    job: CollectionJobCreateNestedOneWithoutRunsInput
  }

  export type CollectionJobRunUncheckedCreateWithoutRetriesInput = {
    id?: string
    jobId: string
    tenantId: string
    runNumber: number
    status?: $Enums.RunStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    evidenceCount?: number
    errorCount?: number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: string | null
    createdAt?: Date | string
  }

  export type CollectionJobRunCreateOrConnectWithoutRetriesInput = {
    where: CollectionJobRunWhereUniqueInput
    create: XOR<CollectionJobRunCreateWithoutRetriesInput, CollectionJobRunUncheckedCreateWithoutRetriesInput>
  }

  export type CollectionJobRunUpsertWithoutRetriesInput = {
    update: XOR<CollectionJobRunUpdateWithoutRetriesInput, CollectionJobRunUncheckedUpdateWithoutRetriesInput>
    create: XOR<CollectionJobRunCreateWithoutRetriesInput, CollectionJobRunUncheckedCreateWithoutRetriesInput>
    where?: CollectionJobRunWhereInput
  }

  export type CollectionJobRunUpdateToOneWithWhereWithoutRetriesInput = {
    where?: CollectionJobRunWhereInput
    data: XOR<CollectionJobRunUpdateWithoutRetriesInput, CollectionJobRunUncheckedUpdateWithoutRetriesInput>
  }

  export type CollectionJobRunUpdateWithoutRetriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    job?: CollectionJobUpdateOneRequiredWithoutRunsNestedInput
  }

  export type CollectionJobRunUncheckedUpdateWithoutRetriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    jobId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationConnectionCreateWithoutSyncLogsInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    integration: IntegrationCreateNestedOneWithoutConnectionsInput
    jobs?: CollectionJobCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionUncheckedCreateWithoutSyncLogsInput = {
    id?: string
    tenantId: string
    integrationId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    jobs?: CollectionJobUncheckedCreateNestedManyWithoutConnectionInput
    checks?: IntegrationCheckUncheckedCreateNestedManyWithoutConnectionInput
    checkControls?: IntegrationCheckControlUncheckedCreateNestedManyWithoutConnectionInput
    checkResults?: IntegrationCheckResultUncheckedCreateNestedManyWithoutConnectionInput
  }

  export type IntegrationConnectionCreateOrConnectWithoutSyncLogsInput = {
    where: IntegrationConnectionWhereUniqueInput
    create: XOR<IntegrationConnectionCreateWithoutSyncLogsInput, IntegrationConnectionUncheckedCreateWithoutSyncLogsInput>
  }

  export type IntegrationConnectionUpsertWithoutSyncLogsInput = {
    update: XOR<IntegrationConnectionUpdateWithoutSyncLogsInput, IntegrationConnectionUncheckedUpdateWithoutSyncLogsInput>
    create: XOR<IntegrationConnectionCreateWithoutSyncLogsInput, IntegrationConnectionUncheckedCreateWithoutSyncLogsInput>
    where?: IntegrationConnectionWhereInput
  }

  export type IntegrationConnectionUpdateToOneWithWhereWithoutSyncLogsInput = {
    where?: IntegrationConnectionWhereInput
    data: XOR<IntegrationConnectionUpdateWithoutSyncLogsInput, IntegrationConnectionUncheckedUpdateWithoutSyncLogsInput>
  }

  export type IntegrationConnectionUpdateWithoutSyncLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integration?: IntegrationUpdateOneRequiredWithoutConnectionsNestedInput
    jobs?: CollectionJobUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionUncheckedUpdateWithoutSyncLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobs?: CollectionJobUncheckedUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUncheckedUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUncheckedUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUncheckedUpdateManyWithoutConnectionNestedInput
  }

  export type CollectionJobCreateManyConnectionInput = {
    id?: string
    tenantId: string
    type: $Enums.JobType
    status?: $Enums.JobStatus
    priority?: number
    scheduledAt?: Date | string
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    nextRunAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SyncLogCreateManyConnectionInput = {
    id?: string
    tenantId: string
    integrationId: string
    action: $Enums.SyncAction
    status?: $Enums.SyncStatus
    recordsProcessed?: number
    recordsFailed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type IntegrationCheckCreateManyConnectionInput = {
    id?: string
    tenantId: string
    integrationId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type IntegrationCheckControlCreateManyConnectionInput = {
    id?: string
    tenantId: string
    integrationCheckId: string
    controlId: string
    createdAt?: Date | string
  }

  export type IntegrationCheckResultCreateManyConnectionInput = {
    id?: string
    tenantId: string
    integrationCheckId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
  }

  export type CollectionJobUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    runs?: CollectionJobRunUpdateManyWithoutJobNestedInput
  }

  export type CollectionJobUncheckedUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    runs?: CollectionJobRunUncheckedUpdateManyWithoutJobNestedInput
  }

  export type CollectionJobUncheckedUpdateManyWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    type?: EnumJobTypeFieldUpdateOperationsInput | $Enums.JobType
    status?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    priority?: IntFieldUpdateOperationsInput | number
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncLogUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    action?: EnumSyncActionFieldUpdateOperationsInput | $Enums.SyncAction
    status?: EnumSyncStatusFieldUpdateOperationsInput | $Enums.SyncStatus
    recordsProcessed?: IntFieldUpdateOperationsInput | number
    recordsFailed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncLogUncheckedUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    action?: EnumSyncActionFieldUpdateOperationsInput | $Enums.SyncAction
    status?: EnumSyncStatusFieldUpdateOperationsInput | $Enums.SyncStatus
    recordsProcessed?: IntFieldUpdateOperationsInput | number
    recordsFailed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncLogUncheckedUpdateManyWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    action?: EnumSyncActionFieldUpdateOperationsInput | $Enums.SyncAction
    status?: EnumSyncStatusFieldUpdateOperationsInput | $Enums.SyncStatus
    recordsProcessed?: IntFieldUpdateOperationsInput | number
    recordsFailed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integration?: IntegrationUpdateOneRequiredWithoutChecksNestedInput
    controls?: IntegrationCheckControlUpdateManyWithoutIntegrationCheckNestedInput
    results?: IntegrationCheckResultUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationCheckUncheckedUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    controls?: IntegrationCheckControlUncheckedUpdateManyWithoutIntegrationCheckNestedInput
    results?: IntegrationCheckResultUncheckedUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationCheckUncheckedUpdateManyWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckControlUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integrationCheck?: IntegrationCheckUpdateOneRequiredWithoutControlsNestedInput
  }

  export type IntegrationCheckControlUncheckedUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationCheckId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckControlUncheckedUpdateManyWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationCheckId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckResultUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    integrationCheck?: IntegrationCheckUpdateOneRequiredWithoutResultsNestedInput
  }

  export type IntegrationCheckResultUncheckedUpdateWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationCheckId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckResultUncheckedUpdateManyWithoutConnectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    integrationCheckId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckControlCreateManyIntegrationCheckInput = {
    id?: string
    tenantId: string
    connectionId: string
    controlId: string
    createdAt?: Date | string
  }

  export type IntegrationCheckResultCreateManyIntegrationCheckInput = {
    id?: string
    tenantId: string
    connectionId: string
    status: $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    durationMs?: number | null
    evidenceId?: string | null
    createdAt?: Date | string
  }

  export type IntegrationCheckControlUpdateWithoutIntegrationCheckInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutCheckControlsNestedInput
  }

  export type IntegrationCheckControlUncheckedUpdateWithoutIntegrationCheckInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckControlUncheckedUpdateManyWithoutIntegrationCheckInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    controlId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckResultUpdateWithoutIntegrationCheckInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutCheckResultsNestedInput
  }

  export type IntegrationCheckResultUncheckedUpdateWithoutIntegrationCheckInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckResultUncheckedUpdateManyWithoutIntegrationCheckInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    status?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    payload?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationConnectionCreateManyIntegrationInput = {
    id?: string
    tenantId: string
    name: string
    status?: $Enums.ConnectionStatus
    secretId?: string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: Date | string | null
    lastErrorMessage?: string | null
    syncFrequencyMinutes?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type IntegrationCheckCreateManyIntegrationInput = {
    id?: string
    tenantId: string
    connectionId: string
    manifestKey: string
    title: string
    description?: string | null
    severity?: $Enums.IntegrationCheckSeverity
    schedule?: string
    isEnabled?: boolean
    runner?: string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: string | null
    aiModel?: string | null
    lastStatus?: $Enums.IntegrationCheckStatus
    lastRunAt?: Date | string | null
    lastEvidenceId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type IntegrationConnectionUpdateWithoutIntegrationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobs?: CollectionJobUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionUncheckedUpdateWithoutIntegrationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    jobs?: CollectionJobUncheckedUpdateManyWithoutConnectionNestedInput
    syncLogs?: SyncLogUncheckedUpdateManyWithoutConnectionNestedInput
    checks?: IntegrationCheckUncheckedUpdateManyWithoutConnectionNestedInput
    checkControls?: IntegrationCheckControlUncheckedUpdateManyWithoutConnectionNestedInput
    checkResults?: IntegrationCheckResultUncheckedUpdateManyWithoutConnectionNestedInput
  }

  export type IntegrationConnectionUncheckedUpdateManyWithoutIntegrationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumConnectionStatusFieldUpdateOperationsInput | $Enums.ConnectionStatus
    secretId?: NullableStringFieldUpdateOperationsInput | string | null
    config?: NullableJsonNullValueInput | InputJsonValue
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastErrorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    syncFrequencyMinutes?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntegrationCheckUpdateWithoutIntegrationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    connection?: IntegrationConnectionUpdateOneRequiredWithoutChecksNestedInput
    controls?: IntegrationCheckControlUpdateManyWithoutIntegrationCheckNestedInput
    results?: IntegrationCheckResultUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationCheckUncheckedUpdateWithoutIntegrationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    controls?: IntegrationCheckControlUncheckedUpdateManyWithoutIntegrationCheckNestedInput
    results?: IntegrationCheckResultUncheckedUpdateManyWithoutIntegrationCheckNestedInput
  }

  export type IntegrationCheckUncheckedUpdateManyWithoutIntegrationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    connectionId?: StringFieldUpdateOperationsInput | string
    manifestKey?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: EnumIntegrationCheckSeverityFieldUpdateOperationsInput | $Enums.IntegrationCheckSeverity
    schedule?: StringFieldUpdateOperationsInput | string
    isEnabled?: BoolFieldUpdateOperationsInput | boolean
    runner?: StringFieldUpdateOperationsInput | string
    spec?: NullableJsonNullValueInput | InputJsonValue
    aiPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    aiModel?: NullableStringFieldUpdateOperationsInput | string | null
    lastStatus?: EnumIntegrationCheckStatusFieldUpdateOperationsInput | $Enums.IntegrationCheckStatus
    lastRunAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastEvidenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionJobRunCreateManyJobInput = {
    id?: string
    tenantId: string
    runNumber: number
    status?: $Enums.RunStatus
    startedAt?: Date | string
    completedAt?: Date | string | null
    durationMs?: number | null
    evidenceCount?: number
    errorCount?: number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: string | null
    createdAt?: Date | string
  }

  export type CollectionJobRunUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    retries?: CollectionRetryUpdateManyWithoutJobRunNestedInput
  }

  export type CollectionJobRunUncheckedUpdateWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    retries?: CollectionRetryUncheckedUpdateManyWithoutJobRunNestedInput
  }

  export type CollectionJobRunUncheckedUpdateManyWithoutJobInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    runNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    evidenceCount?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    resultSummary?: NullableJsonNullValueInput | InputJsonValue
    errorDetails?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionRetryCreateManyJobRunInput = {
    id?: string
    tenantId: string
    attemptNumber: number
    status?: $Enums.RetryStatus
    errorMessage?: string | null
    scheduledAt?: Date | string
    attemptedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    maxAttempts?: number
    backoffMs?: number
    createdAt?: Date | string
  }

  export type CollectionRetryUpdateWithoutJobRunInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    attemptNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRetryStatusFieldUpdateOperationsInput | $Enums.RetryStatus
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    maxAttempts?: IntFieldUpdateOperationsInput | number
    backoffMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionRetryUncheckedUpdateWithoutJobRunInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    attemptNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRetryStatusFieldUpdateOperationsInput | $Enums.RetryStatus
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    maxAttempts?: IntFieldUpdateOperationsInput | number
    backoffMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CollectionRetryUncheckedUpdateManyWithoutJobRunInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    attemptNumber?: IntFieldUpdateOperationsInput | number
    status?: EnumRetryStatusFieldUpdateOperationsInput | $Enums.RetryStatus
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    scheduledAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    maxAttempts?: IntFieldUpdateOperationsInput | number
    backoffMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}