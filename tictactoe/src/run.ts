/**
 * This file specifies how to run the `TicTacToe` smart contract locally using the `Mina.LocalBlockchain()` method.
 * The `Mina.LocalBlockchain()` method specifies a ledger of accounts and contains logic for updating the ledger.
 *
 * Please note that this deployment is local and does not deploy to a live network.
 * If you wish to deploy to a live network, please use the zkapp-cli to deploy.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/run.js`.
 */

import {
  Field,
  PrivateKey,
  PublicKey,
  Mina,
  shutdown,
  isReady,
  AccountUpdate,
  Signature,
  fetchAccount,
} from 'snarkyjs';
import { TicTacToe, Board } from './tictactoe.js';
import { UInt32 } from 'snarkyjs';

import fs from 'fs';
import v8Profiler from 'v8-profiler-next';

v8Profiler.setGenerateType(1);


await isReady;
let Local = Mina.Network('https://proxy.berkeley.minaexplorer.com/graphql');
//let Local = Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);

let player1Key: PrivateKey = PrivateKey.fromBase58("EKEqP9Nmy8b1swxoTFmY7sHc7YkUmN8ZvihhnmMs6Ab8QxBgKKCu");
let player1: PublicKey = player1Key.toPublicKey(); //B62qqsgfiKUsSxUW7FrXqWpC2XWvULjeCfBfyN65cpAmKBjro2qptts
let player2Key: PrivateKey = PrivateKey.fromBase58("EKFZukJvtCDKSnXVYr7pDKMDW7zKeyosAZGdc8nAWgHV6FU1f38C");
let player2: PublicKey = player2Key.toPublicKey(); //B62qn93xuYN54t6RgJeHFjw1DmT5J3mkcgkwuD7h2DQeP179ca82B8R

//let zkAppPrivateKey: PrivateKey = PrivateKey.fromBase58("EKEMmitg5Dc4ZDZ2xzBvjHgL4rZpfXcbX9dnGpwVPvx5NMQ9Kw8p");
let zkAppPrivateKey: PrivateKey = PrivateKey.random();
let zkAppPublicKey: PublicKey = zkAppPrivateKey.toPublicKey(); //B62qqsKqEMAwL7EemMk5t5TKbdD5vHJaePmGvk7NeU6Bp6T6X8Tahz9
let zkApp: TicTacToe = new TicTacToe(zkAppPublicKey);

/*await measureTime('Calculating keys', async () => {
  await measureTime('Player 1 keys', async () => {
    await measureTime('Private', async () => {
      player1Key = PrivateKey.fromBase58("EKF93BH4g3UFCk17hUW5wyTTuhmcyrth35yZox1suWxsigAtjSzQ");
    }, 2);

    await measureTime('Public', async () => {
      player1 = player1Key.toPublicKey(); //B62qkAvQyCzQhakbvGuTLGu9ctGtij1nTvANrsMHhi74TPTGoQomSHp
    }, 2);
  }, 1);

  await measureTime('Player 2 keys', async () => {
    await measureTime('Private', async () => {
      player2Key = PrivateKey.fromBase58("EKEpGSrsQq6xQMYrri8pxzgtSE6fuDGKeGLQ2vnmoLeupd81TihX");
    }, 2);

    await measureTime('Public', async () => {
      player2 = player2Key.toPublicKey(); //B62qrHYtaRcwzEaLia5XtPmxu3ahBJwktbWmTsA2oJJQEdX9tQZuBh7
    }, 2);
  }, 1);

  await measureTime('zkApp', async () => {
    await measureTime('Private', async () => {
      zkAppPrivateKey = PrivateKey.fromBase58("EKFVgdHGMEef3tgVmL7QUrpxixTj4LMgj5G92ZbDeF1rxYRztVbs")//PrivateKey.random();
    }, 2);

    await measureTime('Public', async () => {
      zkAppPublicKey = zkAppPrivateKey.toPublicKey(); //B62qqD2J7qzG5Z6rUMxWnjw51DEn68JJg6B4gEZoTKXsM8AbE6Q8FUq
    }, 2);
    
    await measureTime('TicTacToe instance', async () => {
      zkApp = new TicTacToe(zkAppPublicKey);
    }, 2);
  }, 1);
});*/

console.log("Pre compiling")

/*const [
  { publicKey: , privateKey: pr1 },
  { publicKey: player2, privateKey: player2Key },
]*/ //= Local.testAccounts;
//Local.getAccount
let title = "ttt-compiling"
//await measureTime('Compiling', async () => {
v8Profiler.startProfiling(title, true);
let { verificationKey } = await TicTacToe.compile();
let profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  // if it doesn't have the extension .cpuprofile then
  // chrome's profiler tool won't like it.
  // examine the profile:
  //   Navigate to chrome://inspect
  //   Click Open dedicated DevTools for Node
  //   Select the profiler tab
  //   Load your file
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});
//});

