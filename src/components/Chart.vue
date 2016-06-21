<template>
  <canvas :width="width" :height="height"></canvas>
</template>

<script>
import Chart from 'chart.js/dist/Chart';

const types = [
  'line',
  'bar',
  'horizontalBar',
  'radar',
  'polarArea',
  'pie',
  'doughnut'
];
const uuid = {
  created() {
    this.uuid = Math.random().toString(36).substring(3, 8);
  }
};

export default {
  mixins: [uuid],
  props: {
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    type: {
      type: String,
      required: true,
      validator: value => types.indexOf(value) > -1
    },
    data: {
      type: Object,
      required: true,
      default: () => ({})
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  ready() {
    const $el = this.$el;
    $el.setAttribute('id', `canvas-${this.uuid}`);
    this.create();
  },
  data() {
    return {
      chart: null
    }
  },
  methods: {
    create(event) {
      this.chart = new Chart(this.$el, {
        type: this.type,
        data: this.data,
        options: this.options
      });
    }
  },
  watch: {
    data(data) {
      this.$nextTick(() => {
        this.chart.data.datasets = data.datasets;
        this.chart.data.labels = data.labels;
        this.chart.update();
      });
    },
    height(height) {
      this.create();
    }
  }
}
</script>

<style lang="stylus" scoped>
canvas
  max-width: 100%
</style>
