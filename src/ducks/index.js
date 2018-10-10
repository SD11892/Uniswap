import { combineReducers } from 'redux';
// import global from './global-reducer';
import web3 from './web3';
import exchangeContracts from './exchange-contract';
import tokenContracts from './token-contract';
import exchange from './exchange';
import swap from './swap';

export default combineReducers({
  web3,
  exchangeContracts,
  tokenContracts,
  exchange,
  swap,
});
