const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const DAO = artifacts.require('DAO');

contract('DAO', (accounts) => {
  let dao;

  const [investor1, investor2, investor3] = [accounts[1], accounts[2], accounts[3]];
  beforeEach(async () => {
    dao = await DAO.new(10, 5, 50);
  });

  it('Should accept contribution', async () => {
    const iniShares = web3.utils.toBN(await dao.shares(investor1));
    const iniTotalShares = web3.utils.toBN(await dao.totalShares());
    const iniFunds = web3.utils.toBN(await dao.availableFunds());

    await dao.contribute({ from: investor1, value: 1000 });

    const finalShares = web3.utils.toBN(await dao.shares(investor1));
    const finalTotalShares = web3.utils.toBN(await dao.totalShares());
    const finalFunds = web3.utils.toBN(await dao.availableFunds());


    assert(finalFunds.sub(iniFunds).toNumber() === 1000);
    assert(finalShares.sub(iniShares).toNumber() === 1000);
    assert(finalTotalShares.sub(iniTotalShares).toNumber() === 1000);

  });

  it('Should NOT accept contribution after contributionTime', async () => {
    await expectRevert(
      (
        time.increase(time.duration.seconds(10)),
        dao.contribute({ from: investor1, value: 1000 })
      )
      , "cannot contribute after contributionEnd"
    )
  });

  it('Should create proposal', async () => {
    await dao.contribute({ from: investor1, value: 1000 });
    await dao.contribute({ from: investor2, value: 1000 });
    await dao.contribute({ from: investor3, value: 1000 });

    await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 })

    const proposal = await dao.proposals(0);
    assert(proposal.id.toNumber() === 0);
    assert(proposal.name === 'Proposal');
    assert(proposal.amount.toNumber() === 1000);
  });

  it('Should NOT create proposal if not from investor', async () => {
    await expectRevert(
      (dao.contribute({ from: investor1, value: 1000 }),
        dao.contribute({ from: investor2, value: 1000 }),
        dao.contribute({ from: investor3, value: 1000 }),
        dao.createProposal("Proposal", 1000, accounts[4], { from: accounts[4] }))
      , "only investors"
    )
  });

  it('Should NOT create proposal if amount too big', async () => {
    await expectRevert(
      (dao.contribute({ from: investor1, value: 1000 }),
        dao.contribute({ from: investor2, value: 1000 }),
        dao.contribute({ from: investor3, value: 1000 }),
        dao.createProposal("Proposal", 5000, accounts[4], { from: investor1 }))
      , "amount too big"
    )
  });

  it('Should vote', async () => {
    await dao.contribute({ from: investor1, value: 1000 });
    await dao.contribute({ from: investor2, value: 1000 });
    await dao.contribute({ from: investor3, value: 1000 });

    await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 });

    await dao.vote(0, { from: investor1 });
    await dao.vote(0, { from: investor2 });

    const proposal = await dao.proposals(0);

    assert((proposal.votes).toNumber() === 2000);

  });

  it('Should NOT vote if not investor', async () => {
    try {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });

      await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 });

      await dao.vote(0, { from: accounts[0] });
      assert(false);
    } catch (err) {
      assert(err.message.includes("only investors"))
    }
  });

  it('Should NOT vote if already voted', async () => {
    try {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });

      await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 });

      await dao.vote(0, { from: investor1 });
      await dao.vote(0, { from: investor1 });
      assert(false);
    } catch (err) {
      assert(err.message.includes("investor can only vote once for a proposal"))
    }
  });

  it('Should NOT vote if after proposal end date', async () => {
    try {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });

      await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 });

      await time.increase(time.duration.seconds(10));

      await dao.vote(0, { from: investor1 });
      assert(false);
    } catch (err) {
      assert(err.message.includes("can only vote until proposal end date"))
    }
  });

  it('Should execute proposal', async () => {
    await dao.contribute({ from: investor1, value: 1000 });
    await dao.contribute({ from: investor2, value: 1000 });
    await dao.contribute({ from: investor3, value: 1000 });
    await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 });
    await dao.vote(0, { from: investor1 });
    await dao.vote(0, { from: investor2 });
    await time.increase(time.duration.seconds(10));

    const initialBal = web3.utils.toBN(await web3.eth.getBalance(accounts[4]));

    await dao.executeProposal(0, { from: accounts[0] });

    const finalBal = web3.utils.toBN(await web3.eth.getBalance(accounts[4]));

    assert(finalBal.sub(initialBal).toNumber() === 1000);

  });

  it('Should NOT execute proposal if not enough votes', async () => {
    try {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });
      await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 });
      await dao.vote(0, { from: investor1 });
      await time.increase(time.duration.seconds(10));

      await dao.executeProposal(0, { from: accounts[0] });

    } catch (err) {
      assert(err.message.includes("cannot execute proposal with votes # below quorum"))
    }
  });

  it('Should NOT execute proposal twice', async () => {
    try {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });
      await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 });
      await dao.vote(0, { from: investor1 });
      await dao.vote(0, { from: investor2 });
      await time.increase(time.duration.seconds(10));

      await dao.executeProposal(0, { from: accounts[0] });
      await dao.executeProposal(0, { from: accounts[0] });

    } catch (err) {
      assert(err.message.includes("cannot execute proposal already executed"));
    }
  });

  it('Should NOT execute proposal before end date', async () => {
    try {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });
      await dao.createProposal("Proposal", 1000, accounts[4], { from: investor1 });
      await dao.vote(0, { from: investor1 });
      await dao.vote(0, { from: investor2 });

      await dao.executeProposal(0, { from: accounts[0] });

    } catch (err) {
      assert(err.message.includes("cannot execute proposal before end date"));
    }
  });

  it('Should withdraw ether', async () => {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });

      const initialBal = web3.utils.toBN(await web3.eth.getBalance(accounts[4]));

      await dao.withdrawEther(1000,accounts[4],{from:accounts[0]});

      const finalBal = web3.utils.toBN(await web3.eth.getBalance(accounts[4]));

      assert(finalBal.sub(initialBal).toNumber() === 1000);
  });

  it('Should NOT withdraw ether if not admin', async () => {
    try {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });

      await dao.withdrawEther(1000,accounts[4],{from:accounts[1]});

    } catch (err) {
      assert(err.message.includes("only admin"))
    }
  });

  it('Should NOT withdraw ether if trying to withdraw too much', async () => {
    try {
      await dao.contribute({ from: investor1, value: 1000 });
      await dao.contribute({ from: investor2, value: 1000 });
      await dao.contribute({ from: investor3, value: 1000 });

      await dao.withdrawEther(5000,accounts[4],{from:accounts[0]});

    } catch (err) {
      assert(err.message.includes("not enough availableFunds"))
    }
  });
});
