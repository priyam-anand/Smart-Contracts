const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert } = require('console');
const { stat } = require('fs');
const StateMachine = artifacts.require('StateMachine.sol');

contract('StateMachine', (accounts) => {
  let stateMachine;
  const amount = 1000;
  const interest = 100;
  const duration = 100;

  const [borrower, lender] = [accounts[1], accounts[2]];
  before(async () => {
    stateMachine = await StateMachine.deployed();
  });

  it('Should NOT accept fund if not lender', async () => {
    await expectRevert(
      (stateMachine.fund({from:borrower,value:1000}))
      ,"only lender can lend"
    )
  });

  it('Should NOT accept fund if not exact amount', async () => {
    await expectRevert(
      (stateMachine.fund({from:lender,value:100}))
      ,"can only lend the exact amount"
    )
  });

  it('Should accept fund', async () => {
    const initialBal = web3.utils.toBN(await web3.eth.getBalance(borrower));
    await stateMachine.fund({from:lender,value:amount});
    const finalBal = web3.utils.toBN(await web3.eth.getBalance(borrower));
    assert(finalBal.sub(initialBal).toNumber()===amount);
  });

  it('Should NOT reimburse if loan hasnt matured yet', async () => {
    await expectRevert(
      (stateMachine.reimburse({from:borrower,value:amount+interest})),
      "loan hasnt matured yet"
    )
  });

  it('Should NOT reimburse if not borrower', async () => {
    await expectRevert(
      (time.increase(time.duration.seconds(duration)),
      stateMachine.reimburse({from:lender,value:amount+interest})
      )
      ,"only borrower can reimburse"
    )
  });

  it('Should NOT reimburse if not exact amount', async () => {
    await expectRevert(
      (time.increase(time.duration.seconds(duration)),
      stateMachine.reimburse({from:borrower,value:amount})
      )
      ,"borrower need to reimburse exactly amount + interest"
    )
  });  
  it('Should reimburse', async () => {
  
    const initialBal = web3.utils.toBN(await web3.eth.getBalance(lender));
    await stateMachine.reimburse({from:borrower,value:amount+interest});
    const finalBal = web3.utils.toBN(await web3.eth.getBalance(lender));

    assert(finalBal.sub(initialBal).toNumber() === amount+interest);
  });
});
