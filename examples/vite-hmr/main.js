import counter from './src/counter.js';

document.querySelector('#app').append(counter({ start: 0 }).toElement());
