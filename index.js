const { createServer } = require("node:http");
const { createYoga } = require("graphql-yoga");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { PubSub } = require("graphql-subscriptions");
const { v4: uuidv4 } = require("uuid");

const { users, events, locations, participants } = require("./data.json");

let userList = [...users];
let eventList = [...events];
let locationList = [...locations];
let participantList = [...participants];

const typeDefs = `
  type User {
    id: ID!
    username: String!
    email: String!
    events: [Event!]
  }

  input CreateUserInput {
    username: String!
    email: String!
  }

  input UpdateUserInput {
    username: String
    email: String
  }

  type Event {
    id: ID!
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!
    user: User!
    location: Location!
    participants: [Participant!]
  }

  input CreateEventInput {
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!
    user_id: ID!
    location_id: ID!
  }

  input UpdateEventInput {
    title: String
    desc: String
    date: String
    from: String
    to: String
    user_id: ID
    location_id: ID
  }

  type Location {
    id: ID!
    name: String!
    desc: String!
    lat: Float!
    lng: Float!
    events: [Event!]
  }

  input CreateLocationInput {
    name: String!
    desc: String!
    lat: Float!
    lng: Float!
  }

  input UpdateLocationInput {
    name: String
    desc: String
    lat: Float
    lng: Float
  }

  type Participant {
    id: ID!
    user: User!
    event: Event!
  }

  input CreateParticipantInput {
    user_id: ID!
    event_id: ID!
  }

  input UpdateParticipantInput {
    user_id: ID
    event_id: ID
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    events: [Event!]!
    event(id: ID!): Event
    locations: [Location!]!
    location(id: ID!): Location
    participants: [Participant!]!
    participant(id: ID!): Participant
  }

  type Mutation {
    addUser(data: CreateUserInput!): User
    updateUser(id: ID!, data: UpdateUserInput!): User
    deleteUser(id: ID!): User
    deleteAllUsers: [User!]!

    addEvent(data: CreateEventInput!): Event
    updateEvent(id: ID!, data: UpdateEventInput!): Event
    deleteEvent(id: ID!): Event
    deleteAllEvents: [Event!]!

    addLocation(data: CreateLocationInput!): Location
    updateLocation(id: ID!, data: UpdateLocationInput!): Location
    deleteLocation(id: ID!): Location
    deleteAllLocations: [Location!]!

    addParticipant(data: CreateParticipantInput!): Participant
    updateParticipant(id: ID!, data: UpdateParticipantInput!): Participant
    deleteParticipant(id: ID!): Participant
    deleteAllParticipants: [Participant!]!
  }

  type Subscription {
    count: Int!
  }
`;

const resolvers = {
  Subscription: {
    count: {
      subscribe: async function* (_, __, { pubsub }) {
        let count = 0;
        while (true) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          count++;
          yield { count };
        }
      },
    },
  },
  Query: {
    users: () => userList,
    user: (_, { id }) => userList.find((u) => u.id === id),

    events: () => eventList,
    event: (_, { id }) => eventList.find((e) => e.id === id),

    locations: () => locationList,
    location: (_, { id }) => locationList.find((l) => l.id === id),

    participants: () => participantList,
    participant: (_, { id }) => participantList.find((p) => p.id === id),
  },

  Mutation: {
    addUser: (_, { data }) => {
      const newUser = { id: uuidv4(), ...data };
      userList.push(newUser);
      return newUser;
    },
    updateUser: (_, { id, data }) => {
      const idx = userList.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("User not found");
      userList[idx] = { ...userList[idx], ...data };
      return userList[idx];
    },
    deleteUser: (_, { id }) => {
      const idx = userList.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("User not found");
      const deleted = userList[idx];
      userList.splice(idx, 1);
      return deleted;
    },
    deleteAllUsers: () => {
      const deleted = [...userList];
      userList = [];
      return deleted;
    },

    addEvent: (_, { data }) => {
      const newEvent = { id: uuidv4(), ...data };
      eventList.push(newEvent);
      return newEvent;
    },
    updateEvent: (_, { id, data }) => {
      const idx = eventList.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error("Event not found");
      eventList[idx] = { ...eventList[idx], ...data };
      return eventList[idx];
    },
    deleteEvent: (_, { id }) => {
      const idx = eventList.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error("Event not found");
      const deleted = eventList[idx];
      eventList.splice(idx, 1);
      return deleted;
    },
    deleteAllEvents: () => {
      const deleted = [...eventList];
      eventList = [];
      return deleted;
    },

    addLocation: (_, { data }) => {
      const newLoc = { id: uuidv4(), ...data };
      locationList.push(newLoc);
      return newLoc;
    },
    updateLocation: (_, { id, data }) => {
      const idx = locationList.findIndex((l) => l.id === id);
      if (idx === -1) throw new Error("Location not found");
      locationList[idx] = { ...locationList[idx], ...data };
      return locationList[idx];
    },
    deleteLocation: (_, { id }) => {
      const idx = locationList.findIndex((l) => l.id === id);
      if (idx === -1) throw new Error("Location not found");
      const deleted = locationList[idx];
      locationList.splice(idx, 1);
      return deleted;
    },
    deleteAllLocations: () => {
      const deleted = [...locationList];
      locationList = [];
      return deleted;
    },

    addParticipant: (_, { data }) => {
      const newPart = { id: uuidv4(), ...data };
      participantList.push(newPart);
      return newPart;
    },
    updateParticipant: (_, { id, data }) => {
      const idx = participantList.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Participant not found");
      participantList[idx] = { ...participantList[idx], ...data };
      return participantList[idx];
    },
    deleteParticipant: (_, { id }) => {
      const idx = participantList.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Participant not found");
      const deleted = participantList[idx];
      participantList.splice(idx, 1);
      return deleted;
    },
    deleteAllParticipants: () => {
      const deleted = [...participantList];
      participantList = [];
      return deleted;
    },
  },

  User: {
    events: (parent) => eventList.filter((e) => e.user_id === parent.id),
  },
  Event: {
    user: (parent) => userList.find((u) => u.id === parent.user_id),
    location: (parent) => locationList.find((l) => l.id === parent.location_id),
    participants: (parent) =>
      participantList.filter((p) => p.event_id === parent.id),
  },
  Location: {
    events: (parent) => eventList.filter((e) => e.location_id === parent.id),
  },
  Participant: {
    user: (parent) => userList.find((u) => u.id === parent.user_id),
    event: (parent) => eventList.find((e) => e.id === parent.event_id),
  },
};

const pubsub = new PubSub();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  context: () => ({ pubsub }),
  graphqlEndpoint: "/",
});

const server = createServer(yoga);

server.listen(4000, () => {
  console.log("✅ Server is running at http://localhost:4000");
});
