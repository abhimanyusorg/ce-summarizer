module.exports = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CE Summarization API',
      version: '1.0.0',
      description: 'API for summarizing customer experience threads',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/app/api/**/*.ts'], // Path to the API routes
};