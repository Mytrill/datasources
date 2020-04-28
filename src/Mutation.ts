import { StringMap } from "./types"

//
// --------------------------------------------
//

export interface ObjectMutation {
  type: "object"
  attributes: StringMap<Mutation>

  // TODO
}

export interface RenameAttributesMutation {
  type: "rename"
  attributes: StringMap<string>
}

export interface MergeAttributeMutation {
  type: "merge"
  // TODO
}

export interface SplitAttributeMutation {
  type: "split"
  // TODO
}

export interface ToMapMutation {
  type: "to-map"
  // TODO
}

export interface ToArrayMutation {
  type: "to-array"
  // TODO
}

export type Mutation =
  | RenameAttributesMutation
  | MergeAttributeMutation
  | SplitAttributeMutation
  | ToMapMutation
  | ToArrayMutation
