import Kensington from './kensington.js';

export default Kensington;

// The pure annotation below lets bundlers drop the Kensington class for consumers who only
// import the named exports. Combined with `"sideEffects": false` in package.json, an unused
// `t` removes the class and its transitive imports.
export const t = /* @__PURE__ */ new Kensington();
