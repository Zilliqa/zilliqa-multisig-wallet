<template>
  <div class="token-card btn btn-outline-primary">
    <img
      class="card-image"
      :src="url"
      height="60"
      width="60"
      @error="onErrorLoading"
    >
    <h4 class="card-title subtitle text-white">
      {{ token.name }}
    </h4>
    <h2 class="card-subtitle subtitle text-white">
      <div v-show="balance === undefined">
        <i class="fas fa-spinner fa-spin" />
      </div>
      <span v-show="balance !== undefined">
        {{ balance }} {{ token.symbol }}
      </span>
    </h2>
  </div>
</template>

<script>
import { Zilliqa } from "@zilliqa-js/zilliqa";

export default {
  name: 'TokenCard',
  props: ['token', 'network', 'address'],
  data() {
    return {
      balance: undefined,
      zilliqa: null
    };
  },
  computed: {
    url() {
      return `https://raw.githubusercontent.com/Switcheo/zilswap-token-list/master/logos/${this.token.symbol}.svg`;
    }
  },
  methods: {
    onErrorLoading(event) {
      console.log(event.target);
    },
    async getBalance() {
      const field = 'balances';
      const wallet = String(this.wallet).toLowerCase();
      
      try {
        if (this.token.symbol === 'ZIL') {
          const { result } = await this.zilliqa.blockchain.getBalance(this.address);

          if (result && result.balance) {
            return result.balance;
          }

          throw new Error();
        }
        const { result } = await this.zilliqa.blockchain.getSmartContractSubState(
          this.address,
          field,
          [wallet]
        );

        if (result && result[field] && result[field][wallet]) {
          return result[field][wallet];
        }

        return '0';
      } catch (err) {
        return '0';
      }
    },
    async balanceUpdate() {
      const balance = await this.getBalance();
      const decimals = Number(this.token.decimals);

      this.balance = Number(balance) / 10 ** decimals;
    }
  },
  async beforeMount() {
    if (this.network.name === "ZilPay") {
      this.zilliqa = window['zilPay'];
    } else {
      this.zilliqa = new Zilliqa(this.network.url);
    }

    await this.balanceUpdate();
  }
}
</script>

<style lang="scss">
.token-card {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 10px;

  max-width: 150px;
  width: 100%;
  height: 150px;
}
.card-title {
  font-size: 13px;
}
.card-subtitle {
  font-size: 15px;
}
</style>
