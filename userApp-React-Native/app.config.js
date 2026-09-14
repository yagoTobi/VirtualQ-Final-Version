module.exports = ({ config }) => ({
  ...config,
  extra: { apiBaseUrl: process.env.VIRTUALQ_API_URL },
});
