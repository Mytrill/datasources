import { Entity } from "./Entity"
import { StringMap } from "./types"

//
// -----------------------------------------------------
//

export interface DatasourceAdapter {
  get(collection: string, id: string): Promise<any>
}

//
// -----------------------------------------------------
//

export interface GetOptions {
  userId?: string
}

export class Datasource {
  private entities: StringMap<Entity> = {}
  private userEntityId: string = null

  constructor(private adapter: DatasourceAdapter) {}

  register(entity: Entity) {
    if (this.entities[entity.id]) {
      throw new Error(`Entity ${entity.id} already exists in datasource.`)
    }
    if (entity.type.id === "user") {
      if (this.userEntityId) {
        throw new Error(`Already a user entity (id="${this.userEntityId}") registed with this datasource`)
      }
      this.userEntityId = entity.id
    }

    this.entities[entity.id] = entity
  }

  getEntity(id: string) {
    const result = this.entities[id]
    if (!result) throw new Error(`No entity with id "${id}" in datasource.`)

    return result
  }

  private getRootEntity(entity: Entity): Entity {
    let result = entity

    while (entity.type.id === "embedded") {
      result = this.getEntity(entity.type.entity)
    }

    return entity
  }

  private getCollection(entity: Entity): string {
    const root = this.getRootEntity(entity)
    return (root.type as any).collection
  }

  private async checkSecurity(entity: Entity, { userId }: GetOptions) {
    if (!userId || !entity.rules.read) return true
    if (!this.userEntityId || !this.entities[this.userEntityId]) throw new Error("No user entity.")

    const userEntity = this.entities[this.userEntityId]
  }

  async get<T>(entityId: string, id: string, options: GetOptions = {}): Promise<T> {
    const entity = this.getEntity(entityId)
    const root = this.getRootEntity(entity)

    // TODO check security

    const raw = await this.adapter.get(this.getCollection(root), id)

    if (!raw) {
      return raw
    }
    const result = { ...raw }
    result._id = id

    return result
  }
}
