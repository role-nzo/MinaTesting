# MinaTesting

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

La funzione di "prove" associata ad ogni transazione è profilata. L'output sarà quindi un file `.cpuprofile` che può essere aperto dal profiler JS di Chrome (deprecato):
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