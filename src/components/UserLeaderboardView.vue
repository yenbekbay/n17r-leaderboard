<template>
  <div class="leaderboard">
    <h1 class="title has-text-centered">{{ title }}</h1>
    <div class="columns">
      <div class="column is-half is-offset-one-quarter">
        <p class="control" v-show="!loading || users.length">
          <input class="input" v-el:name-input type="text" placeholder="Enter a name">
        </p>
        <pulse-loader :class="'has-text-centered'" :loading="loading" :color="'#1fc8db'"></pulse-loader>
        <div class="notification is-danger" v-show="error">{{ error }}</div>
        <div class="notification is-warning" v-show="noData">No data yet</div>
        <chart :type="'bar'" :data="barChartData" :options="barChartOptions" v-show="dataReady"></chart>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import Awesomplete from 'awesomplete';
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
      title: 'Stats for a student',
      loading: true,
      error: null,
      users: [],
      selectedUser: null,
      awesomplete: null,
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
      return !this.loading && !this.barChartData.labels.length &&
        this.selectedUser && !this.error;
    }
  },
  route: {
    data({ to: { path, params: { username }}}) {
      this.selectedUser = null;
      this.title = 'Stats for a student';

      if (!username && path !== '/user/search') {
        return {
          loading: false,
          error: 'Please enter a valid username'
        };
      }

      return store
        .getUsers()
        .then(users => {
          if (!users.length) {
            this.users = users;
          }

          if (path === '/user/search') {
            return { loading: false   };
          }

          const user = _.find(users, ['name', username]);
          if (!user) {
            return {
              loading: false,
              error: `No user found with username @${username}`
            };
          }

          this.selectedUser = user;
          this.title = `Stats for ${user.first_name} ${user.last_name}`;

          this.reload();
        });
    }
  },
  ready() {
    this.awesomplete = new Awesomplete(this.$els.nameInput);

    document.addEventListener(
      'awesomplete-selectcomplete',
      event => {
        const name = this.$els.nameInput.value.split(' ');
        const user = _.find(this.users, {
          'first_name': name[0],
          'last_name': name[1]
        });
        if (user) {
          this.$route.router.go(`/user/${user.name}`);
        }
      },
      false
    );
  },
  methods: {
    reload() {
      if (!this.selectedUser) return;

      this.loading = true;
      this.error = null;

      store
        .fetchUserStats(this.selectedUser.id)
        .then(stats => {
          this.loading = false;
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
    }
  },
  watch: {
    title(title) {
      document.title = title;
    },
    users(users) {
      this.awesomplete.list = _.map(
        users,
        user => `${user.first_name} ${user.last_name}`
      );
    }
  }
}
</script>

<style lang="stylus" scoped>
.control
  margin-bottom: 30px
</style>
