'use strict';

const controllers = require('./controllers');
const routes = require('./routes');
const services = require('./services');

module.exports = {
  register({ strapi }) {
    strapi.log.info('[media-tools] Plugin registered');
  },
  bootstrap({ strapi }) {},
  controllers,
  routes,
  services,
};
