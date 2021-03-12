<template>
  <div class="add-funds-form" v-if="!isSuccess">
    <h2 class="subtitle mb-4">New Transaction</h2>
    <b-dropdown
      id="dropdown-aria"
      :text="selectedMethod"
      class="mb-2"
      v-if="token.symbol !== 'ZIL'"
    >
      <b-dropdown-item
        v-for="(m, index) of methods"
        :key="index"
        :active="selectedMethod === m"
        @click="selectedMethod = m"
      >
        {{ m }}
      </b-dropdown-item>
    </b-dropdown>
    <Transfer
      v-if="selectedMethod === methods.Transfer"
      v-model="tranferModel"
      :symbol="token.symbol"
    />
    <TransferFrom
      v-if="selectedMethod === methods.TransferFrom"
      v-model="tranferFromModel"
      :symbol="token.symbol"
    />
    <Mint
      v-if="selectedMethod === methods.Mint"
      v-model="mintModel"
      :symbol="token.symbol"
    />
    <Burn
      v-if="selectedMethod === methods.Burn"
      v-model="burnModel"
      :symbol="token.symbol"
    />
    <Allowance
      v-if="selectedMethod === methods.DecreaseAllowance"
      v-model="decreaseAllowanceModel"
      :symbol="token.symbol"
    />
    <Allowance
      v-if="selectedMethod === methods.IncreaseAllowance"
      v-model="increaseAllowanceModel"
      :symbol="token.symbol"
    />
    <h2 class="subtitle toggle-advanced-options mb-4" @click="toggleAdvancedOptions">
      Advanced options <i class="fas fa-chevron-down" />
    </h2>
    <div class="advanced-options d-none mb-5">
      <Gas v-model="gas"/>
      <div
        v-if="token.symbol === 'ZIL'"
        class="input-group mb-3"
      >
        <div class="input-group-prepend">
          <span class="input-group-text" id="basic-addon1">
            Tag
          </span>
        </div>
        <input
          type="text"
          class="form-control"
          placeholder="Teg transition"
          aria-label="Teg transition"
          v-model="tag"
        >
      </div>
    </div>
    <div class="buttons">
      <div v-if="isLoading" class="text-white">Please wait while the transaction is deployed.</div>
      <div v-if="!isLoading && !isSuccess">
        <button
          class="btn btn-primary mr-4"
          :disabled="!isEnable"
          @click="proceed"
        >
          Submit
        </button>
        <button class="btn btn-outline-secondary" @click="$emit('cancel-new-transaction')">
          Cancel
        </button>
      </div>
    </div>
  </div>
  <success-screen v-else>
    <div class="subtitle text-primary mb-5">
      Transaction has been successfully generated:
      <br />
      <viewblock-link :txid="tx.id" :network="network" />
    </div>
  </success-screen>
</template>

<script>
import Swal from 'sweetalert2';
import Big from 'big.js';

import { bytes, BN, Long } from '@zilliqa-js/util';
import { fromBech32Address } from '@zilliqa-js/crypto';

import { mapGetters } from 'vuex';

import { BDropdown, BDropdownItem } from 'bootstrap-vue';
import SuccessScreen from '@/components/SuccessScreen';
import ViewblockLink from '@/components/ViewblockLink';
import Gas from '@/components/Gas';
import Transfer from '@/components/transfer/Transfer';
import TransferFrom from '@/components/transfer/TransferFrom';
import Mint from '@/components/transfer/Mint';
import Burn from '@/components/transfer/Burn';
import Allowance from '@/components/transfer/Allowance';

Big.PE = 99;

const methods = {
  IncreaseAllowance: 'IncreaseAllowance',
  DecreaseAllowance: 'DecreaseAllowance',
  Transfer: 'Transfer',
  TransferFrom: 'TransferFrom',
  Burn: 'Burn',
  Mint: 'Mint'
};

