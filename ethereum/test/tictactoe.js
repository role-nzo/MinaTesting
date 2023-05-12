const Tictactoe = artifacts.require("./Tictactoe.sol");
const v8Profiler = require('v8-profiler-next');
const fs = require('fs');

let player0 = process.env["player0"];
let player1 = process.env["player1"];

async function profile(title, callback, sync = true) {
  v8Profiler.startProfiling(title, true);
  
  if(sync)
    await callback()
  else
    callback()

  let profile = v8Profiler.stopProfiling(title);
  profile.export(function (error, result) {
    fs.writeFileSync(`./profiles/${title}.cpuprofile`, result);
    profile.delete();
  });
}

contract("Tictactoe", accounts => {
  
  it("New game sync", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    await profile('new-game-sync', async () => await tictactoeInstance.newGame({ from: accounts[player0] }));
  });

  it("New game async", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    let promise;

    await profile('new-game-async', () => promise = tictactoeInstance.newGame({ from: accounts[player0] }), false);

    await promise;
  });

  it("First move", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    await profile('first-move', async () => await tictactoeInstance.move(0, { from: accounts[player0] }));
  });

  it("Second move", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    await profile('second-move', async () => await tictactoeInstance.move(1, { from: accounts[player1] }));
  });

  it("Third move", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    await profile('third-move', async () => await tictactoeInstance.move(4, { from: accounts[player0] }));
  });

  it("Fourth move", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    await profile('fourth-move', async () => await tictactoeInstance.move(5, { from: accounts[player1] }));
  });

  it("Fifth move", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    await profile('fifth-move', async () => await tictactoeInstance.move(8, { from: accounts[player0] }));
  });
  
  it("Check winner", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    /// checks if `_playerId` has made win
    /// 1 => means the `_playerId` has won
    /// 2 => means no more fields to play, then it's a draw
    /// 0 => continue to play

    await profile('check-player-0', async () => console.log("Player 0: " + await tictactoeInstance.checkState.call(0)));
    await profile('check-player-1', async () => console.log("Player 1: " + await tictactoeInstance.checkState.call(1)));
  });

  //restituisce correttamente un errore (gioco finito)
  it("Sixth move", async () => {
    const tictactoeInstance = await Tictactoe.deployed();

    try {
      await tictactoeInstance.move(7, { from: accounts[player1] });
      throw null;
    }
    catch (error) {
      assert(error.message, "Game has ended");
    }
  });
});
