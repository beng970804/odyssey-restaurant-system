module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 compiles its worklets here; the drawer's gesture does not
    // run on the UI thread without it.
    plugins: ['react-native-worklets/plugin'],
  }
}
