const Voting = artifacts.require('Voting');

contract('Voting', (accounts) => {
  let voting = null;
  const voter = [accounts[1], accounts[2], accounts[3]];
  const admin = accounts[0];
  const nonVoter = accounts[4];

  before(async () => {
    voting = await Voting.deployed();
  });

  it("should add voters", async () => {
    await voting.addVoters(voter);
    const v1 = await voting.voters(voter[0]);
    const v2 = await voting.voters(voter[1]);
    const v3 = await voting.voters(voter[2]);
    assert(v1 && v2 && v3);
  });

  it("should create a new ballot", async () => {
    await voting.createBallot("Ballot 1", ["Choice 1", "Choice 2", "Choice 3"], 5, { from: admin });
    const ballot = await voting.ballots(0);
    assert(ballot.id.toNumber() === 0);
    assert(ballot.name === "Ballot 1");
  });

  it("should not create a new ballot if not from admin", async () => {
    try {
      await voting.createBallot("Ballot 1", ["Choice 1", "Choice 2", "Choice 3"], 10, { from: voter[1] });
    } catch (err) {
      assert(err.message.includes('only admin'))
    }
  });

  it("should not vote if not a voter", async () => {
    try {
      await voting.createBallot("Ballot 2", ["Choice 1", "Choice 2", "Choice 3"], 10, { from: admin })
      await voting.vote(1, 0, { from: nonVoter });
    } catch (err) {
      assert(err.message.includes("only voters can vote"))
    }
  });

  it("should not vote if out of time", async () => {
    await voting.createBallot("Ballot 3", ["Choice 1", "Choice 2", "Choice 3"], 2, { from: admin });
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      await voting.vote(2, 0, { from: voter[0] });
    } catch (err) {
      assert(err.message.includes("can only vote until ballot end date"));
    }
  });

  it("should not vote if already voted", async () => {
    await voting.createBallot("Ballot 4", ["Choice 1", "Choice 2", "Choice 3"], 4, { from: admin });
    await voting.vote(3, 0, { from: voter[0] });
    try {
      await voting.vote(3, 0, { from: voter[0] });
    } catch (err) {
      assert(err.message.includes("voter can only vote once for a ballot"))
    }
  });

  it("should vote",async ()=> {
    await voting.createBallot("Ballot 5",["Choice 1", "Choice 2", "Choice 3"], 4, { from: admin });
    const curr = (await voting.nextBallotId()).toNumber()-1;
    await voting.vote(curr,0,{from:voter[0]});
    await voting.vote(curr,0,{from:voter[1]});
    await voting.vote(curr,1,{from:voter[2]});

    await new Promise(resolve => setTimeout(resolve, 4000));

    const result =  await voting.results(curr);
    assert(result[0].votes === '2' && result[1].votes === '1' && result[2].votes === '0');

  });
});
