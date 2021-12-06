const Wallet = artifacts.require('Wallet');
const {expectRevert} = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assert } = require('console');

contract('Wallet', (accounts) => {
  let wallet = null;
  before(async () => {
    wallet = await Wallet.deployed();
  });

  it("should create new transfer", async () => {
    await wallet.createTransfer(100,accounts[3],{from:accounts[0]});

    const transfer = await wallet.transfers(0);

    assert(transfer.id.toNumber() === 0);
    assert(transfer.amount.toNumber() === 100);
  })

  it("should NOT create new transfer", async () => {
    await expectRevert(
      wallet.createTransfer(
        100,
        accounts[3],
        {from:accounts[6]}
      ),
      'only approver allowed'
    );
  })

  it("should not send transfer if enought votes are not there", async () => {
    const initialBal = web3.utils.toBN(await web3.eth.getBalance(accounts[3]));
    await wallet.createTransfer(100,accounts[3],{from:accounts[0]});
    await wallet.sendTransfer(1,{from:accounts[0]});
    const finalBal = web3.utils.toBN(await web3.eth.getBalance(accounts[3]));

    assert(finalBal.sub(initialBal).toNumber() === 0);
  });

  it("should send transfer when enough votes are there", async () => {
    const initialBal = web3.utils.toBN(await web3.eth.getBalance(accounts[3]));
    await wallet.createTransfer(100,accounts[3],{from:accounts[0]});
    await wallet.sendTransfer(2,{from:accounts[0]});
    await wallet.sendTransfer(2,{from:accounts[1]});
    const finalBal = web3.utils.toBN(await web3.eth.getBalance(accounts[3]));
    assert(finalBal.sub(initialBal).toNumber() === 100);
  })
});
