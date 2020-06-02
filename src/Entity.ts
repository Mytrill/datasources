import { StringMap } from "./types"

//
// -----------------------------------------------------
//

export interface BaseAttribute {
  id: string
  required?: boolean
  lazy?: boolean
  read?: string
  write?: string
}

export interface StringAttribute extends BaseAttribute {
  type: "string"
  value?: string
  defaultValue?: string
}

export interface MultilineStringAttribute extends BaseAttribute {
  type: "multiline-string"
  value?: string
  defaultValue?: string
  maxLines?: number
}

export interface EnumAttribute extends BaseAttribute {
  type: "enum"
  value?: string
  defaultValue?: string
}

export interface BooleanAttribute extends BaseAttribute {
  type: "boolean"
  value?: boolean
  defaultValue?: boolean
}

export interface NumberAttribute extends BaseAttribute {
  type: "number"
  value?: number
  defaultValue?: number
}

type EntityStorage = { attributes: string[] }

export interface EntityAttribute extends BaseAttribute {
  type: "entity"
  entity: string
  inverse?: { attribute?: string }
  storage?: EntityStorage
}

export interface EntityMapAttribute extends BaseAttribute {
  type: "entity-map"
  entity: string
  // by default, the id of the entity, but can be any Entity attribute
  key?: string
  inverseOf?: { attribute: string }
  storage?: EntityStorage
}

export interface KeywordsAttribute extends BaseAttribute {
  type: "keywords"
  attributes: string[]
}

export type Attribute =
  | StringAttribute
  | MultilineStringAttribute
  | EnumAttribute
  | BooleanAttribute
  | NumberAttribute
  | EntityAttribute
  | EntityMapAttribute
  | KeywordsAttribute

//
// -----------------------------------------------------
//

export type AttributeValue =
  | { type: "value"; value: any }
  | { type: "array-updates"; append: any[]; remove: any[] }
  | { type: "increment"; value: number }
  | { type: "server-time" }

//
// -----------------------------------------------------
//

export interface AttributeRestriction {
  readonly?: boolean
  /** For EntityMapAttribute, when `true`, returns an array of values. */
  values?: boolean
  value?: any
  defaultValue?: any
  required?: boolean
  read?: string
  write?: string
  lazy?: boolean
}

interface QueryCondition {
  attribute: string
  op: "==" | "!=" | "in" | "contains"
  value: any
}

export interface EntityRestriction {
  attributes?: StringMap<AttributeRestriction>
  conditions?: QueryCondition[]
  rules?: EntityRules
}

//
// -----------------------------------------------------
//

export interface EntityRules {
  read?: string
  write?: string
  create?: string
  update?: string
  delete?: string
}

//
// -----------------------------------------------------
//

export type EntityType = { id: "document" } | { id: "embedded"; document: string } | { id: "user" }

export interface Entity {
  id: string
  type: EntityType
  attributes: Attribute[]
  restrictions: EntityRestriction[]
}
