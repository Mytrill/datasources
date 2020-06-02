import { DatasourceAdapter } from "./Datasource"

export interface MemoryData {
  [collection: string]: {
    [id: string]: any
  }
}

export class MemoryAdapter implements DatasourceAdapter {
  constructor(private data: MemoryData) {}

  async get(collection: string, id: string) {
    return (this.data[collection] || {})[id]
  }
}
