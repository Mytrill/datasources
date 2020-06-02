import { StringMap } from "./types"

//
// -----------------------------------------------------
//

export interface BaseAttribute {
  id: string
  required?: boolean
  lazy?: boolean
  read?: Rule
  write?: Rule
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
  read?: Rule
  write?: Rule
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

export type RuleValue =
  | { type: "user"; attribute: string[] }
  | { type: "document"; attribute: string[] }
  | { type: "update"; attribute: string[] }
  | { type: "value"; value: string | boolean | number }

export type RuleOperand = "==" | "!=" | "in" | "contains"

export type Rule =
  | { type: "or"; rules: Rule[] }
  | { type: "and"; rules: Rule[] }
  | { type: "condition"; value1: RuleValue; op: RuleOperand; value2: RuleValue }

export interface EntityRules {
  read?: Rule
  write?: Rule
  create?: Rule
  update?: Rule
  delete?: Rule
}

//
// -----------------------------------------------------
//

export interface InternalEntity {
  id: string
  type: EntityType
  attributes: Attribute[]
  restrictions: EntityRestriction[]
  rules: EntityRules
}

//
// -----------------------------------------------------
//

export type EntityType =
  | { id: "document"; collection: string }
  | { id: "embedded"; entity: string }
  | { id: "user"; collection: string }

export interface Entity {
  id: string
  type: EntityType
  attributes: Attribute[]
  restrictions: EntityRestriction[]
  rules: EntityRules
}
