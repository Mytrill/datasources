import { Rule, RuleValue } from "./Entity"

export interface ExecuteRulePayload {
  rule: Rule
  resolveValue(value: RuleValue): Promise<any>
}

function isEqual(value1: any, value2: any): boolean {
  if (value1 && typeof value1 === "object") {
    if (value2 && typeof value2 === "object") {
      return value1._id === value2._id
    } else if (typeof value2 === "string") {
      value1._id === value2
    } else {
      return value1 === value2
    }
  } else if (typeof value1 === "string" && value2 && typeof value2 === "object") {
    return value1 === value2._id
  }
  return value1 === value2
}

function isIn(value1: any, value2: any): boolean {
  if (typeof value2 === "object") {
    if (Array.isArray(value2)) {
      for (const item of value2) {
        if (isEqual(value1, item)) {
          return true
        }
      }
      return false
    } else if (value2) {
      if (value1 && value1._id) {
        // entity in entity map
        return !!value2[value1._id]
      }
      for (const item in Object.values(value2)) {
        if (isEqual(value1, item)) {
          return true
        }
      }
      return false
    }
  }
  return false
}

export async function executeRule(payload: ExecuteRulePayload): Promise<boolean> {
  const { rule, resolveValue } = payload
  switch (rule.type) {
    case "and": {
      const results = await Promise.all(rule.rules.map((r) => executeRule({ rule: r, resolveValue })))
      return results.reduce((prev, curr) => prev && curr, true)
    }
    case "or": {
      for (const r of rule.rules) {
        const res = await executeRule({ rule: r, resolveValue })
        if (res) {
          return true
        }
      }
      return false
    }
    case "condition": {
      const [value1, value2] = await Promise.all([resolveValue(rule.value1), resolveValue(rule.value2)])
      switch (rule.op) {
        case "==":
          return isEqual(value1, value2)
        case "!=":
          return !isEqual(value1, value2)
        case "contains":
          return isIn(value2, value1)
        case "in":
          return isIn(value1, value2)
      }
    }
  }
}
