import { serve } from './serve.js';

const USERS = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'editor' },
  { id: 3, name: 'Carol', role: 'viewer' },
  { id: 4, name: 'Dave', role: 'editor' },
  { id: 5, name: 'Eve', role: 'admin' },
];

serve(3000, (req, res) => {
  const match = req.url.match(/^\/api\/users\/(\d+)$/);
  if (!match) {return false;}
  const user = USERS.find(u => u.id === Number(match[1])) ?? null;
  setTimeout(() => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(user));
  }, 1000);
  return true;
});
