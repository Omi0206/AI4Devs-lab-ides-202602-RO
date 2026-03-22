import 'dotenv/config';
import { createApp } from './app';
import { getPort } from './config/env';
import { prisma } from './infrastructure/prismaClient';

const app = createApp(prisma);
const port = getPort();

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
