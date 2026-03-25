import i18next from 'i18next';
import _ from 'lodash';

export default (app) => ({
  route: (name, params) => {
    if (params) {
      const stringParams = Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      );
      return app.reverse(name, stringParams);
    }
    return app.reverse(name);
  },
  t: (key) => i18next.t(key),
  _,
  getAlertClass(type) {
    switch (type) {
      case 'error':
        return 'danger';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        throw new Error(`Unknown flash type: '${type}'`);
    }
  },
  formatDate(str) {
    return new Date(str).toLocaleString();
  },
});
