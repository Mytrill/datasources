import { expect } from "chai"

import { Datasource } from "./Datasource"
import { MemoryAdapter } from "./MemoryAdapter"

function createDatasource() {
  const result = new Datasource(
    new MemoryAdapter({
      users: {
        u1: { name: "User 1" },
      },
    })
  )

  result.register({
    id: "User",
    type: { id: "document", collection: "users" },
    attributes: [],
    restrictions: [],
    rules: {},
  })

  return result
}

describe("Datasource", function () {
  it("Works with basic entities", async function () {
    const datasource = createDatasource()
    const result = await datasource.get("User", "u1")

    // console.log(JSON.stringify(result, null, 2))
    expect(result).to.deep.equal({
      _id: "u1",
      name: "User 1",
    })
  })
})