console.log("Pre fetching")

//await measureTime('Fetching accounts', async () => {
title = "fetching";
v8Profiler.startProfiling(title, true);
await fetchAccount({ publicKey: zkAppPublicKey });
await fetchAccount({ publicKey: player1 });
await fetchAccount({ publicKey: player2 });
profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});
//});

// Create a new instance of the contract
console.log('\n\n====== DEPLOYING ======\n\n');

let txn: any;

title = "deploy transaction";
v8Profiler.startProfiling(title, true);

await deploy(player1Key, zkAppPrivateKey, zkApp, verificationKey);

profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});

await loopUntilAccountExists({
  account: zkAppPublicKey,
  eachTimeNotExist: () =>
    console.log('waiting for zkApp account to be deployed...'),
  isZkAppAccount: true,
});

console.log("Prefetch: " + (Mina.getAccount(player1).nonce.toString()));
await fetchAccount({ publicKey: player1 });
console.log("Postfetch: " + (Mina.getAccount(player1).nonce.toString()));

//---------------------------DELETE COMMENT!!!
txn = await Mina.transaction({sender: player1, fee: "100000000", nonce: +(Mina.getAccount(player1).nonce.toString())}, () => {
  //AccountUpdate.fundNewAccount(player1);
  //zkApp.deploy();
  zkApp.startGame(player1, player2);
})

//await measureTime('"Start game" prove', async () => {
title = "prove-startgame";
v8Profiler.startProfiling(title, true);
await txn.prove();
profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});
//});

/**
 * note: this tx needs to be signed with `tx.sign()`, because `deploy` uses `requireSignature()` under the hood,
 * so one of the account updates in this tx has to be authorized with a signature (vs proof).
 * this is necessary for the deploy tx because the initial permissions for all account fields are "signature".
 * (but `deploy()` changes some of those permissions to "proof" and adds the verification key that enables proofs.
 * that's why we don't need `tx.sign()` for the later transactions.)
 */
//---------------------------DELETE COMMENT!!!
//await measureTime('"Start game" sign', async () => {
await txn.sign([zkAppPrivateKey, player1Key])
//})
//await measureTime('"Start game" send', async () => {
let res = await txn.send();

console.log(
  'See startGame transaction at',
  'https://berkeley.minaexplorer.com/transaction/' + res.hash()
);

//})
let b;
let stateChanged;

await res.wait();

await fetchAccount({ publicKey: zkAppPublicKey });
await fetchAccount({ publicKey: player1 });

// to avoid TS errors
player1Key = player1Key!;
player1 = player1!;
player2Key = player2Key!;
player2 = player2!;
zkAppPrivateKey = zkAppPrivateKey!;
zkAppPublicKey = zkAppPublicKey!;
zkApp = zkApp!;

// initial state
b = zkApp.board.get();

//---------------------------SET TO FALSE!!!
/*stateChanged = false;
while (!stateChanged) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await fetchAccount({ publicKey: zkAppPublicKey });
  await fetchAccount({ publicKey: player1 });

  stateChanged = !zkApp.board.get().equals(b).toBoolean();
  new Board(zkApp.board.get()).printState();
}*/

console.log('initial state of the zkApp');
let zkAppState = Mina.getAccount(zkAppPublicKey).zkapp?.appState;
for (const i in [0, 1, 2, 3, 4, 5, 6, 7]) {
  console.log('state', i, ':', zkAppState?.[i].toString());
}


console.log('\ninitial board');
new Board(b).printState();
let firstPlay = true;
//throw "";

// play
console.log('\n\n====== FIRST MOVE ======\n\n');
await makeMove(player1, player1Key, 0, 0);
// debug
b = zkApp.board.get();
new Board(b).printState();

// play
console.log('\n\n====== SECOND MOVE ======\n\n');
await makeMove(player2, player2Key, 1, 0);
// debug
b = zkApp.board.get();
new Board(b).printState();

// play
console.log('\n\n====== THIRD MOVE ======\n\n');
await makeMove(player1, player1Key, 1, 1);
// debug
b = zkApp.board.get();
new Board(b).printState();

// play
console.log('\n\n====== FOURTH MOVE ======\n\n');
await makeMove(player2, player2Key, 2, 1);
// debug
b = zkApp.board.get();
new Board(b).printState();

// play
console.log('\n\n====== FIFTH MOVE ======\n\n');
await makeMove(player1, player1Key, 2, 2);
// debug
b = zkApp.board.get();
new Board(b).printState();


console.log(
  'did someone win?',
  zkApp.nextIsPlayer2.get().toBoolean() ? 'Player 1!' : 'Player 2!'
);

// cleanup
await shutdown();

