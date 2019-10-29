const path = require("path");

module.exports = {
  entry: "./panel.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "generated"),
  },
};
