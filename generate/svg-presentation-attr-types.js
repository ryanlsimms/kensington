// Hand-maintained type definitions for SVG presentation attributes.
// Format matches svgAttributes entries: { attribute, value } drives getAttributeType() in parse-data.js.
// <length> / <length-percentage> / <number> signal numeric types; quoted strings signal enums.
export default [
  {
    attribute: 'alignment-baseline',
    value: [
      '"auto"', '"baseline"', '"before-edge"', '"text-before-edge"', '"middle"', '"central"',
      '"after-edge"', '"text-after-edge"', '"ideographic"', '"alphabetic"', '"hanging"', '"mathematical"',
    ],
  },
  { attribute: 'clip-rule', value: ['"nonzero"', '"evenodd"'] },
  { attribute: 'color-interpolation', value: ['"auto"', '"sRGB"', '"linearRGB"'] },
  { attribute: 'color-interpolation-filters', value: ['"auto"', '"sRGB"', '"linearRGB"'] },
  { attribute: 'color-rendering', value: ['"auto"', '"optimizeSpeed"', '"optimizeQuality"'] },
  { attribute: 'direction', value: ['"ltr"', '"rtl"'] },
  {
    attribute: 'dominant-baseline',
    value: [
      '"auto"', '"alphabetic"', '"ideographic"', '"mathematical"', '"central"', '"middle"',
      '"text-after-edge"', '"text-before-edge"', '"hanging"', '"use-script"', '"no-change"', '"reset-size"',
    ],
  },
  { attribute: 'fill-opacity', value: ['<length-percentage>'] },
  { attribute: 'fill-rule', value: ['"nonzero"', '"evenodd"'] },
  { attribute: 'font-size', value: ['<length>'] },
  { attribute: 'font-weight', value: ['<length>'] },
  { attribute: 'image-rendering', value: ['"auto"', '"optimizeSpeed"', '"crisp-edges"', '"pixelated"'] },
  { attribute: 'letter-spacing', value: ['<length>'] },
  { attribute: 'opacity', value: ['<length-percentage>'] },
  { attribute: 'overflow', value: ['"visible"', '"hidden"', '"scroll"', '"auto"'] },
  {
    attribute: 'pointer-events',
    value: [
      '"none"', '"visiblePainted"', '"visibleFill"', '"visibleStroke"', '"visible"',
      '"painted"', '"fill"', '"stroke"', '"all"', '"auto"',
    ],
  },
  { attribute: 'shape-rendering', value: ['"auto"', '"optimizeSpeed"', '"crispEdges"', '"geometricPrecision"'] },
  { attribute: 'stop-opacity', value: ['<length-percentage>'] },
  { attribute: 'stroke-dashoffset', value: ['<length>'] },
  { attribute: 'stroke-linecap', value: ['"butt"', '"round"', '"square"'] },
  {
    attribute: 'stroke-linejoin',
    value: ['"miter"', '"round"', '"bevel"', '"arcs"', '"miter-clip"'],
  },
  { attribute: 'stroke-miterlimit', value: ['<length>'] },
  { attribute: 'stroke-opacity', value: ['<length-percentage>'] },
  { attribute: 'stroke-width', value: ['<length>'] },
  { attribute: 'text-anchor', value: ['"start"', '"middle"', '"end"'] },
  {
    attribute: 'text-rendering',
    value: ['"auto"', '"optimizeSpeed"', '"optimizeLegibility"', '"geometricPrecision"'],
  },
  {
    attribute: 'unicode-bidi',
    value: ['"normal"', '"embed"', '"isolate"', '"bidi-override"', '"isolate-override"', '"plaintext"'],
  },
  {
    attribute: 'vector-effect',
    value: ['"none"', '"non-scaling-stroke"', '"non-scaling-size"', '"non-rotation"', '"fixed-position"'],
  },
  { attribute: 'visibility', value: ['"visible"', '"hidden"', '"collapse"'] },
  { attribute: 'word-spacing', value: ['<length>'] },
  { attribute: 'writing-mode', value: ['"horizontal-tb"', '"vertical-rl"', '"vertical-lr"'] },
];
