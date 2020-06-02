import { Entity } from "./Entity"
import { StringMap } from "./types"

//
// -----------------------------------------------------
//

export interface DatasourceAdapter {}

//
// -----------------------------------------------------
//

export class Datasource {
  private entities: StringMap<Entity>

  constructor(private adapter: DatasourceAdapter) {}

  register(entity: Entity) {
    if (this.entities[entity.id]) {
      throw new Error(`Entity ${entity.id} already exists in datasource.`)
    }

    this.entities[entity.id] = entity
  }

  getEntity(id: string) {
    const result = this.entities[id]
    if (!result) throw new Error(`No entity with id "${id}" in datasource.`)

    return result
  }
}
