module.exports = {
  apps: [
    {
      name: "portal-backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 5008,
      },
    },
  ],
};
