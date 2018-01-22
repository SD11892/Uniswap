import React from 'react';

function NetworkStatus(props) {
  let isConnected = props.connected
  let metamask = props.metamask
  let locked = props.locked

  if (isConnected){
    return (
      <div className="connection border pa2 green">
        <a href={'https://rinkeby.etherscan.io/search?q=' + props.address} target="_blank">{props.address}</a>
        <p>●</p>
      </div>
    )
  } else if (!metamask) {
    return (
      <div className="connection red border pa2">
        <p>{"Waiting for connection to the blockchain..."}</p>
        <p>●</p>
      </div>
    )
  } else if (locked && !isConnected) {
    return (
      <div className="connection yellow border pa2">
        <p>{"Waiting for Metamask to unlock..."}</p>
        <p>●</p>
      </div>
    )
  } else {
    return (
      <div className="connection yellow border pa2">
        <p>{'MetaMask connected to ' + props.network + ' Switch to Rinkeby and refresh!'}</p>
        <p>●</p>
      </div>
    )
  }
}

export default NetworkStatus;
