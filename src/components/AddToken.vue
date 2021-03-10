<template>
  <div class="add-funds-form">
    <h2 class="subtitle mb-5">Add Token</h2>
    <div class="big-form mb-5">
      Token address:
      <input type="number" min="0" v-model="amount" />
    </div>
    <div class="buttons">
      <div v-if="isLoading" class="loading text-white">
        <i class="fas fa-spinner fa-spin"></i> Please wait while the transaction is confirming.
      </div>
      <div v-if="!isLoading">
        <button class="btn btn-primary mr-4" @click="proceed">Submit</button>
        <button class="btn btn-outline-secondary" @click="$emit('cancel-add-token')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2';
import { mapGetters } from 'vuex';
import { bytes, BN, Long, units } from '@zilliqa-js/util';

import SuccessScreen from '@/components/SuccessScreen';
import ViewblockLink from '@/components/ViewblockLink';

export default {
  name: 'AddToken',
  props: ['address', 'bech32', 'zilliqa'],
  data() {
    return {
      isLoading: false
    };
  },
  components: {
    SuccessScreen,
    ViewblockLink
  },
  computed: {
    ...mapGetters('general', {
      network: 'selectedNetwork',
      personalAddress: 'personalAddress'
    })
  },
  methods: {
    proceed() {

    }
  }
};
</script>

<style lang="scss" scoped>
.advanced-options {
  margin-bottom: 2rem;
}

.toggle-advanced-options {
  cursor: pointer;
}
</style>