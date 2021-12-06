const Escrow = artifacts.require('Escrow');

const assertError = async (promise, error) => {
  try {
    await promise;
  } catch(e) {
    assert(e.message.includes(error))
    return;
  }
  assert(false);
}

contract('Escrow', (accounts) => {
  let escrow = null;
  const payer = accounts[1];
  const payee = accounts[2];
  const lawyer = accounts[0];

  before(async () => {
    escrow = await Escrow.deployed();
  });
  it("should deposit the amount", async () => {
    const intialBal = web3.utils.toBN(await escrow.balanceOf());
    await escrow.deposit({from:payer,value:1000});
    const finalBal = web3.utils.toBN(await escrow.balanceOf());
    assert(finalBal.sub(intialBal).toNumber() === 1000);
  });
  it("should not deposit if amount is satified", async () => {
    try {
      await escrow.deposit({from:payer,value:500});
      assert(false);
    } catch (err) {
      assert(err.message.includes('Cant send more than escrow amount'));
    }
  })

  it("should not deposit if sender is not payer", async () => {
    try {
      await escrow.deposit({from:lawyer,value:100});
      assert(false);
    } catch (err) {
      assert(err.message.includes("Sender must be the payer"))
    }
  })

  it("should release funds", async () => {
    const initialBal = web3.utils.toBN(await web3.eth.getBalance(payee));
    await escrow.release({from:lawyer});
    const finalBal = web3.utils.toBN(await web3.eth.getBalance(payee));

    assert(finalBal.sub(initialBal).toNumber() === 1000);
  })

  it("should not release funds if amount is not full", async () => {
    const escrow = await Escrow.new(payer,payee,1000);
    await escrow.deposit({from:payer,value:100});
    try {
      await escrow.release({from:lawyer});
      assert(false);
    } catch (err) {
      assert(err.message.includes("cannot release funds before full amount is sent"))
    }
  });
  it("should not release funds if not called by the lawyer", async () => {
    const escrow = await Escrow.new(payer,payee,1000);
    await escrow.deposit({from:payer,value:1000});
    try {
      await escrow.release({from:payee});
      assert(false);
    } catch (err) {
      assert(err.message.includes("only lawyer can release funds"))
    }
  })
});

