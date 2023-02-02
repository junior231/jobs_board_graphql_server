import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import express from "express";
import { readFile } from "fs/promises";
import { expressjwt } from "express-jwt";
import jwt from "jsonwebtoken";
import { User } from "./db.js";
import { resolvers } from "./resolvers.js";

const PORT = process.env.PORT || 9000;
const JWT_SECRET = Buffer.from("Zn8Q5tyZ/G1MHltc4F/gTkVJMlrbKiZt", "base64");

const app = express();
app.use(
  cors(),
  express.json(),
  expressjwt({
    algorithms: ["HS256"],
    credentialsRequired: false,
    secret: JWT_SECRET,
  })
);

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne((user) => user.email === email);
  if (user && user.password === password) {
    const token = jwt.sign({ sub: user.id }, JWT_SECRET);
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

// create typeDefs
const typeDefs = await readFile("./schema.graphql", "utf-8");

// create context
const context = async ({ req }) => {
  if (req.auth) {
    // if request is authorized find user by id
    const user = await User.findById(req.auth.sub);
    return { user };
  }
  return {};
};

// create apollo server
const apolloServer = new ApolloServer({ typeDefs, resolvers, context });

// apolloServer.start is async so we await its promise
await apolloServer.start();

// plug apolloserver to express.js app and handle every request to /graphql endpoint
apolloServer.applyMiddleware({ app, path: "/graphql" });

app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});
