const DeedMultiPayout = artifacts.require("DeedMultiPayout");

module.exports = function(deployer, _network, accounts) {
  deployer.deploy(DeedMultiPayout, accounts[0], accounts[1], 2, {value: 100});
};
