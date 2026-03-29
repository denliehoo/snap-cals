const { withAndroidStyles, AndroidConfig } = require("expo/config-plugins");

function withCustomTheme(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;

    // Find or create AppTheme style
    let appTheme = styles.resources.style?.find(
      (s) => s.$.name === "AppTheme"
    );

    if (!appTheme) {
      if (!styles.resources.style) styles.resources.style = [];
      appTheme = {
        $: { name: "AppTheme", parent: "Theme.AppCompat.Light.NoActionBar" },
        item: [],
      };
      styles.resources.style.push(appTheme);
    }

    if (!appTheme.item) appTheme.item = [];

    const overrides = {
      colorPrimary: "#1B5E3B",
      colorPrimaryDark: "#0D3B25",
      colorAccent: "#1B5E3B",
    };

    for (const [attr, value] of Object.entries(overrides)) {
      const existing = appTheme.item.find((i) => i.$.name === attr);
      if (existing) {
        existing._ = value;
      } else {
        appTheme.item.push({ $: { name: attr }, _: value });
      }
    }

    return config;
  });
}

module.exports = withCustomTheme;
