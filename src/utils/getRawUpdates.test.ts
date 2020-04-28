import { expect } from "chai"

import { Datasource, Entity, ID } from "../Datasource"
import { getRawUpdates, Joins } from "./getRawUpdates"

//
// --------------------------------------------
//

class TestDatasource implements Datasource {
  constructor(private entities: Entity[], public id = "Test Datasource") {}

  getEntity(entity: string): Entity {
    for (const result of this.entities) {
      if (result.id === entity) {
        return result
      }
    }

    throw new Error(`No entity with id="${entity}" registered in this datasource.`)
  }

  execute(): any {
    throw new Error("Not implemented")
  }
}

//
// --------------------------------------------
//

describe("getRawUpdates", function () {
  it('Works with joins of type "Post.ID == Tag.postId", persist = false', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      { id: "Post", joins: [{ id: "tags", target: "Tag", attributes: { source: ID, target: "postId" } }] },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tags: {} }
    const data = { _id: "p1", name: "Post 1", tags: [{ _id: "t2", name: "Tag 2", postId: "p1" }] }
    const previous = { _id: "p1", name: "Post 1", tags: [{ _id: "t1", name: "Tag 1", postId: "p1" }] }

    const result = getRawUpdates({ datasource, entity, joins, data, previous })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).to.deep.equal({
      Post: {
        p1: {
          name: "Post 1",
        },
      },
      Tag: {
        t1: "_delete",
        t2: {
          name: "Tag 2",
          postId: "p1",
        },
      },
    })
  })

  it('Works with joins of type "Post.ID == Tag.postId", persist = true', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      {
        id: "Post",
        joins: [{ id: "tags", target: "Tag", attributes: { source: ID, target: "postId" }, persist: true }],
      },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tags: {} }
    const data = { _id: "p1", name: "Post 1", tags: [{ _id: "t2", name: "Tag 2", postId: "p1" }] }
    const previous = { _id: "p1", name: "Post 1", tags: [{ _id: "t1", name: "Tag 1", postId: "p1" }] }

    const result = getRawUpdates({ datasource, entity, joins, data, previous })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).to.deep.equal({
      Post: {
        p1: { name: "Post 1", tags: [{ _id: "t2", name: "Tag 2", postId: "p1" }] },
      },
      Tag: {
        t1: "_delete",
        t2: { name: "Tag 2", postId: "p1" },
      },
    })
  })

  it('Works with joins of type "Post.ID in Tag.posts", persist = false', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      { id: "Post", joins: [{ id: "tags", target: "Tag", attributes: { source: ID, op: "in", target: "posts" } }] },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tags: {} }
    const data = { _id: "p1", name: "Post 1", tags: [{ _id: "t2", name: "Tag 2", posts: ["p1", "p2"] }] }
    const previous = { _id: "p1", name: "Post 1", tags: [{ _id: "t1", name: "Tag 1", posts: ["p1", "p3"] }] }

    const result = getRawUpdates({ datasource, entity, joins, data, previous })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).to.deep.equal({
      Post: {
        p1: { name: "Post 1" },
      },
      Tag: {
        t1: { _id: "t1", name: "Tag 1", posts: ["p3"] },
        t2: { name: "Tag 2", posts: ["p1", "p2"] },
      },
    })
  })

  it('Works with joins of type "Post.ID in Tag.posts", persist = true', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      {
        id: "Post",
        joins: [{ id: "tags", target: "Tag", attributes: { source: ID, op: "in", target: "posts" }, persist: true }],
      },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tags: {} }
    const data = { _id: "p1", name: "Post 1", tags: [{ _id: "t2", name: "Tag 2", posts: ["p1", "p2"] }] }
    const previous = { _id: "p1", name: "Post 1", tags: [{ _id: "t1", name: "Tag 1", posts: ["p1", "p3"] }] }

    const result = getRawUpdates({ datasource, entity, joins, data, previous })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).to.deep.equal({
      Post: {
        p1: { name: "Post 1", tags: [{ _id: "t2", name: "Tag 2", posts: ["p1", "p2"] }] },
      },
      Tag: {
        t1: { _id: "t1", name: "Tag 1", posts: ["p3"] },
        t2: { name: "Tag 2", posts: ["p1", "p2"] },
      },
    })
  })

  it('Works with joins of type "Post.tag == Tag.ID", cardinality = "one", persist = false', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      {
        id: "Post",
        joins: [{ id: "tag", target: "Tag", attributes: { source: "tagId", target: ID }, cardinality: "one" }],
      },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tag: {} }
    const data = { _id: "p1", name: "Post 1", tag: { _id: "t2", name: "Tag 2", postId: "p1" } }

    const result = getRawUpdates({ datasource, entity, joins, data, previous: {} })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).deep.equal({
      Post: {
        p1: {
          name: "Post 1",
          tagId: "t2",
        },
      },
    })
  })

  it('Works with joins of type "Post.tag._id == Tag.ID", cardinality = "one", persist = true', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      {
        id: "Post",
        joins: [
          {
            id: "tag",
            target: "Tag",
            attributes: { source: "tag._id", target: ID },
            cardinality: "one",
            persist: true,
          },
        ],
      },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tag: {} }
    const data = { _id: "p1", name: "Post 1", tag: { _id: "t2", name: "Tag 2", postId: "p1" } }

    const result = getRawUpdates({ datasource, entity, joins, data, previous: {} })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).deep.equal({
      Post: {
        p1: {
          name: "Post 1",
          tag: {
            _id: "t2",
            name: "Tag 2",
            postId: "p1",
          },
        },
      },
    })
  })

  it('Works with joins of type "Post.tags contains Tag.ID", persist = false', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      {
        id: "Post",
        joins: [{ id: "tags", target: "Tag", attributes: { source: "tags", op: "contains", target: ID } }],
      },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tags: {} }
    const data = { _id: "p1", name: "Post 1", tags: { t2: { _id: "t2", name: "Tag 2", postId: "p1" } } }

    const result = getRawUpdates({ datasource, entity, joins, data, previous: {} })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).deep.equal({
      Post: {
        p1: {
          name: "Post 1",
          tags: ["t2"],
        },
      },
    })
  })

  it('Works with joins of type "Post.tags contains Tag.ID", persist = true', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      {
        id: "Post",
        joins: [
          { id: "tags", target: "Tag", attributes: { source: "tags", op: "contains", target: ID }, persist: true },
        ],
      },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tags: {} }
    const data = { _id: "p1", name: "Post 1", tags: { t2: { _id: "t2", name: "Tag 2", postId: "p1" } } }

    const result = getRawUpdates({ datasource, entity, joins, data, previous: {} })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).deep.equal({
      Post: {
        p1: {
          name: "Post 1",
          tags: [
            {
              _id: "t2",
              name: "Tag 2",
              postId: "p1",
            },
          ],
        },
      },
    })
  })

  it('Works with joins of type "Post.tags contains Tag.ID", persist = { type: "map" }', function () {
    const datasource = new TestDatasource([
      { id: "Tag" },
      {
        id: "Post",
        joins: [
          {
            id: "tags",
            target: "Tag",
            attributes: { source: "tags", op: "contains", target: ID },
            persist: { type: "map" },
          },
        ],
      },
    ])
    const entity = datasource.getEntity("Post")

    const joins: Joins = { tags: {} }
    const data = { _id: "p1", name: "Post 1", tags: { t2: { _id: "t2", name: "Tag 2", postId: "p1" } } }

    const result = getRawUpdates({ datasource, entity, joins, data, previous: {} })
    // console.log("Result: ", JSON.stringify(result, null, 2))
    expect(result).deep.equal({
      Post: {
        p1: {
          name: "Post 1",
          tags: {
            t2: {
              _id: "t2",
              name: "Tag 2",
              postId: "p1",
            },
          },
        },
      },
    })
  })
})
