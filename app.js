require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

const basepath = '/api';

const tasksRoute = require(path.resolve(".") + "/src/features/task/task.routes");
const usersRoute  = require(path.resolve(".") + "/src/features/user/user.routes");

const projectRoute = require(path.resolve(".") + "/src/features/project/project.routes");
const taskRouteV2 = require(path.resolve(".") + "/src/features/task/v2/task.routes-v2");

app.use(basepath + "/v1", tasksRoute);  //domain_url/api/v1/routes
app.use(basepath + "/v1", usersRoute);   //sample: domain_url/v1/users/register

app.use(basepath + "/v2", taskRouteV2);
app.use(basepath + "/v2", projectRoute);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
