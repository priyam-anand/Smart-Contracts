const DAO = artifacts.require("DAO");

module.exports = function(deployer) {
  deployer.deploy(DAO, 10, 5, 50);
};
