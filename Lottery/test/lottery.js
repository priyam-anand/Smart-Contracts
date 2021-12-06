const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert } = require('console');
const Lottery = artifacts.require('Lottery.sol');

contract('Lottery', (accounts) => {
  let lottery;
  beforeEach(async () => {
    lottery = await Lottery.new(2);
  });
  
  it('Should NOT create bet if not admin', async () => {
    await expectRevert(
      lottery.createBet(10,10,{from:accounts[1]})
      ,"only admin"
    )
  });

  it('Should create a bet', async () => {
    const stateBefore = await lottery.currentState();
    await lottery.createBet(10,10,{from:accounts[0]});
    const stateAfter = await lottery.currentState();
    assert(stateAfter.sub(stateBefore).toNumber()===1);
  });

  it('Should NOT create bet if state not idle', async () => {
    await lottery.createBet(10,10,{from:accounts[0]});
    await expectRevert(
      lottery.createBet(10,10,{from:accounts[0]})
      ,"current state does not allow this"
    )
  });

  it('Should NOT bet if not in state BETTING', async () => {
    await expectRevert(
      lottery.bet({from:accounts[1],value:10}),
      "current state does not allow this"
    )
  });

  it('Should NOT bet if not sending exact bet amount', async () => {
    await lottery.createBet(10,10,{from:accounts[0]});
    await expectRevert(
      lottery.bet({from:accounts[1],value:9})
      ,"can only bet exactly the bet size"
    )
  });

  it('Should bet', async () => {

    const playersIni = await lottery.getLength();
    await lottery.createBet(5,10,{from:accounts[0]});
    await lottery.bet({from:accounts[1],value:10});
    const playersFinal = await lottery.getLength();    
    assert(playersFinal.sub(playersIni).toNumber() === 1);
  });

  it('Should NOT cancel if not betting', async () => {
    await expectRevert(
      lottery.cancel({from:accounts[0]})
      , "current state does not allow this"
    )
  });

  it('Should NOT cancel if not admin', async () => {
    await lottery.createBet(10,10,{from:accounts[0]});
    const state = await lottery.currentState();
    await expectRevert(
      lottery.cancel({from:accounts[1]})
      , "only admin"
    )
  });

  it('Should cancel', async () => {
    await lottery.createBet(10,10,{from:accounts[0]});
    await lottery.bet({from:accounts[3],value:10});
    await lottery.bet({from:accounts[4],value:10});

    const iniState = await lottery.currentState();
    const iniSize = await lottery.getLength();
    await lottery.cancel({from:accounts[0]});
    const finalSize = await lottery.getLength();
    const finalState = await lottery.currentState();

    assert(iniState.sub(finalState).toNumber() === 1);
    assert(iniSize.sub(finalSize).toNumber() === 2);
  });
});
