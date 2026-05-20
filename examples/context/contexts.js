import { createContext } from './create-context.js';

export const ThemeContext = createContext('light');
export const UserContext = createContext({ name: 'Guest', role: 'viewer' });
