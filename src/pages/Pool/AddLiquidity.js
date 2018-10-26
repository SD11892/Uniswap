import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import PropTypes from 'prop-types';
import classnames from "classnames";
import { CSSTransitionGroup } from "react-transition-group";
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import NavigationTabs from '../../components/NavigationTabs';
import Modal from '../../components/Modal';
import { selectors, sync } from '../../ducks/web3connect';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';
import DropdownBlue from "../../assets/images/dropdown-blue.svg";
import DropupBlue from "../../assets/images/dropup-blue.svg";
import ModeSelector from './ModeSelector';
import {BigNumber as BN} from 'bignumber.js';
import EXCHANGE_ABI from '../../abi/exchange';
import "./pool.scss";
import promisify from "../../helpers/web3-promisfy";

const INPUT = 0;
const OUTPUT = 1;

class AddLiquidity extends Component {
  static propTypes = {
    isConnected: PropTypes.bool.isRequired,
    account: PropTypes.string.isRequired,
    selectors: PropTypes.func.isRequired,
    balances: PropTypes.object.isRequired,
    exchangeAddresses: PropTypes.shape({
      fromToken: PropTypes.object.isRequired,
    }).isRequired,
  };

  state = {
    inputValue: '',
    outputValue: '',
    inputCurrency: 'ETH',
    outputCurrency: '',
    lastEditedField: '',
    showSummaryModal: false,
  };

  shouldComponentUpdate(nextProps, nextState) {
    const { isConnected, account, exchangeAddresses, balances, web3 } = this.props;
    const { inputValue, outputValue, inputCurrency, outputCurrency, lastEditedField, showSummaryModal } = this.state;

    return isConnected !== nextProps.isConnected ||
      account !== nextProps.account ||
      exchangeAddresses !== nextProps.exchangeAddresses ||
      web3 !== nextProps.web3 ||
      balances !== nextProps.balances ||
      inputValue !== nextState.inputValue ||
      outputValue !== nextState.outputValue ||
      inputCurrency !== nextState.inputCurrency ||
      outputCurrency !== nextState.outputCurrency ||
      lastEditedField !== nextState.lastEditedField ||
      showSummaryModal !== nextState.showSummaryModal;
  }

  getBalance(currency) {
    const { selectors, account } = this.props;

    if (!currency) {
      return '';
    }

    const { value, decimals } = selectors().getBalance(account, currency);
    return `Balance: ${value.dividedBy(10 ** decimals).toFixed(4)}`;
  }

  isUnapproved() {
    const { account, exchangeAddresses, selectors } = this.props;
    const { outputCurrency } = this.state;

    if (!outputCurrency) {
      return false;
    }

    const { value, label } = selectors().getApprovals(
      outputCurrency,
      account,
      exchangeAddresses.fromToken[outputCurrency]
    );

    if (!label || value.isLessThan(BN(10 ** 22))) {
      return true;
    }

    return false;
  }

  onAddLiquidity = async () => {
    const { account, web3, exchangeAddresses: { fromToken }, selectors } = this.props;
    const { inputValue, outputValue, outputCurrency } = this.state;
    const exchange = new web3.eth.Contract(EXCHANGE_ABI, fromToken[outputCurrency]);

    const ethAmount = BN(inputValue).multipliedBy(10 ** 18);
    const { decimals } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);
    const tokenAmount = BN(outputValue).multipliedBy(10 ** decimals);
    const { value: ethReserve } = selectors().getBalance(fromToken[outputCurrency]);
    const totalLiquidity = await exchange.methods.totalSupply().call();
    const liquidityMinted = BN(totalLiquidity).multipliedBy(ethAmount.dividedBy(ethReserve));
    const blockNumber = await promisify(web3, 'getBlockNumber');
    const block = await promisify(web3, 'getBlock', blockNumber);
    const deadline = block.timestamp + 300;
    const MAX_LIQUIDITY_SLIPPAGE = 0.025;
    const minLiquidity = liquidityMinted.multipliedBy(1 - MAX_LIQUIDITY_SLIPPAGE);
    const maxTokens = tokenAmount.multipliedBy(1 + MAX_LIQUIDITY_SLIPPAGE);

