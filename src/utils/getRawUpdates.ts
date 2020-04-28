import * as immutable from "dot-prop-immutable"

import { Datasource, DELETE, Entity, EntityJoin, ID } from "../Datasource"

//
// --------------------------------------------
//

function getRawEntity(entity: Entity): string {
  if (!entity.source) return entity.id
  return entity.source.id
}

//
// --------------------------------------------
//

function markJoinEntitiesToRemove(payload: GetRawUpdatesPayload, _result: RawUpdates): RawUpdates {
  const { entity, joins, previous, data } = payload
  let result = _result
  for (const join of entity.joins || []) {
    if (!joins[join.id]) {
      continue
    }

    const { source, op, target } = join.attributes
    if (source === ID && (!op || op === "==")) {
      const joinValues = getJoinValues(previous, join)
      for (const joinValue of joinValues) {
        result = immutable.set(result, join.target + "." + joinValue._id, DELETE)
      }
    } else if (source === ID && op === "in") {
      const joinValues = getJoinValues(previous, join)
      for (const joinValue of joinValues) {
        const ids = immutable.get(joinValue, target)
        if (Array.isArray(ids)) {
          const removed = ids.filter((id) => id !== data._id)
          const updated = immutable.set(joinValue, target, removed)
          result = immutable.set(result, join.target + "." + joinValue._id, updated)
        } else {
          throw new Error(`Got non-array value for join with op = "in"`)
        }
      }
    }
  }

  return result
}

//
// --------------------------------------------
//

function computeInverseJoinStoredInTarget(
  payload: GetRawUpdatesPayload,
  join: EntityJoin,
  _result: RawUpdates
): RawUpdates {
  const { datasource, entity, joins, data, previous } = payload
  let result = _result
  const rawEntity = getRawEntity(entity)
  const joinValues = getJoinValues(data, join)
  const targetEntity = datasource.getEntity(join.target)
  const targetRaw = getRawEntity(targetEntity)

  for (const joinValue of joinValues) {
    const previousJoinValue = immutable.get(previous, [targetRaw, joinValue._id])

    result = getRawUpdates(
      {
        datasource,
        entity: targetEntity,
        data: joinValue,
        joins: joins[join.id],
        previous: previousJoinValue,
      },
      result
    )
  }

  // remove the join data from this entity
  if (!join.persist) {
    result = immutable.delete(result, rawEntity + "." + data._id + "." + (join.as || join.id)) as any
  }

  return result
}

function computeInverseJoinStoredInEntity(
  payload: GetRawUpdatesPayload,
  join: EntityJoin,
  _result: RawUpdates
): RawUpdates {
  const { entity, data } = payload
  let result = _result
  const rawEntity = getRawEntity(entity)

  if (!join.persist) {
    const joinValues = getJoinValues(data, join)
    result = immutable.delete(result, rawEntity + "." + data._id + "." + (join.as || join.id)) as any
    const values = joinValues.map((v) => immutable.get(v, join.attributes.target))
    result = immutable.set(
      result,
      [rawEntity, data._id, join.attributes.source],
      join.cardinality === "one" ? values[0] : values
    )

    return result
  }

  // store as an array by default
  const persist: any = join.persist === true ? { type: "array" } : join.persist

  // store as array
  if (persist.type === "array") {
    const joinValues = getJoinValues(data, join)
    return immutable.set(
      result,
      [rawEntity, data._id, join.as || join.id],
      join.cardinality === "one" ? joinValues[0] : joinValues
    )
  }

  // store as map
  const joinValues = getJoinValues(data, join)
  const values: any = {}
  joinValues.forEach((v) => (values[immutable.get(v, persist.keys || "_id")] = v))
  return immutable.set(
    result,
    [rawEntity, data._id, join.as || join.id],
    join.cardinality === "one" ? joinValues[0] : values
  )
}

//
// --------------------------------------------
//

function computeInverseJoinValues(payload: GetRawUpdatesPayload, _result: RawUpdates): RawUpdates {
  const { entity, joins } = payload
  let result = _result
  for (const join of entity.joins || []) {
    if (!joins[join.id]) {
      continue
    }

    if (join.attributes.source === ID) {
      result = computeInverseJoinStoredInTarget(payload, join, result)
    } else {
      result = computeInverseJoinStoredInEntity(payload, join, result)
    }
  }

  return result
}

function getJoinValues(data: any, join: EntityJoin): any[] {
  const joinData = immutable.get(data, join.as || join.id)

  if (join.cardinality === "one") {
    return [joinData]
  } else {
    return Array.isArray(joinData) ? joinData : Object.values(joinData)
  }
}

//
// --------------------------------------------
//

export interface RawUpdates {
  [entity: string]: {
    [id: string]: any
  }
}

export interface Joins {
  [id: string]: Joins
}

export interface GetRawUpdatesPayload {
  datasource: Datasource
  entity: Entity
  joins: Joins
  data: any
  previous: any
}

export function getRawUpdates(payload: GetRawUpdatesPayload, _result: RawUpdates = {}): RawUpdates {
  const { entity, data } = payload
  const rawEntity = getRawEntity(entity)
  const { _id, ...rest } = data
  let result = _result
  result = immutable.set(result, rawEntity + "." + _id, { ...rest })

  // this is for joins of type "Post.ID == PostTag.postId"
  result = markJoinEntitiesToRemove(payload, result)

  // compute added/updated join values
  result = computeInverseJoinValues(payload, result)

  return result
}

//
// --------------------------------------------
//
