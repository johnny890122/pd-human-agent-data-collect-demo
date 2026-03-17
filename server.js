import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs, resolvers } from './backend/graphql/index.js';
import { connectToDatabase, isDbConfigured } from './backend/db.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  if (isDbConfigured()) {
    try {
      await connectToDatabase();
      console.log('Connected to MongoDB.');
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
    }
  } else {
    console.warn('MONGODB_URI is not configured. Persistence GraphQL resolvers will return an error.');
  }

  await apolloServer.start();

  app.use(express.json());
  app.use('/graphql', expressMiddleware(apolloServer));

  // Serve static files from the dist directory when running the production bundle.
  app.use(express.static(path.join(__dirname, 'dist')));

  // Send all non-API requests to index.html to support client-side routing.
  app.get(new RegExp('^(?!/graphql).*$'), (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