export default {
  name: 'NewTransaction',
  data() {
    return {
      methods,
      selectedMethod: methods.Transfer,
      destinationError: false,
      tag: '',
      isLoading: false,
      isSuccess: false,
      gas: {
        gasPrice: 2000000000,
        gasLimit: 50000
      },
      burnModel: {
        amount: 0,
        burnAccount: null
      },
      mintModel: {
        amount: 0,
        recipient: null
      },
      tranferModel: {
        amount: 0,
        destination: null
      },
      tranferFromModel: {
        amount: 0,
        destination: null,
        from: null
      },
      decreaseAllowanceModel: {
        amount: 0,
        spender: null
      },
      increaseAllowanceModel: {
        amount: 0,
        spender: null
      }
    };
  },
  components: {
    SuccessScreen,
    Gas,
    ViewblockLink,
    Transfer,
    Allowance,
    TransferFrom,
    Mint,
    Burn,
    BDropdown,
    BDropdownItem
  },
  props: ['zilliqa', 'address', 'token'],
  computed: {
    ...mapGetters('general', {
      network: 'selectedNetwork'
    }),
    isEnable() {
      try {
        fromBech32Address(this.tranferModel.destination);

        return true;
      } catch {
        return false;
      }
    },
    data() {
      const _decimals = Big(10).pow(Number(this.token.decimals));
      const _amount = Big(this.tranferModel.amount);
      const value = _amount.mul(_decimals).round();

      if (this.token.symbol === 'ZIL') {
        return JSON.stringify({
          _tag: 'SubmitNativeTransaction',
          params: [
            {
              vname: 'recipient',
              type: 'ByStr20',
              value: fromBech32Address(this.tranferModel.destination).toLowerCase()
            },
            {
              vname: 'amount',
              type: 'Uint128',
              value: String(value)
            },
            {
              vname: 'tag',
              type: 'String',
              value: `${this.tag}`
            }
          ]
        });
      }

      return JSON.stringify({
        _tag: 'SubmitCustomTransferTransaction',
        params: [
          {
            vname: 'proxyTokenContract',
            type: 'ByStr20',
            value: String(this.token.address).toLowerCase()
          },
          {
            vname: 'to',
            type: 'ByStr20',
            value: fromBech32Address(this.tranferModel.destination).toLowerCase()
          },
          {
            vname: 'amount',
            type: 'Uint128',
            value: String(value)
          }
        ]
      });
    }
  },
  methods: {
    checkAmount() {
      if (this.amount <= -1) {
        this.amount = 0;
      }
    },
    toggleAdvancedOptions() {
      const adv = document.querySelector('.advanced-options');

      adv.classList.toggle('d-none');
    },
    async proceed() {
      this.isLoading = true;

      const VERSION = bytes.pack(this.network.chainId, this.network.msgVersion);
      let tx = this.zilliqa.transactions.new({
        version: VERSION,
        toAddr: this.address,
        amount: new BN(0),
        gasPrice: new BN(this.gas.gasPrice),
        gasLimit: Long.fromNumber(this.gas.gasLimit),
        data: this.data
      });

      EventBus.$emit('sign-event', tx);

      this.isLoading = false;
    },
    viewblock(txid) {
      let link = `https://viewblock.io/zilliqa/tx/${txid}`;

      if (this.network.name === "ZilPay") {
        link += `?network=${this.zilliqa.wallet.net}`;
      }
      
      if (this.network.url === 'https://dev-api.zilliqa.com') {
        link += '?network=testnet';
      }

      return link;
    }
  },
  async mounted() {
    EventBus.$on('sign-success', async tx => {
      if (tx.error) {
        Swal.fire({
          type: 'Error',
          html: 'tx.error'
        }).then(() => {
          window.location.reload();
        });
      } else if (tx.ledger !== true) {
        if (tx.id !== undefined && tx.receipt.success === true) {
          Swal.fire({
            type: 'success',
            html: `Transaction has been successfully sent <a target="_blank" href="${this.viewblock(tx.id)}">${tx.id}</a>`
          }).then(() => {
            window.location.reload();
          });
        }
      } else {
        Swal.fire({
          type: 'success',
          html: `Transaction has been successfully sent <a target="_blank" href="${this.viewblock(tx.id)}">${tx.id}</a>`
        }).then(() => {
          window.location.reload();
        });
      }
    });

    EventBus.$on('sign-error', async tx => {
      console.log(tx);
    });
  }
};
</script>

<style lang="scss" scoped>
.toggle-advanced-options {
  cursor: pointer;
  font-size: 14px;
}

.advanced-options {
  display: flex;
  flex-direction: column;
}
</style>