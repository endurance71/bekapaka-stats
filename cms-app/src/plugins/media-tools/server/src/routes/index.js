'use strict';

module.exports = {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'POST',
        path: '/rotate',
        handler: 'rotate.rotate',
        config: {
          policies: [
            'admin::isAuthenticatedAdmin',
            {
              name: 'admin::hasPermissions',
              config: {
                actions: ['plugin::upload.assets.update'],
              },
            },
          ],
        },
      },
    ],
  },
};
