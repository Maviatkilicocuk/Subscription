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
    #User
    userCreated: User!
    userUpdated: User!
    userDeleted: User!

    #Event
    eventCreated: Event!
    eventUpdated: Event!
    eventDeleted: Event!

    #Participant
    participantCreated: Participant!
    participantUpdated: Participant!
    participantDeleted: Participant!
  }
`;

const pubsub = new PubSub();
const USER_CREATED = "USER_CREATED";
const USER_UPDATED = "USER_UPDATED";
const USER_DELETED = "USER_DELETED";

const EVENT_CREATED = "EVENT_CREATED";
const EVENT_UPDATED = "EVENT_UPDATED";
const EVENT_DELETED = "EVENT_DELETED";

const PARTICIPANT_CREATED = "PARTICIPANT_CREATED";
const PARTICIPANT_UPDATED = "PARTICIPANT_UPDATED";
const PARTICIPANT_DELETED = "PARTICIPANT_DELETED";

const resolvers = {
  Subscription: {
    //USER
    userCreated: {
      subscribe: () => pubsub.asyncIterator([USER_CREATED]),
    },
    userUpdated: {
      subscribe: () => pubsub.asyncIterator([USER_UPDATED]),
    },
    userDeleted: {
      subscribe: () => pubsub.asyncIterator([USER_DELETED]),
    },

    //Event
    eventCreated: {
      subscribe: () => pubsub.asyncIterator([EVENT_CREATED]),
    },
    eventUpdated: {
      subscribe: () => pubsub.asyncIterator([EVENT_UPDATED]),
    },
    eventDeleted: {
      subscribe: () => pubsub.asyncIterator([EVENT_DELETED]),
    },

    //Participant
    participantCreated: {
      subscribe: () => pubsub.asyncIterator([PARTICIPANT_CREATED]),
    },
    participantUpdated: {
      subscribe: () => pubsub.asyncIterator([PARTICIPANT_UPDATED]),
    },
    participantDeleted: {
      subscribe: () => pubsub.asyncIterator([PARTICIPANT_DELETED]),
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
      pubsub.publish(USER_CREATED, { userCreated: newUser });
      return newUser;
    },
    updateUser: (_, { id, data }) => {
      const idx = userList.findIndex((u) => String(u.id) === String(id));
      if (idx === -1) throw new Error("User not found");
      userList[idx] = { ...userList[idx], ...data };
      pubsub.publish(USER_UPDATED, { userUpdated: userList[idx] });
      return userList[idx];
    },
    deleteUser: (_, { id }) => {
      const idx = userList.findIndex((u) => String(u.id) === String(id));
      if (idx === -1) throw new Error("User not found");
      const deleted = userList[idx];
      userList.splice(idx, 1);
      pubsub.publish(USER_DELETED, { userDeleted: deleted });
      return deleted;
    },
    deleteAllUsers: () => {
const deleted = [...userList];
userList = [];
deleted.forEach(user => {
  pubsub.publish(USER_DELETED, { userDeleted: user });
});
return deleted;
    },

    addEvent: (_, { data }) => {
      const newEvent = { id: uuidv4(), ...data };
      eventList.push(newEvent);
      pubsub.publish(EVENT_CREATED, { eventCreated: newEvent });
      return newEvent;
    },
    updateEvent: (_, { id, data }) => {
      const idx = eventList.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error("Event not found");
      eventList[idx] = { ...eventList[idx], ...data };
      pubsub.publish(EVENT_UPDATED, { eventUpdated: eventList[idx] });
      return eventList[idx];
    },
    deleteEvent: (_, { id }) => {
      const idx = eventList.findIndex((u) => String(u.id) === String(id));
      if (idx === -1) throw new Error("Event not found");
      const deleted = eventList[idx];
      eventList.splice(idx, 1);
      pubsub.publish(EVENT_DELETED, { eventDeleted: deleted });
      return deleted;
    },
    deleteAllEvents: () => {
      const deleted = [...eventList];
      eventList = [];
      eventList.forEach(event => {
  pubsub.publish(EVENT_DELETED, { eventDeleted: event });
});
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
      pubsub.publish(PARTICIPANT_CREATED, { participantCreated: newPart });
      return newPart;
    },
    updateParticipant: (_, { id, data }) => {
      const idx = participantList.findIndex((p) => String(p.id) === numericId);
      if (idx === -1) throw new Error("Participant not found");
      participantList[idx] = { ...participantList[idx], ...data };
      pubsub.publish(PARTICIPANT_UPDATED, { participantUpdated: participantList[idx] });
      return participantList[idx];
    },
    deleteParticipant: (_, { id }) => {
      const idx = participantList.findIndex((p) => p.id === String(id));
      if (idx === -1) throw new Error("Participant not found");
      const deleted = participantList[idx];
      participantList.splice(idx, 1);
      pubsub.publish(PARTICIPANT_DELETED, { participantDeleted: deleted });
      return deleted;
    },
deleteAllParticipants: () => {
  const deleted = [...participantList];
  participantList = [];
  deleted.forEach(participant => {
    pubsub.publish(PARTICIPANT_DELETED, { participantDeleted: participant });
  });
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
