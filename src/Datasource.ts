import { Mutation } from "./Mutation"

//
// --------------------------------------------
//

export interface DatasourceData {
  [entity: string]: {
    [id: string]: any
  }
}

//
// --------------------------------------------
//

export type JoinPersistence =
  | boolean
  | { type: "array" } // attributes?: string[]; mutations?: Mutation[]
  | { type: "map"; keys?: string } // attributes?: string[]; mutations?: Mutation[]

export interface EntityJoin {
  id: string
  target: string
  attributes: { source: string; target: string; op?: "==" | "contains" | "in" }
  persist?: JoinPersistence
  as?: string
  cardinality?: "many" | "one"
}

export interface Entity {
  id: string
  source?: { entity: string; id?: string } // ; attribute?: string
  joins?: EntityJoin[]
  mutations?: Mutation[]
}

//
// --------------------------------------------
//

export type QueryOperand = "==" | "in" | "contains"

export interface AttributeQuery {
  attribute: string
  value: any
  operand?: QueryOperand
}

export interface EntityQuery {
  id?: string | string[]
  attributes?: AttributeQuery[]
}

export interface QueryRequest {
  type: "query"
  entity: string
  /** string for full text seach. */
  query?: string | EntityQuery
  joins?: string[]
  // TODO add pagination
  cache?: DatasourceData
}

export interface QueryResponse<T = any> {
  data: DatasourceObject<T>[]
  cache: DatasourceData
}

export type DatasourceObject<T = any> = T & WithId

//
// --------------------------------------------
//

export interface GetRequest {
  type: "get"
  entity: string
  /** Not needed if the entity specifies a  */
  id?: string
  // e.g. ["similar", "similar.recipe2"] or "similar.*" or "*" or "*.*"?
  joins?: string[]
  cache?: DatasourceData
}

export interface GetResponse<T = any> {
  data: (T & WithId) | undefined
  cache: DatasourceData
}

//
// --------------------------------------------
//

export interface SetRequest {
  type: "set"
  entity: string
  id: string
  data: any
  cache?: DatasourceData
  raw?: DatasourceData
  joins?: string[]
}

export interface SetResponse<T> {
  // nothing for now
}

//
// --------------------------------------------
//

export interface WithId {
  _id: string
}

export type DatasourceRequest = GetRequest | QueryRequest | SetRequest
export type DatasourceResponse<T> = GetResponse<T> | QueryResponse<T> | SetResponse<T>

export interface Datasource {
  id: string
  getEntity(entity: string, strict?: boolean): Entity
  registerEntity(entity: Entity): void

  execute<T = any>(request: GetRequest): Promise<GetResponse<T>>
  execute<T = any>(request: QueryRequest): Promise<QueryResponse<T>>
  execute<T = any>(request: SetRequest): Promise<SetResponse<T>>
}
