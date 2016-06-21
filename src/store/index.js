import _ from 'lodash';
import { EventEmitter } from 'events';
import { Promise } from 'es6-promise';
import firebase from 'firebase/app';
import moment from 'moment';
import request from 'superagent';
import 'firebase/database';

import config from '../../config.json';

firebase.initializeApp(config.firebase);

const database = firebase.database();
const cache = {
  users: []
};
const store = new EventEmitter();

store.today = moment().startOf('day');
store.yesterday = store.today.clone().subtract(1, 'd');
store.colors = {
  bronze: '#965A38',
  silver: '#A8A8A8',
  gold: '#C98910'
};

export default store;

const excludedUsernames = [
  'aigera',
  'almaskz',
  'armansu',
  'bahakz',
  'binchik',
  'bliss',
  'gulsum',
  'mshaken',
  'n',
  'nurdaulet',
  'talmaco',
  'yenbekbay',
  'zkenes'
];
const worth = {
  gold: 3,
  silver: 2,
  bronze: 1
};

database
  .ref('points')
  .on('value', () => {
    store.emit('leaderboard-updated');
  });

store.getUsers = () => {
  if (cache.users.length) {
    return Promise.resolve(cache.users);
  }
  const capitalize = str => str.charAt(0).toUpperCase() +
    str.slice(1).toLowerCase();

  return request
    .get('https://slack.com/api/users.list')
    .query({ token: config.slackToken })
    .then(res => {
      cache.users = _
        .chain(res)
        .get('body.members', [])
        .omitBy(member => (
          !member.profile.first_name ||
          !member.profile.last_name
        ))
        .map(member => _(member)
          .pick(member, ['id', 'name'])
          .assign({
            first_name: capitalize(member.profile.first_name),
            last_name: capitalize(member.profile.last_name),
            image: member.profile.image_192
          })
          .value()
        )
        .omitBy(member => (
          excludedUsernames.indexOf(member.name) > -1 ||
          member.name.indexOf('bot') > -1
        ))
        .value();

      return cache.users;
    });
};

store.fetchDateLeaderboard = interval => store
  .getUsers()
  .then(users => database
    .ref('points')
    .orderByChild('timestamp')
    .startAt(interval[0])
    .endAt(interval[1])
    .once('value')
    .then(snapshot => _(snapshot.val())
      .groupBy('userId')
      .map((userEntries, userId) => ({
        user: _.find(users, ['id', userId]),
        gold: _.filter(userEntries, 'gold').length,
        silver: _.filter(userEntries, 'silver').length,
        bronze: _.filter(userEntries, 'bronze').length
      }))
      .map(stats => _.assign(stats, {
        points: {
          gold: stats.gold * worth.gold,
          silver: stats.silver * worth.silver,
          bronze: stats.bronze * worth.bronze
        }
      }))
      .map(stats => _.merge(stats, {
        points: {
          total: stats.points.gold + stats.points.silver + stats.points.bronze
        }
      }))
      .sortBy('user.first_name')
      .reverse()
      .sortBy('points.total')
      .reverse()
      .value()
    )
  );

store.fetchUserStats = userId => database
  .ref('points')
  .orderByChild('userId')
  .equalTo(userId)
  .once('value')
  .then(snapshot => _(snapshot.val())
    .groupBy('timestamp')
    .map((dateEntries, timestamp) => ({
      timestamp,
      gold: _.filter(dateEntries, 'gold').length,
      silver: _.filter(dateEntries, 'silver').length,
      bronze: _.filter(dateEntries, 'bronze').length
    }))
    .map(stats => _.assign(stats, {
      points: {
        gold: stats.gold * worth.gold,
        silver: stats.silver * worth.silver,
        bronze: stats.bronze * worth.bronze
      }
    }))
    .map(stats => _.merge(stats, {
      points: {
        total: stats.points.gold + stats.points.silver + stats.points.bronze
      }
    }))
    .sortBy('timestamp')
    .value()
  );

store.fetchUserPoints = (name, timestamp) => store
  .getUsers()
  .then(users => {
    const user = _.find(users, {
      first_name: name[0],
      last_name: name[1]
    });

    return database
      .ref(`points/${user.id}-${timestamp}`)
      .once('value')
      .then(snapshot => _.assign(
        {
          user,
          gold: false,
          silver: false,
          bronze: false
        },
        snapshot.val()
      ));
  });

store.submitUserPoints = (user, timestamp, points) => database
  .ref(`points/${user.id}-${timestamp}`)
  .set(_.assign(points, {
    userId: user.id,
    timestamp
  }));
