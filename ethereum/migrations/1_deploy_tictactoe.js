const Tictactoe = artifacts.require("Tictactoe");

let player0 = process.env["player0"];
let player1 = process.env["player1"];

module.exports = function (deployer, network, accounts) {
  console.log(accounts)

  try {
    deployer.deploy(Tictactoe, accounts[player1], { from: accounts[player0] });
  } catch(e) {
    console.log(e)
  }
};