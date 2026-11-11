// svgo config for scripts/optimize-logos.sh: the default preset, but keep the viewBox and the role attribute,
// and drop width/height, so the intrinsic ratio is the viewBox's exactly (rounded dimensions would letterbox
// the logo by a fraction of a pixel). Precision is passed per file on the command line.
export default {
  multipass: true,
  plugins: [
    { name: 'preset-default', params: { overrides: { removeViewBox: false, removeUnknownsAndDefaults: { keepRoleAttr: true } } } },
    'removeDimensions',
  ],
};
