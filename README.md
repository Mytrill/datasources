# datasources

TODO

# Example Applications

## Example 1

### Entities

#### User

- email (private)
- name (public)
- isAdmin (boolean)

#### Project

- name (public)
- text (public if published)
- isPublished (boolean, once published, project public + readonly for non-admins)
- members (semi private, members decide if they are private or public)

#### Project Member

- project
- user
- role ("admin", "writer", "reader", "invitation-pending")
- canPublish (boolean)

### Security

#### App

**Roles**

- admin: can do anything on all projects, can promote/revoke admins
- user: logged in user
- guest: not logged in

#### Project

**Roles**

- project.admin: can do anything on project
- project.writer: can edit text
- project.publisher: can publish
- project.applicant: applied to an open project, can only cancel application
- project.invited: invited to a project, can only accept/refuse
- project.reader: can see project + members

**Views**

#### Members

**Roles**

??

### Views

#### Project

- published projects: isPublished == true, attributes: name, text
- draft project: isPublished == false - attribute: all

#### Member

- Publisher
- Invitation
- Reader
- Writer
- Admin

### Actions

- publish project
- unpublish project
- invite to project
- accept invitation
- refuse invitation

### Project

|                   | guest | user |  admin | writer | publisher     | reader | pending |
| ----------------- | ----- | ---- | ------ | ------ | ------------- | ------ | ------- |
| published project |       | view | all    | view   | view          | view   | view    |
| draft project     |       |      | all    | all    | view, publish | view   |         |

### Test Entities

```ts
// TODO nested entities VS type = "embedded"...
// TODO access roles of outer entities in nested entities...
// TODO server-only attributes

const User: Entity = {
  type: user(),
  attributes: {
    email: string({ format: "email", required: true, read: "user.isAdmin || user == document" }),
    firstName: string({ required: true }),
    lastName: string({ required: true }),
    nickName: string({ required: true }),
    keywords: keywords({ attributes: ["firstName", "lastName", "nickName"] })
    keywordsAdmin: keywords({ attributes: ["firstName", "lastName", "nickName", "email"], query: "user.isAdmin" })
    isAdmin: boolean({ write: "user.isAdmin" }),
    isPublic: boolean(),
    memberships: entityMap({ entity: "Member", attributes: ["project.name", "role"], key: "project" })
  },
  rules: {
    read: "user.isAdmin || user == document || (user != null && document.isPublic)",
    write: "user.isAdmin || user == document",
  },
}

const Project: Entity = {
  type: document()
  attributes: {
    name: string({ required: true }),
    keywords: keywords({ attributes: ["name"] }),
    // only publisher can publish, only admins can publish/unpublish
    isPublished: boolean({ write: "user.isAdmin || (roles.publisher && !document.isPublished)" }),
    // TODO security rules for this
    members: entityMap({ entity: "Member", attributes: "*", key: "user" }),
    // lazy: true means only sent when actually requested
    "rules.admin": boolean({ value: "document.members[user].role == 'admin' || user.isAdmin", lazy: true }),
    "rules.writer": boolean({ value: "document.members[user].role == 'writer' || document.roles.admin", lazy: true }),
    "rules.reader": boolean({ value: "document.members[user].role == 'writer' || document.roles.writer", lazy: true }),
    "rules.pending": boolean({ value: "document.members[user].role == 'invitation-pending'", lazy: true }),
    "rules.refused": boolean({ value: "document.members[user].role == 'invitation-refused'", lazy: true }),
    "rules.publisher": boolean({ value: "document.members[user].canPublish", lazy: true }),
  },
  rules: {
    read: "user.isAdmin || document.published || document.rules.reader",
    write: "user.isAdmin || (document.rules.writer && !document.isPublished)",
  }
}

const Member: Entity = {
  type: embedded("Project")
  attributes: {
    project: entity({ entity: "Project" inverseOf: "members", write: false }),
    user: entity({ entity: "User", inverseOf: "memberships", attributes: ["name"], write: false }),
    role: enum({ values: ["admin", "reader", "writer", "invitation-pending", "invitation-refused"], default: "invitation-pending", write: "rules.admin" }),
    canPublish: boolean({ default: false }),
  },
  rules: {
    // everyone in the project can read
    read: "document.project.roles.reader",
    // only admins can create, project admins create Invitation...
    create: "user.isAdmin",
    // can only update your own
    update: "user.isAdmin || user == document.user",
  },
  restrictions: [
    {
      id: "Invitation",
      transitions: { to: ["Invitation.Accepted"] },
      attributes: {
        project: true,
        user: true,
        role: value("invitation-pending"),
        canPublish: value(false)
      },
      rules: {
        // only admins can invite other users
        create: "document.rules.admin"
      }
    },
    {
      id: "Invitation.Accepted",
      transitions: { from: ["Invitation"] }
      attributes: {
        project: true,
        user: true,
        role: value("reader"),
        canPublish: value(false),
        // something like this...
        acceptedAt: value(SERVER_TIMESTAMP)
      }
    }
  ]
}
```

## License

MIT
