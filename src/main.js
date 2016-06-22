import _ from 'lodash';
import Router from 'vue-router';
import Vue from 'vue';

import App from './components/App.vue';
import config from '../config.json';
import DateLeaderboardView from './components/DateLeaderboardView.vue';
import SubmissionView from './components/SubmissionView.vue';
import UserLeaderboardView from './components/UserLeaderboardView.vue';

Vue.use(Router);
Vue.transition('fade', {
  enterClass: 'fadeIn',
  leaveClass: 'fadeOut'
});

const router = new Router({ transitionOnLoad: true });

const validIntervals = [
  '/today',
  '/yesterday',
  '/month',
  '/week',
  '/:year/:month/:day'
];
const submissionPath = `/submission-${config.submissionKey}`;
router.map(_.transform(
  validIntervals,
  (routes, interval) => _.set(
    routes,
    interval,
    { component: DateLeaderboardView }
  ),
  {
    [submissionPath]: { component: SubmissionView },
    '/user/search': { component: UserLeaderboardView },
    '/user/:username': { component: UserLeaderboardView }
  }
));
router.redirect({
  '*': '/month'
});

router.start(App, 'app');
