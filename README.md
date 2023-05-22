# MinaTesting

*__Attività Progettuale di Calcolatori Elettronici M__<br>
Lorenzo Ziosi<br>
Prof. Andrea Bartolini<br>
Supervisors: Nicola Elia, Francesco Barchi*

Nella directory `tictactoe` è presente la zkApp di esempio TicTacToe con una unit di test ([`tictactoe\src\run.ts`](https://github.com/role-nzo/MinaTesting/blob/master/tictactoe/src/run.ts)) rivisitata per supportare la testnet Berkeley. Il repository originale è al seguente link: [TicTacToe (Mina)](https://github.com/o1-labs/zkapp-cli/tree/main/examples/tictactoe/ts/src).

La directory `ethereum` contiene invece un contratto analogo scritto in Solidity per comparare le performance della EVM (network BSC) con quelle di Mina. Il repository originale è al seguente link: [TicTacToe (Solidity)](https://github.com/0xosas/tictactoe.sol/tree/master/contracts).

## Come eseguire test su mina

Il test ([`tictactoe\src\run.ts`](https://github.com/role-nzo/MinaTesting/blob/master/tictactoe/src/run.ts)) prevede:
- deploy di un nuovo contratto TicTacToe (indirizzo casuale generato runtime)
- transazione per l'inizio di una nuova partita
- transazione per la prima mossa (giocatore 1)
- transazione per la seconda mossa (giocatore 2)
- transazione per la terza mossa (giocatore 1)
- transazione per la quarta mossa (giocatore 2)
- transazione per la quinta mossa (giocatore 1)
- controllo (sullo stato locale, nessuna transazione!) del vincitore

La funzione di "prove" associata ad ogni transazione è profilata. L'output sarà quindi un file `.cpuprofile` che può essere aperto da VS Code o dal profiler JS di Chrome (deprecato):
- apreire [`chrome://inspect`](chrome://inspect)
- Cliccare "Open dedicated DevTools for Node"
- Selezionare il tab "Profili"
- Carica il file

Per eseguire i test sulla testnet Berkeley di Mina è necessario:
- creare due coppie di chiavi pubbliche/private ([guida ufficiale](https://docs.minaprotocol.com/node-operators/generating-a-keypair#using-mina-generate-keypair))
- avere fondi necessari su tali indirizzi per poter eseguire transazioni ([faucet Berkley](https://faucet.minaprotocol.com/))
- inserire le chiavi private nel file di test (cerca `<inserire chiave privata giocatore>`)

La test unit e le librerie sono scritte sono scritte in TypeScript; è quindi necessario effettuare il build prima dell'esecuzione:
```sh
npm run build
```
Per eseguire è sufficiente eseguire
```sh
npm run start
```
Shorthand (compilazione ed esecuzione):
```
npm run build && npm run start
```

È possibile verificare tutte le transazioni di un indirizzo utilizzando l'explorer: [https://berkeley.minaexplorer.com/wallet/<_indirizzo_>](https://berkeley.minaexplorer.com/)

## Come eseguire test sulla EVM (Binance Smart Chain)

Il test sviluppato prevede:
- transazione (sincrona) per nuovo gioco
- transazione (asincrona) per nuovo gioco (per scopi di profiling - durante il profiling NON si attende l'aggiunta del nuovo blocco)
- transazione per la prima mossa (giocatore 1)
- transazione per la seconda mossa (giocatore 2)
- transazione per la terza mossa (giocatore 1)
- transazione per la quarta mossa (giocatore 2)
- transazione per la quinta mossa (giocatore 1)
- controllo stato giocatore 1 (sullo stato remoto ma essendo di sola lettura non è necessaria una transazione!)
- controllo stato giocatore 2 (idem)
- transazione per la sesta mossa (giocatore 2), viene gestito il revert (fallimento) in quanto il gioco è terminato

È disponibile una guida specifica della suite Truffle utilizzata in [`/ethereum/README.md`](ethereum\README.md).

In breve:
- rinominare il file `.env.tmp` in `.env`
- inserire il mnemonic (12/24 word phrase) da cui verranno generati 10 indirizzi
```
MNEMONIC="<word_1> ... <word_n>"
```
- inserire, senza apici, l'indice del giocatore uno (da 0 a 9, default 0) e l'indice del giocatore due (da 0 a 9, default 1)
```
player0=<giocatore_0>
player1=<giocatore_1>
```
- eseguire
```
truffle test --config=truffle-config.bsc.js --network="bscTestnet"
```

Per questione di semplicità il deployer del contratto coinciderà con il player 0.

È possibile verificare tutte le transazioni di un indirizzo utilizzando l'utilissimo e popolarissimo scanner: [https://testnet.bscscan.com/address/<_indirizzo_>](https://testnet.bscscan.com/)
