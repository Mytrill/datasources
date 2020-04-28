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
  source?: { id: string } // ; attribute?: string
  joins?: EntityJoin[]
  mutations?: Mutation[]
}

//
// --------------------------------------------
//

export const ID = "_id"
export const DELETE = "_delete"

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
  data: Array<T & WithId>
  cache: DatasourceData
}

//
// --------------------------------------------
//

export interface GetRequest {
  type: "get"
  entity: string
  id: string
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

export interface Datasource {
  id: string
  getEntity(entity: string): Entity

  execute<T = any>(request: GetRequest): GetResponse<T>
  execute<T = any>(request: QueryRequest): QueryResponse<T>
  execute<T = any>(request: SetRequest): SetResponse<T>
}
