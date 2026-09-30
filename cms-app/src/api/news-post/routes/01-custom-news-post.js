'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/news-posts/:slug/view',
      handler: 'news-post.incrementViews',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
