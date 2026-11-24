import { app } from '../src/app';
import { env } from '../src/config/env';
import { assertSafeTestDatabase } from './database-safety.cjs';

assertSafeTestDatabase(process.env, true);
app.listen(env.PORT, '127.0.0.1', () => console.log('Isolated browser API ready on port 4100'));
