//
// --------------------------------------------
//

import { Datasource, Entity, EntityJoin } from "../Datasource"

export interface Joins {
  [id: string]: Joins
}

export function getJoins(joinsToFetch: Joins): string[] {
  const result: string[] = []

  for (const join of Object.keys(joinsToFetch)) {
    const nested = getJoins(joinsToFetch[join])
    if (nested.length === 0) {
      result.push(join)
    } else {
      nested.forEach((n) => {
        result.push(join + "." + n)
      })
    }
  }

  return result
}

//
// --------------------------------------------
//

export function getJoin(entity: Entity, id: string): EntityJoin {
  for (const join of entity.joins || []) {
    if (join.id === id) return join
  }
  return null
}

//
// --------------------------------------------
//

export function getJoinsToFetch(datasource: Datasource, entity: Entity, joins: string[], result: Joins = {}): Joins {
  for (const joinId of joins) {
    const [segment, ...rest] = joinId.split(".")
    if (segment === "*") {
      for (const entityJoinId of Object.keys(entity.joins || {})) {
        const join = getJoin(entity, entityJoinId)
        const target = datasource.getEntity(join.target)
        if (!target)
          throw new Error(
            `Entity ${join.target} does not targeted by join ${entityJoinId} from entity ${entity.id} does not exist.`
          )

        result[entityJoinId] = result[entityJoinId] || {}

        if (rest.length > 0) {
          getJoinsToFetch(datasource, target, [rest.join(".")], result[segment])
        }
      }
    } else {
      const join = getJoin(entity, segment)
      if (!join) throw new Error(`Entity ${entity.id} does not have any join with id "${segment}".`)
      const target = datasource.getEntity(join.target)
      if (!target)
        throw new Error(
          `Entity ${join.target} does not targeted by join ${segment} from entity ${entity.id} does not exist.`
        )

      result[segment] = result[segment] || {}

      if (rest.length > 0) {
        getJoinsToFetch(datasource, target, [rest.join(".")], result[segment])
      }
    }
  }

  return result
}
