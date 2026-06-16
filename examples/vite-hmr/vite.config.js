import { kensingtonHmr } from 'kensington/vite';

export default {
  plugins: [
    kensingtonHmr({ include: 'src/**/*.js' }),
  ],
};
