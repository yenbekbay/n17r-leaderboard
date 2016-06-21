<template>
  <div class="submission">
    <h1 class="title has-text-centered">{{ title }}</h1>
    <div class="columns">
      <div class="column is-half is-offset-one-quarter">
        <p class="control">
          <input class="input" v-el:date-input type="text" placeholder="Date">
        </p>
        <p class="control" v-show="!loading || users.length">
          <input class="input" v-el:name-input type="text" placeholder="User name">
        </p>
        <pulse-loader :class="'has-text-centered'" :loading="loading" :color="'#1fc8db'"></pulse-loader>
        <div class="notification is-danger" v-show="error">{{ error }}</div>
        <div class="notification is-success" v-show="successMessage">{{ successMessage }}</div>
        <p class="control" v-show="!loading && selectedUser">
          <label class="checkbox">
            <input type="checkbox" v-el:bronze-radio name="bronze">
            Bronze
          </label>
          <label class="checkbox">
            <input type="checkbox" v-el:silver-radio name="silver">
            Silver
          </label>
          <label class="checkbox">
            <input type="checkbox" v-el:gold-radio name="gold">
            Gold
          </label>
        </p>
        <p class="control" v-show="!loading && selectedUser">
          <button class="button is-primary" :class="{ 'is-loading': submitting }" v-on:click="submit">Submit</button>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import Awesomplete from 'awesomplete';
import moment from 'moment';
import Pikaday from 'pikaday';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';

import store from '../store';

export default {
  name: 'SubmissionView',
  components: {
    PulseLoader
  },
  data() {
    return {
      title: `Submission for ${moment().format('dddd, MMMM D')}`,
      timestamp: store.today.unix(),
      loading: true,
      submitting: false,
      users: [],
      awesomplete: null,
      datePicker: null,
      selectedUser: null,
      error: null,
      successMessage: null
    }
  },
  route: {
    data({ to }) {
      return store
        .getUsers()
        .then(users => ({
          loading: false,
          users
        }))
    }
  },
  ready() {
    this.datePicker = new Pikaday({
      field: this.$els.dateInput,
      firstDay: 1,
      onSelect: date => {
        this.timestamp = moment(date).unix();
        this.title = `Submission for ${moment(date).format('dddd, MMMM D')}`;
        this.updateUserPoints();
      }
    });
    this.datePicker.setDate(new Date());

    document.addEventListener(
      'awesomplete-selectcomplete',
      event => {
        const name = this.$els.nameInput.value.split(' ');
        this.selectedUser = _.find(this.users, {
          'first_name': name[0],
          'last_name': name[1]
        });
        this.updateUserPoints();
      },
      false
    );
  },
  methods: {
    updateUserPoints() {
      if (!this.selectedUser || !this.timestamp) return;

      this.loading = true;
      this.successMessage = null;
      this.error = null;

      store
        .fetchUserPoints(this.selectedUser.id, this.timestamp)
        .then(
          stats => {
            this.loading = false;
            this.$els.bronzeRadio.checked = stats.bronze;
            this.$els.silverRadio.checked = stats.silver;
            this.$els.goldRadio.checked = stats.gold;
            this.toggleInputs(true);
          },
          err => {
            this.loading = false;
            this.error = err.message;
          }
        );
    },
    submit(event) {
      if (!this.selectedUser || !this.timestamp) return;

      this.submitting = true;
      this.toggleInputs(false);

      const points = {
        bronze: this.$els.bronzeRadio.checked,
        silver: this.$els.silverRadio.checked,
        gold: this.$els.goldRadio.checked
      };

      store
        .submitUserPoints(this.selectedUser, this.timestamp, points)
        .then(
          () => {
            this.submitting = false;
            this.successMessage = `Points for ` +
              `${this.selectedUser.first_name} ` +
              `${this.selectedUser.last_name} have been submitted.`;
            this.selectedUser = null;
          },
          err => {
            this.submitting = false;
            this.selectedUser = null;
            this.error = err.message;
          }
        );
    },
    toggleInputs(enabled) {
      ['bronze', 'silver', 'gold'].forEach(color => {
        this.$els[`${color}Radio`].disabled = !enabled;
      });
    }
  },
  watch: {
    title(title) {
      document.title = title;
    },
    users(users) {
      this.awesomplete = new Awesomplete(this.$els.nameInput, {
        list: _.map(
          users,
          user => `${user.first_name} ${user.last_name}`
        )
      });
    }
  }
}
</script>

<style lang="stylus" scoped>
.title
  margin-bottom: 30px
.control
  text-align: center
.v-spinner, .checkbox
  padding: 10px
</style>
