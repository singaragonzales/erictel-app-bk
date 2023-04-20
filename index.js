const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const usersRoutes = require('./routes/users');
const cors = require('cors');
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({limit: '50mb', extended:true}));
app.use(express.urlencoded({limit: '50mb', extended:true, parameterLimit: 50000}));

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

mongoose.connect('mongodb://127.0.0.1:27017/erictelDB', { useNewUrlParser: true })
  .then(() => console.log('Database connected'))
  .catch(error => console.log(error));

app.use('/', usersRoutes);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: 'API de ejemplo',
      version: '1.0.0',
      description: 'Documentación de la API de ejemplo'
    }
  },
  servers:[
    {
      url: "http://localhost:3000"
    }
  ],
  apis: [`${path.join(__dirname, './routes/*.js')}`],
};

// const swaggerDocs = require('./docs/swagger.json');
const swaggerDocs = swaggerJsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.listen(port, () => console.log(`Server running on port ${port}`));