    try {
      await exchange.methods.addLiquidity(minLiquidity.toFixed(0), maxTokens.toFixed(0), deadline).send({
        from: account,
        value: ethAmount.toFixed(0)
      });
    } catch (err) {
      console.error(err);
    }
  };

  onInputChange = value => {
    const { inputCurrency, outputCurrency } = this.state;
    const exchangeRate = this.getExchangeRate();
    let outputValue;

    if (inputCurrency === 'ETH' && outputCurrency && outputCurrency !== 'ETH') {
      outputValue = exchangeRate.multipliedBy(value).toFixed(7);
    }

    if (outputCurrency === 'ETH' && inputCurrency && inputCurrency !== 'ETH') {
      outputValue = BN(value).dividedBy(exchangeRate).toFixed(7);
    }

    this.setState({
      outputValue,
      inputValue: value,
      lastEditedField: INPUT,
    });
  };

  onOutputChange = value => {
    const { inputCurrency, outputCurrency } = this.state;
    const exchangeRate = this.getExchangeRate();
    let inputValue;

    if (inputCurrency === 'ETH' && outputCurrency && outputCurrency !== 'ETH') {
      inputValue = BN(value).dividedBy(exchangeRate).toFixed(7);
    }

    if (outputCurrency === 'ETH' && inputCurrency && inputCurrency !== 'ETH') {
      inputValue = exchangeRate.multipliedBy(value).toFixed(7);
    }

    this.setState({
      inputValue,
      outputValue: value,
      lastEditedField: OUTPUT,
    });
  };

  getExchangeRate() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const { inputCurrency, outputCurrency } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];

    if (!eth || !token) {
      return;
    }

    const { value: tokenValue } = selectors().getBalance(fromToken[token], token);
    const { value: ethValue } = selectors().getBalance(fromToken[token], eth);

    return tokenValue.dividedBy(ethValue);
  }

  validate() {
    const { selectors, account } = this.props;
    const {
      inputValue, outputValue,
      inputCurrency, outputCurrency,
    } = this.state;

    let inputError;
    let outputError;
    let isValid = true;
    const inputIsZero = BN(inputValue).isEqualTo(BN(0));
    const outputIsZero = BN(outputValue).isEqualTo(BN(0));

    if (!inputValue || inputIsZero || !outputValue || outputIsZero || !inputCurrency || !outputCurrency || this.isUnapproved()) {
      isValid = false;
    }

    const { value: ethValue } = selectors().getBalance(account, inputCurrency);
    const { value: tokenValue, decimals } = selectors().getBalance(account, outputCurrency);

    if (ethValue.isLessThan(BN(inputValue * 10 ** 18))) {
      inputError = 'Insufficient Balance';
    }

    if (tokenValue.isLessThan(BN(outputValue * 10 ** decimals))) {
      outputError = 'Insufficient Balance';
    }

    return {
      inputError,
      outputError,
      isValid: isValid && !inputError && !outputError,
    };
  }

  renderInfo() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const { inputCurrency, outputCurrency } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];

    if (!eth || !token) {
      return (
        <div className="pool__summary-panel">
          <div className="pool__exchange-rate-wrapper">
            <span className="pool__exchange-rate">Exchange Rate</span>
            <span> - </span>
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">Current Pool Size</span>
            <span> - </span>
          </div>
        </div>
      )
    }

    const {
      value: tokenValue,
      decimals,
      label
    } = selectors().getTokenBalance(token, fromToken[token]);

    const { value: ethValue } = selectors().getBalance(fromToken[token]);

    return (
      <div className="pool__summary-panel">
        <div className="pool__exchange-rate-wrapper">
          <span className="pool__exchange-rate">Exchange Rate</span>
          <span>{`1 ETH = ${tokenValue.dividedBy(ethValue).toFixed(4)} ${label}`}</span>
        </div>
        <div className="pool__exchange-rate-wrapper">
          <span className="swap__exchange-rate">Current Pool Size</span>
          <span>{` ${ethValue.dividedBy(10 ** 18).toFixed(2)} ${eth} + ${tokenValue.dividedBy(10 ** decimals).toFixed(2)} ${label}`}</span>
        </div>
      </div>
    )
  }

  renderSummary() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const {
      inputValue,
      outputValue,
      inputCurrency,
      outputCurrency,
    } = this.state;
    const inputIsZero = BN(inputValue).isEqualTo(BN(0));
    const outputIsZero = BN(outputValue).isEqualTo(BN(0));

    if (!inputCurrency || !outputCurrency) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>Select a token to continue.</div>
        </div>
      )
    }

    if (inputCurrency === outputCurrency) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>Must be different token.</div>
        </div>
      )
    }

    if (![inputCurrency, outputCurrency].includes('ETH')) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>One of the input must be ETH.</div>
        </div>
      )
    }

    if (inputIsZero || outputIsZero) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>Amount cannot be zero.</div>
        </div>
      )
    }

    if (this.isUnapproved()) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>Please unlock token to continue.</div>
        </div>
      )
    }

    const { value, decimals, label } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);

    if (!inputValue || !outputValue) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>{`Enter a ${inputCurrency} or ${label} value to continue.`}</div>
        </div>
      )
    }

    return [
      <div
        key="open-details"
        className="swap__summary-wrapper swap__open-details-container"
        onClick={() => this.setState({showSummaryModal: true})}
      >
        <span>Transaction Details</span>
        <img src={DropdownBlue} />
      </div>,
      this.renderSummaryModal()
    ];
  }

  renderSummaryModal() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const {
      inputValue,
      outputValue,
      inputCurrency,
      outputCurrency,
      showSummaryModal,
    } = this.state;
    if (!showSummaryModal) {
      return null;
    }

    const { value, decimals, label } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);

    const SLIPPAGE = 0.025;
    const minOutput = BN(outputValue).multipliedBy(1 - SLIPPAGE);
    const maxOutput = BN(outputValue).multipliedBy(1 + SLIPPAGE);
    const tokenReserve = value.dividedBy(10 ** decimals);
    const minPercentage = minOutput.dividedBy(minOutput.plus(tokenReserve)).multipliedBy(100);
    const maxPercentage = maxOutput.dividedBy(maxOutput.plus(tokenReserve)).multipliedBy(100);

    return (
      <Modal key="modal" onClose={() => this.setState({ showSummaryModal: false })}>
        <CSSTransitionGroup
          transitionName="summary-modal"
          transitionAppear={true}
          transitionLeave={true}
          transitionAppearTimeout={200}
          transitionLeaveTimeout={200}
          transitionEnterTimeout={200}
        >
          <div className="swap__summary-modal">
            <div
              key="open-details"
              className="swap__open-details-container"
              onClick={() => this.setState({showSummaryModal: false})}
            >
              <span>Transaction Details</span>
              <img src={DropupBlue} />
            </div>
            <div>
              <div>You are adding between {b(`${minOutput.toFixed(5)} - ${maxOutput.toFixed(5)} ${label}`)} + {b(`${BN(inputValue).toFixed(5)} ETH`)} into the liquidity pool.</div>
              <div className="pool__last-summary-text">
                You will receive between {b(`${minPercentage.toFixed(5)}%`)} and {b(`${maxPercentage.toFixed(5)}%`)} of the {`${label}/ETH`} pool tokens.
              </div>
            </div>
          </div>
        </CSSTransitionGroup>
      </Modal>
    );
  }

  render() {
    const {
      isConnected,
    } = this.props;

    const {
      inputValue,
      outputValue,
      inputCurrency,
      outputCurrency,
      lastEditedField,
    } = this.state;

    const { inputError, outputError, isValid } = this.validate();

    return [
      <div
        key="content"
        className={classnames('swap__content', {
          'swap--inactive': !isConnected,
        })}
      >
        <NavigationTabs
          className={classnames('header__navigation', {
            'header--inactive': !isConnected,
          })}
        />
        <ModeSelector />
        <CurrencyInputPanel
          title="Deposit"
          extraText={this.getBalance(inputCurrency)}
          onValueChange={this.onInputChange}
          selectedTokenAddress="ETH"
          value={inputValue}
          errorMessage={inputError}
          disableTokenSelect
        />
        <OversizedPanel>
          <div className="swap__down-arrow-background">
            <img className="swap__down-arrow" src={ArrowDown} />
          </div>
        </OversizedPanel>
        <CurrencyInputPanel
          title="Deposit"
          description="(estimated)"
          extraText={this.getBalance(outputCurrency)}
          selectedTokenAddress={outputCurrency}
          onCurrencySelected={currency => {
            this.setState({ outputCurrency: currency });
          }}
          onValueChange={this.onOutputChange}
          value={outputValue}
          errorMessage={outputError}
          filteredTokens={[ 'ETH' ]}
        />
        <OversizedPanel hideBottom>
          { this.renderInfo() }
        </OversizedPanel>
        <div className="pool__cta-container">
          <button
            className={classnames('pool__cta-btn', {
              'swap--inactive': !this.props.isConnected,
              'pool__cta-btn--inactive': !isValid,
            })}
            disabled={!isValid}
            onClick={this.onAddLiquidity}
          >
            Add Liquidity
          </button>
        </div>
      </div>,
      this.renderSummary()
    ];
  }
}

export default drizzleConnect(
  AddLiquidity,
  state => ({
    isConnected: Boolean(state.web3connect.account),
    account: state.web3connect.account,
    balances: state.web3connect.balances,
    web3: state.web3connect.web3,
    exchangeAddresses: state.addresses.exchangeAddresses,
  }),
  dispatch => ({
    selectors: () => dispatch(selectors()),
    sync: () => dispatch(sync()),
  })
)

function b(text) {
  return <span className="swap__highlight-text">{text}</span>
}