async function makeMove(
  currentPlayer: PublicKey,
  currentPlayerKey: PrivateKey,
  x0: number,
  y0: number
) {
  const [x, y] = [Field(x0), Field(y0)];
  let nonce: UInt32 = Mina.getAccount(currentPlayer).nonce;
  
  /*await measureTime('getAccount', async () => {
    nonce = ;
    if(!firstPlay) {
      nonce = nonce.add(1);
    } else firstPlay = !firstPlay;
  })*/

  let txn: any;
//console.log(txn)
  //await measureTime('"play" transaction', async () => {
    txn = await Mina.transaction({sender: currentPlayer, fee: "100000000", nonce: +(nonce.toString())}, async () => {
      //let signature: any;

      //await measureTime('Signature.create', async () => {
        const signature = Signature.create(currentPlayerKey, [x, y]);
      //}, 1);

      //await measureTime('zkApp.play', async () => {
        zkApp.play(currentPlayer, signature, x, y);
      //}, 1);
    });
  //})
  //console.log(txn)
  await measureTime('"play" prove', async () => {
title = `prove${x0.toString()}${y0.toString()}`;
v8Profiler.startProfiling(title, true);

await txn.prove();

profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});
  });
  
  //await measureTime('"play" sign', async () => {
    txn = await txn.sign([currentPlayerKey]).send()
  //});

  /*await measureTime('"play" send', async () => {
    await txn.send();
  });*/

  let state = zkApp.board.get();
  //console.log(state)
  let stateChanged = false;
  await measureTime('"play" state change', async () => {
    while (!stateChanged) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await fetchAccount({ publicKey: zkAppPublicKey });
      await fetchAccount({ publicKey: currentPlayer });
      //console.log(zkApp.board.get())
      stateChanged = !zkApp.board.get().equals(state).toBoolean();

    }
  });
}

/*async function waitNextBlock() {
  let l = (Mina.getNetworkState()).blockchainLength;
  console.log(`Current length: ${l}; waiting...`);
  
  let resolver;
  let p = new Promise((r) => resolver = r)

  let i = setInterval({
    if(l != (await Mina.getNetworkState()).blockchainLength) {

    }
  }, 1000);

  return p;
}*/

async function measureTime(str: string, callback: () => Promise<void>, width: number = 0) {
  console.warn(`${"\t".repeat(width)} +++ ${str}:`)
  let start = performance.now();
  await callback();
  let end = performance.now();
  console.warn(`${"\t".repeat(width)} --- ${str}: ${end - start}ms`)
}

async function loopUntilAccountExists(
  { account,
    eachTimeNotExist,
    isZkAppAccount
  }:
  { account: PublicKey,
    eachTimeNotExist: () => void,
    isZkAppAccount: boolean
  }
) {
  for (;;) {
    let response = await fetchAccount({ publicKey: account });
    let accountExists = response.error == null;
    if (isZkAppAccount) {
      accountExists = accountExists && response.account!.zkapp?.appState != null;
    }
    if (!accountExists) {
      await eachTimeNotExist();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      // T-12 add optional check that verification key is correct once this is available in SnarkyJS
      return response.account!;
    }
  }
};

async function deploy(
  deployerPrivateKey: PrivateKey,
  zkAppPrivateKey: PrivateKey,
  zkapp: TicTacToe,
  verificationKey: { data: string; hash: string | Field }
) {
  let sender = deployerPrivateKey.toPublicKey();
  let zkAppPublicKey = zkAppPrivateKey.toPublicKey();
  console.log('using deployer private key with public key', sender.toBase58());
  console.log(
    'using zkApp private key with public key',
    zkAppPublicKey.toBase58()
  );

  let { account } = await fetchAccount({ publicKey: zkAppPublicKey });
  let isDeployed = account?.zkapp?.verificationKey !== undefined;

  if (isDeployed) {
    console.log(
      'zkApp for public key',
      zkAppPublicKey.toBase58(),
      'found deployed'
    );
  } else {
    console.log('Deploying zkapp for public key', zkAppPublicKey.toBase58());
    let transaction = await Mina.transaction(
      { sender, fee: 100_000_000, nonce: +(Mina.getAccount(sender).nonce.toString()) },
      () => {
        AccountUpdate.fundNewAccount(sender);
        // NOTE: this calls `init()` if this is the first deploy
        zkapp.deploy({ zkappKey: zkAppPrivateKey, verificationKey });
      }
    );
    await transaction.prove();
    transaction.sign([deployerPrivateKey, zkAppPrivateKey]);

    console.log('Sending the deploy transaction...');
    const res = await transaction.send();
    const hash = res.hash();
    if (hash === undefined) {
      console.log('error sending transaction (see above)');
    } else {
      console.log(
        'See deploy transaction at',
        'https://berkeley.minaexplorer.com/transaction/' + hash
      );
      console.log('waiting for zkApp account to be deployed...');
      await res.wait();
      isDeployed = true;
    }
  }
  return isDeployed;
}