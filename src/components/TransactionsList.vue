<template>
  <div
    class="transactions-list"
    v-if="transactions.length !== 0 && zilliqa"
  >
    <div class="heading">
      <h2 class="subtitle">Transactions</h2>
      <div class="filters text-white">
        Filter by:
        <span>All Transactions</span>
      </div>
    </div>
    <div
      v-for="(transaction, index) of transactions"
      :key="index"
      class="content transactions-list"
    >
      <Transaction
        :transaction="transaction"
        :wallet="address"
        :owners="owners"
        :signature_counts="signature_counts"
        :signatures="signatures"
        :signatures_need="signatures_need"
        :network="network"
        :zilliqa="zilliqa"
      />
    </div>
  </div>

  <div class="nothing text-white" v-else>No transactions found.</div>
</template>

<script>
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { validation } from "@zilliqa-js/util";
import { fromBech32Address } from "@zilliqa-js/crypto";

import Transaction from "@/components/Transaction.vue";
import ZIlpayMixin from '@/mixins/zilpay';
import { mapState } from 'vuex';

export default {
  name: "TransactionsList",
  mixins: [ZIlpayMixin],
  props: ["address", "signatures_need", "network", "tokens"],
  components: {
    Transaction
  },
  data() {
    return {
      transactions: [],
      owners: [],
      signature_counts: {},
      signatures: [],
      zilliqa: null
    };
  },
  async mounted() {
    let address = this.address;

    if (validation.isBech32(address)) {
      address = fromBech32Address(address);
    }

    if (this.network.name === "ZilPay") {
      this.zilliqa = await this.__getZilPay();
    } else {
      this.zilliqa = new Zilliqa(this.network.url);
    }

    const { result } = await this.zilliqa.blockchain.getSmartContractState(address);

    if (result && result.transactions && result.signatures && result.signature_counts) {
      const transactions = Object.keys(result.transactions).map((key) =>({
        key: key,
        token: result.transactions[key].constructor === 'NativeTransaction'
          ? this.tokens[0] : this.tokens.find(
          (t) => String(t.address).toLowerCase() === String(result.transactions[key].arguments[0]).toLowerCase()
        ),
        type: result.transactions[key].constructor,
        destination: result.transactions[key].arguments[0],
        amount: result.transactions[key].arguments[1],
        third: result.transactions[key].arguments[2],
        signatures: result.signatures[key],
        signatures_count: result.signature_counts[key]
      })).filter((t) => Boolean(t.token));

      this.transactions = transactions;
      this.owners = Object.keys(result.owners);
      this.signature_counts = result.signature_counts;
      this.signatures = Object.values(result.signatures);
    }
  }
};
</script>

<style scoped lang="scss">
</style>
