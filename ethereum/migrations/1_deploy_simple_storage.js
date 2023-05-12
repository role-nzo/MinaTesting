const Tictactoe = artifacts.require("Tictactoe");

module.exports = function (deployer, network, accounts) {
  console.log(accounts)
  try {
  deployer.deploy(Tictactoe, "0xBC9586C8b2EEdb09751803A982Fc122e7Ca9C463");
  } catch(e) {
    console.log(e)
  }
};