<template>
  <div class="leaderboard">
    <h1 class="title has-text-centered">{{ title }}</h1>
    <div class="container">
      <div class="notification is-danger" v-show="error">{{ error }}</div>
      <chart :type="'bar'" :data="barChartData" :options="barChartOptions" v-show="!error"></chart>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';

import Chart from './Chart.vue';
import store from '../store';

export default {
  name: 'DateLeaderboardView',
  components: {
    Chart
  },
  data() {
    return {
      title: 'Leaderboard',
      error: null,
      barChartData: {
        labels: [],
        datasets: []
      },
      barChartOptions: {
        scales: {
          xAxes: [{ stacked: true }],
          yAxes: [{ stacked: true }]
        },
        legend: { display: false }
      }
    };
  },
  route: {
    data({ to: { params: { username }}}) {
      if (!username) {
        return { error: 'Please enter a valid username' };
      }

      return store
        .getUsers()
        .then(users => {
          const user = _.find(users, ['name', username]);
          if (!user) {
            return { error: `No user found with username @${username}` };
          }

          this.title = `Stats for ${user.first_name} ${user.last_name}`;

          return store
            .fetchUserStats(user.id)
            .then(stats => {
              this.barChartData = {
                labels: _.map(
                  stats,
                  dateStats => moment
                    .unix(dateStats.timestamp)
                    .format('MMM D')
                ),
                datasets: _.map(_.keys(store.colors), color => ({
                  label: color,
                  backgroundColor: store.colors[color],
                  data: _.map(stats, `points.${color}`)
                }))
              };
            });
        });
    }
  },
  title(val) {
    document.title = val;
  }
}
</script>
