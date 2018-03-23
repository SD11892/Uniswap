import React, { Component }from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { subscribe } from 'redux-subscriber';
import { setWeb3ConnectionStatus, setInteractionState, setNetworkMessage, metamaskLocked } from '../actions/web3-actions';

class NetworkStatus extends Component {
  componentDidMount(){
    const interactionStateSubscriber = subscribe('web3Store.metamaskLocked', state => {
      if (state.web3Store.metamaskLocked !== true) {
        console.log('metamask is unlocked')
        this.checkNetwork();
      } else { 
        console.log('metamask is locked')
      }
    })
    // if (this.props.web3Store.web3 !== undefined){
    //   this.checkNetwork();
    // } 
  }

  checkNetwork = () => {
    this.props.web3Store.web3.eth.net.getNetworkType((err, networkId) => {
      console.log("Connected to " + networkId)
      let interactionState = networkId === 'rinkeby' ? 'connected' : 'disconnected';
      let connectionStatus = networkId === 'rinkeby' ? true : false;
      this.props.setNetworkMessage(networkId);
      this.props.setWeb3ConnectionStatus(connectionStatus);
      this.props.setInteractionState(interactionState);
    })
  } 

  render () {
    if (this.props.web3Store.connected && this.props.web3Store.interaction !== 'disconnected'){
      return (
        <div className="connection border pa2 green">
          <a target="_blank" rel="noopener noreferrer" href={'https://rinkeby.etherscan.io/search?q=' + this.props.web3Store.currentMaskAddress}>{this.props.web3Store.currentMaskAddress}</a>
          <p>●</p>
        </div>
      )
    } else if (!this.props.metamask) {
      return (
        <div className="connection red border pa2">
          <p>{"Waiting for connection to the blockchain..."}</p>
          <p>●</p>
        </div>
      )
    } else if (this.props.web3Store.metamaskLocked && !this.props.web3Store.connected) {
      return (
        <div className="connection yellow border pa2">
          <p>{"Waiting for Metamask to unlock..."}</p>
          <p>●</p>
        </div>
      )
    } else {
      return (
        <div className="connection yellow border pa2">
          <p>{'MetaMask connected to ' + this.props.web3Store.networkMessage + ' Switch to Rinkeby and refresh!'}</p>
          <p>●</p>
        </div>
      )
    }
  }
}
const mapStateToProps = state => ({
  global: state.global,
  web3Store: state.web3Store,
  exchange: state.exchange
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    setWeb3ConnectionStatus,
    setInteractionState,
    setNetworkMessage,
    metamaskLocked
  }, dispatch)
}

export default connect (mapStateToProps, mapDispatchToProps)(NetworkStatus);