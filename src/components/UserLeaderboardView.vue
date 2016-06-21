<template>
  <div class="leaderboard">
    <h1 class="title has-text-centered">{{ title }}</h1>
    <div class="container">
      <pulse-loader :class="'has-text-centered'" :loading="loading" :color="'#1fc8db'"></pulse-loader>
      <div class="notification is-danger" v-show="error">{{ error }}</div>
      <div class="notification is-warning" v-show="noData">No data yet</div>
      <chart :type="'bar'" :data="barChartData" :options="barChartOptions" v-show="dataReady"></chart>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';

import Chart from './Chart.vue';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import store from '../store';

export default {
  name: 'DateLeaderboardView',
  components: {
    Chart,
    PulseLoader
  },
  data() {
    return {
      title: 'Stats',
      loading: true,
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
  computed: {
    dataReady() {
      return !this.loading && this.barChartData.labels.length;
    },
    noData() {
      return !this.loading && !this.barChartData.labels.length;
    }
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
            .then(stats => ({
              loading: false,
              barChartData: {
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
              }
            }));
        });
    }
  },
  title(val) {
    document.title = val;
  }
}
</script>
