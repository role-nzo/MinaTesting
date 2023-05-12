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

let player1Key: PrivateKey = PrivateKey.fromBase58("<inserire chiave privata giocatore>");
let player1: PublicKey = player1Key.toPublicKey();
let player2Key: PrivateKey = PrivateKey.fromBase58("<inserire chiave privata giocatore>");
let player2: PublicKey = player2Key.toPublicKey();

let zkAppPrivateKey: PrivateKey = PrivateKey.random();
let zkAppPublicKey: PublicKey = zkAppPrivateKey.toPublicKey();
let zkApp: TicTacToe = new TicTacToe(zkAppPublicKey);

console.log("Pre compiling")

let title = "ttt-compiling"

//START PROFILING compile
v8Profiler.startProfiling(title, true);

let { verificationKey } = await TicTacToe.compile();

//STOP PROFILING compile
let profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});


title = "fetching";

//START PROFILING fetching
v8Profiler.startProfiling(title, true);

await fetchAccount({ publicKey: zkAppPublicKey });
await fetchAccount({ publicKey: player1 });
await fetchAccount({ publicKey: player2 });

//STOP PROFILING fetching
profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});



// Creates a new instance of the contract
console.log('\n\n====== DEPLOYING ======\n\n');

let txn: any;

title = "deploy transaction";

//START PROFILING deploy transaction (NON ATTENDE L'INSERIMENTO NEL BLOCCO)
v8Profiler.startProfiling(title, true);

await deploy(player1Key, zkAppPrivateKey, zkApp, verificationKey);

//START PROFILING deploy transaction
profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});


//Attende che il deploy venga inserito in un blocco
await loopUntilAccountExists({
  account: zkAppPublicKey,
  eachTimeNotExist: () =>
  console.log('waiting for zkApp account to be deployed...'),
  isZkAppAccount: true,
});

//console.log("Prefetch: " + (Mina.getAccount(player1).nonce.toString()));
//await fetchAccount({ publicKey: player1 });
//console.log("Postfetch: " + (Mina.getAccount(player1).nonce.toString()));


txn = await Mina.transaction({sender: player1, fee: "100000000", nonce: +(Mina.getAccount(player1).nonce.toString())}, () => {
  zkApp.startGame(player1, player2);
})


title = "prove-startgame";

//START PROFILING start game prove
v8Profiler.startProfiling(title, true);

await txn.prove();

//STOP PROFILING start game prove
profile = v8Profiler.stopProfiling(title);
profile.export(function (error: any, result: any) {
  fs.writeFileSync(`${title}.cpuprofile`, result);
  profile.delete();
});

await txn.sign([zkAppPrivateKey, player1Key])

let res = await txn.send();


console.log('See startGame transaction at', 'https://berkeley.minaexplorer.com/transaction/' + res.hash());

let b;
//let stateChanged;

await res.wait();

await fetchAccount({ publicKey: zkAppPublicKey });
await fetchAccount({ publicKey: player1 });

// to avoid TS errors
/*player1Key = player1Key!;
player1 = player1!;
player2Key = player2Key!;
player2 = player2!;
zkAppPrivateKey = zkAppPrivateKey!;
zkAppPublicKey = zkAppPublicKey!;
zkApp = zkApp!;*/

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


console.log('did someone win?', zkApp.nextIsPlayer2.get().toBoolean() ? 'Player 1!' : 'Player 2!');

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
  
  let txn: any = await Mina.transaction({sender: currentPlayer, fee: "100000000", nonce: +(nonce.toString())}, async () => {
    const signature = Signature.create(currentPlayerKey, [x, y]);
    zkApp.play(currentPlayer, signature, x, y);
  });
  
  //Stampa il tempo necessario per eseguire la funzione "prove"
  await measureTime('"play" prove', async () => {
    title = `prove${x0.toString()}${y0.toString()}`;

    //START PROFILING play prove
    v8Profiler.startProfiling(title, true);
    
    await txn.prove();
    
    //STOP PROFILING play prove
    profile = v8Profiler.stopProfiling(title);
    profile.export(function (error: any, result: any) {
      fs.writeFileSync(`${title}.cpuprofile`, result);
      profile.delete();
    });
  });
  
  txn = await txn.sign([currentPlayerKey]).send()
  
  let state = zkApp.board.get();
  
  let stateChanged = false;
  
  //Stampa il tempo necessario affinché lo stato del contratto cambi
  //  ovvero attende che la transazione venga aggiunta in un blocco
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


//Util per stampare il tempo necessario per eseguire il callback
async function measureTime(str: string, callback: () => Promise<void>, width: number = 0) {
  console.warn(`${"\t".repeat(width)} +++ ${str}:`)
  let start = performance.now();
  await callback();
  let end = performance.now();
  console.warn(`${"\t".repeat(width)} --- ${str}: ${end - start}ms`)
}
  

//Attende che un certo account venga creato:
//  source: https://github.com/o1-labs/docs2/blob/main/examples/zkapps/interacting-with-zkApps-server-side/src/utils.ts
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