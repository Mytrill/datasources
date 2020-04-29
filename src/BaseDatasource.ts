import * as immutable from "dot-prop-immutable"

import * as t from "./Datasource"
import { StringMap } from "./types"
import { fetchJoins } from "./utils/fetchJoins"
import { getJoin, getJoinsToFetch } from "./utils/joins"

export abstract class BaseDatasource implements t.Datasource {
  private entities: StringMap<t.Entity> = {}

  constructor(public id: string) {}

  registerEntity(entity: t.Entity) {
    this.entities[entity.id] = entity
  }

  getEntity(entity: string, strict?: boolean) {
    const result = this.entities[entity]
    if (strict && !result) {
      throw new Error(`No entity with id="${entity}" registered in datasource="${this.id}"`)
    }
    return result
  }

  abstract executeRawGet(rawEntity: string, id: string): Promise<any>

  async executeGet<T>(request: t.GetRequest): Promise<t.GetResponse<T>> {
    const entity = this.getEntity(request.entity, true)
    const rawEntity = (entity.source && entity.source.entity) || entity.id
    const _id = request.id || (entity.source && entity.source.id)
    if (!_id) {
      throw new Error(`You must specify an id in the request, or have an id in the entity's source`)
    }

    const raw = await this.executeRawGet(rawEntity, _id)
    if (!raw) return { data: raw, cache: {} }

    const cache: any = {}
    const data = { ...raw, _id }
    if (request.joins) {
      const joins = getJoinsToFetch(this, entity, request.joins)
      const values = await fetchJoins({
        datasource: this,
        entity,

        data,
        joinsToFetch: joins,
        cache,
      })

      for (const joinId of Object.keys(values)) {
        const join = getJoin(entity, joinId)
        data[join.as || join.id] = values[joinId]
      }
    }

    if (entity.mutations) {
      // TODO
    }

    return {
      data,
      cache,
    }
  }

  abstract executeRawQuery(rawEntity: string, query?: t.EntityQuery | string): Promise<t.DatasourceObject[]>

  async executeQuery<T>(request: t.QueryRequest): Promise<t.QueryResponse<T>> {
    const entity = this.getEntity(request.entity, true)
    const rawEntity = (entity.source && entity.source.entity) || entity.id

    let cache: any = request.joins || {}
    const results = await this.executeRawQuery(rawEntity, request.query)
    const data = results.map((result) => {
      const value = { ...result }
      cache = immutable.set(cache, [rawEntity, result._id], value)
      return value
    })

    if (request.joins) {
      const joins = getJoinsToFetch(this, entity, request.joins)
      // TODO fetch join
    }

    if (entity.mutations) {
      // TODO
    }

    return {
      data,
      cache,
    }
  }

  async executeSet<T>(request: t.SetRequest): Promise<t.SetResponse<T>> {
    return null
  }

  execute(request: t.DatasourceRequest): Promise<any> {
    switch (request.type) {
      case "get":
        return this.executeGet(request)
      case "set":
        return this.executeSet(request)
      case "query":
        return this.executeQuery(request)
    }
  }
}
