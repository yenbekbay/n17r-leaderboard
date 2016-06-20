<template>
  <div class="leaderboard">
    <h1 class="title has-text-centered">{{ title }}</h1>
    <div class="container">
      <div class="columns is-desktop">
        <div class="column">
          <chart :type="'horizontalBar'" :data="barChartData" :options="barChartOptions" :height="barChartHeight"></chart>
        </div>
        <div class="column">
          <h4 class="title has-text-centered is-4">Stats</h4>
          <chart :type="'doughnut'" :data="doughnutChartData" :options="doughnutChartOptions"></chart>
        </div>
      </div>
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
      updating: false,
      interval: [store.today],
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
      },
      barChartHeight: 400,
      doughnutChartData: {
        labels: [],
        datasets: []
      },
      doughnutChartOptions: {}
    };
  },
  route: {
    data({ to: { path, params: { year, month, day }}}) {
      const today = new Date();
      switch (path) {
        case '/today':
          this.interval = [
            store.today.unix(),
            store.today.unix()
          ];
          this.title = 'Leaderboard for today';
          break;
        case '/yesterday':
          this.interval = [
            store.yesterday.unix(),
            store.yesterday.unix()
          ];
          this.title = 'Leaderboard for yesterday';
          break;
        case '/month':
          this.interval = [
            store.today.clone().subtract(1, 'M').unix(),
            store.today.unix()
          ];
          this.title = 'Leaderboard for the past month';
          break;
        case '/week':
          this.interval = [
            store.today.clone().subtract(1, 'w').unix(),
            store.today.unix()
          ];
          this.title = 'Leaderboard for the past week';
          break;
        default:
          const date = new Date(year, month - 1, day);
          this.interval = [date.getTime(), date.getTime()];
          this.title = `Leaderboard for ${moment(date).format('dddd, MMMM D')}`;
          break;
      }

      this.update();
    }
  },
  created() {
    store.on('leaderboard-updated', this.update);
  },
  destroyed() {
    store.removeListener('leaderboard-updated', this.update);
  },
  methods: {
    update() {
      if (this.updating) {
        return;
      } else {
        this.updating = true;
      }

      store
        .fetchDateLeaderboard(this.interval)
        .then(leaderboard => {
          this.barChartData = {
            labels: _.map(
              leaderboard,
              stats => `${stats.user.first_name } ${ stats.user.last_name }`
            ),
            datasets: _.map(_.keys(store.colors), color => ({
              label: color,
              backgroundColor: store.colors[color],
              data: _.map(leaderboard, `points.${color}`)
            }))
          };
          this.barChartHeight = Math.max(leaderboard.length * 60, 400);
          this.doughnutChartData = {
            labels: ['Bronze', 'Silver', 'Gold'],
            datasets: [{
              data: _.reduce(leaderboard, (data, stats) => [
                data[0] + stats.bronze,
                data[1] + stats.silver,
                data[2] + stats.gold
              ], [0, 0, 0]),
              backgroundColor: [
                store.colors.bronze,
                store.colors.silver,
                store.colors.gold
              ],
              label: 'Leaderboard'
            }]
          };
          this.updating = false;
        });
    }
  },
  title(val) {
    document.title = val;
  }
}
</script>
