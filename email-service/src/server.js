const { createApp } = require("./app");
const { config } = require("./config");

const app = createApp();

app.listen(config.port, () => {
  console.log(`Email service running on port ${config.port}`);
});
