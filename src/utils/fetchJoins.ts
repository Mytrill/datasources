import { ID, ITEMS } from "../constants"
import {
    AttributeQuery, Datasource, DatasourceData, DatasourceObject, Entity, EntityQuery
} from "../Datasource"
import { StringMap } from "../types"
import { getJoin, getJoins, Joins } from "./joins"

//
// --------------------------------------------
//

function getSourceValue(data: DatasourceObject, source: string): any {
  if (source == ID) return data._id

  const segments = source.split(".")
  let result: any = data
  for (const segment of segments) {
    if (segment !== ITEMS) {
      if (Array.isArray(result)) {
        result = result
          .map((item) => {
            if (item && typeof item === "object") {
              return item[segment]
            } else {
              return undefined
            }
          })
          .filter((item) => item !== undefined)
      } else if (typeof result === "object" && result) {
        result = result[segment]
      } else {
        return undefined
      }
    }
  }

  return result
}

//
// --------------------------------------------
//

interface FetchJoinPayload {
  datasource: Datasource
  cache: DatasourceData

  entity: Entity
  data: DatasourceObject

  joinId: string
  joinsToFetch: Joins
}

async function fetchJoin(payload: FetchJoinPayload): Promise<DatasourceObject | DatasourceObject[]> {
  const { datasource, data, entity, joinId, joinsToFetch, cache } = payload
  const join = getJoin(entity, joinId)
  if (!join) throw new Error(`No join with id ${joinId} in entity ${entity.id}`)
  const target = datasource.getEntity(join.target)

  const _query: EntityQuery = {}
  const joins = getJoins(joinsToFetch)

  const attr = join.attributes
  const value = getSourceValue(data, attr.source)

  if (attr.target !== ID) {
    _query.attributes = _query.attributes || []
    const attrQuery: AttributeQuery = {
      attribute: attr.target,
      value: value,
    }

    if (attr.target.endsWith("." + ITEMS)) {
      attrQuery.attribute = attr.target.substr(0, attr.target.length - ITEMS.length - 1)
      attrQuery.operand = "contains"
    }
    _query.attributes.push(attrQuery)
  } else if (typeof value === "string" || Array.isArray(value)) {
    _query.id = value as string
  } else {
    console.error(`Got value type ${typeof value} for ID attribute.`)
  }

  const result = await datasource.execute({
    type: "query",
    entity: target.id,
    query: _query,
    joins,
    cache,
  })

  if (join.cardinality === "one") {
    return result.data.length === 0 ? undefined : result.data[0]
  }

  return result.data
}

//
// --------------------------------------------
//

export interface FetchJoinsPayload {
  datasource: Datasource
  cache: DatasourceData

  entity: Entity
  data: DatasourceObject

  joinsToFetch: Joins
}

export async function fetchJoins(payload: FetchJoinsPayload): Promise<StringMap<any>> {
  const { datasource, cache, joinsToFetch, entity, data } = payload

  const joinIds = Object.keys(joinsToFetch)
  const results = await Promise.all(
    joinIds.map((joinId) =>
      fetchJoin({
        datasource,
        cache,

        entity,
        data,

        joinId,
        joinsToFetch: joinsToFetch[joinId],
      })
    )
  )

  const result: StringMap<any> = {}
  joinIds.forEach((joinId, index) => {
    result[joinId] = results[index]
  })

  return result
}
