const crypto = require('crypto');
const readline = require('readline');
const Table = require('cli-table3');

class RandomNumberGenerator {
  static generateKey(lengthInBytes) {
    return crypto.randomBytes(lengthInBytes);
  }
}

class ResultCalculator {
  static getResult(move1, move2, moves) {
    const totalMoves = moves.length;
    const move1Index = moves.indexOf(move1);
    const move2Index = moves.indexOf(move2);

    const distanceClockwise = (move2Index - move1Index + totalMoves) % totalMoves;
    const distanceCounterClockwise = (move1Index - move2Index + totalMoves) % totalMoves;

    if (distanceClockwise === distanceCounterClockwise) {
      return 'Draw';
    } else if (distanceClockwise < distanceCounterClockwise) {
      return 'Win';
    } else {
      return 'Lose';
    }
  }
}



class MoveTableGenerator {
  constructor(moves) {
    this.moves = moves;
    this.table = this.generateTable();
  }

  generateTable() {
    const size = this.moves.length;
    const table = new Array(size).fill(null).map(() => new Array(size).fill(null));

    for (let i = 0; i < size; i++) {
      table[i][0] = this.moves[i];
      for (let j = 0; j < size; j++) {
        const result = ResultCalculator.getResult(this.moves[i], this.moves[j], this.moves);
        table[i][j + 1] = result;
      }
    }

    return table;
  }

  renderTable() {
    const table = new Table({
      head: ['v PC\\User >', ...this.moves],
      style: { head: ['green'] },
    });

    for (let i = 0; i < this.table.length; i++) {
      const row = [this.moves[i], ...this.table[i].slice(1)];
      table.push(row);
    }

    console.log('The result is described from the user\'s point of view');
    console.log('Example: If "User" selects "scissors" and "PC" selects "paper", the result is "Win".');
    console.log(table.toString());
  }
}

class GameRules {
  constructor(moves) {
    this.moves = moves;
    this.resultTable = this.generateResultTable();
  }

  generateResultTable() {
    const size = this.moves.length + 1;
    const table = new Array(size).fill(null).map(() => new Array(size).fill(null));

    for (let i = 0; i < this.moves.length; i++) {
      table[0][i + 1] = this.moves[i];
      table[i + 1][0] = this.moves[i];
    }

    for (let i = 0; i < this.moves.length; i++) {
      for (let j = 0; j < this.moves.length; j++) {
        const result = ResultCalculator.getResult(this.moves[i], this.moves[j], this.moves);
        table[i + 1][j + 1] = result;
      }
    }

    return table;
  }

  getGameResult(move1, move2) {
    const move1Index = this.moves.indexOf(move1);
    const move2Index = this.moves.indexOf(move2);
    return this.resultTable[move1Index + 1][move2Index + 1]

  }




  printHelp() {
    console.log("Available moves:");
    for (let i = 0; i < this.moves.length; i++) {
      console.log(`${i + 1} - ${this.moves[i]}`);
    }
    console.log("0 - exit");
    console.log("? - help");
  }
}

class RandomChoiceGame {
  constructor(moves) {
    this.moves = moves;
    this.key = RandomNumberGenerator.generateKey(32);
    this.hmac = null;
    this.computerMove = null;
    this.gameRules = new GameRules(moves);
  }

  play() {
    console.log(`HMAC: ${crypto.createHmac('sha256', this.key).update(this.computerMove).digest('hex')}`);
    this.gameRules.printHelp();
  }

  async getUserMove() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question("Enter your move: ", (answer) => {
        rl.close();
        const move = this.moves[parseInt(answer) - 1];
        if (!move && answer !== '?' && answer !== '0') {
          console.log("incorrect input...");
          resolve(this.getUserMove());
        } else if (answer === '?') {
          const tableGenerator = new MoveTableGenerator(this.moves);
          tableGenerator.renderTable();
          this.gameRules.printHelp();
          resolve(this.getUserMove());
        } else if (answer === '0') {
          console.log('Exit...');
          process.exit(0);
        } else {
          resolve(move);
        }
      });
    });
  }

  startGame() {
    this.computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
    this.play();
    return this.getUserMove();
  }

  determineWinner(userMove) {
    const result = this.gameRules.getGameResult(userMove, this.computerMove);
    if (result === 'Win') {
      return "You win!";
    } else if (result === 'Lose') {
      return "You lose!";
    } else {
      return "It's a tie!";
    }
  }
}

const args = process.argv.slice(2);
if (args.length < 3 || args.length % 2 === 0 || new Set(args).size !== args.length) {
  console.log("Invalid input.");
  console.log("Example usage: node index.js rock paper scissors lizard Spock");
  process.exit(1);
}

const moves = args;
const game = new RandomChoiceGame(moves);
game.startGame().then((userMove) => {
  console.log(`Your move: ${userMove}`);
  console.log(`Computer move: ${game.computerMove}`);

  const result = game.determineWinner(userMove);
  console.log(result);
  console.log(`HMAC key: ${game.key.toString('hex')}`);
});
