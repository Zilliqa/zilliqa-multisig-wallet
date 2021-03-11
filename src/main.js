import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Tabs from 'vue-tabs-component';

Vue.config.productionTip = false

window.EventBus = new Vue();

Vue.use(Tabs);

new Vue({
  router,
  store,
  render: h => h(App),
  watch: {
    '$route': function () {
      let menu = document.querySelector("#nav"); // Using a class instead, see note below.
      if (menu !== undefined && menu !== null) {
        menu.classList.remove("active");
      }
    }
  }
}).$mount('#app')
