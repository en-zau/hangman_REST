const games = {
    11111: {
        creator: {
            username: 'ee',
            id: 'ehfuefh'
        },
        players: [
            {
                username: 'ee',
                id: 'ehfuefh'
            }
        ],
        game: {
            currentState: 0,
            playerOrder: [],
            currentPlayer: 0,
            wordIndex: null
        }
    }
};

const words = [
    {"word": "HARCELEMENT", "definition": "Le harcèlement sexuel c'est le fait d'imposer à une personne, de façon répétée, des propos ou comportements à connotation sexuelle ou sexiste"},
    {"word": "CONSENTEMENT", "definition": "Lorsqu'une personne accepte volontairement la proposition ou les désirs d'une autre"},
    {"word": "INTIMIDATION", "definition": "Il s'agit d'un geste, d'une intervention ou d'un commentaire qui menace, blesse, humilie ou prive quelqu'un d'autre de sa dignité"},
    {"word": "DENONCIATION", "definition": "Signaler le harcèlement au travail"},
    {"word": "VICTIMISATION", "definition": "Acte de cibler la victime du harcèlement."},
    {"word": "PREVENTION", "definition": "Mesures pour éviter le harcèlement."},
    {"word": "SENSIBILISATION", "definition": "Informer sur le harcèlement sexuel."},
    {"word": "SECURITE", "definition": "Création d'un environnement sûr au travail."},
    {"word": "EDUCATION", "definition": "Apprentissage sur le harcèlement sexuel."}
]

function trouverIndicesLettre(mot, lettre) {
    const indices = [];
    for (let i = 0; i < mot.length; i++) {
      if (mot[i] === lettre) {
        indices.push(i);
      }
    }
    return indices;
  }

const createGame = game => {
    const randomWord = Math.floor(Math.random() * (words.length - 1 + 1)) + 0;

    games[game.number] = {
        creator: game.creator,
        players: [game.creator],
        game: {
            currentState: 0,
            playerOrder: [],
            currentPlayer: 0,
            word: words[randomWord].word,
            definition: words[randomWord].definition,
            currentLetter: '',
            currentWord: '',
        }
    }
}

const restartGame = (code) => {
    const randomWord = Math.floor(Math.random() * (words.length - 1 + 1)) + 0;

    games[code] = {
        ...games[code],
        game: {
            currentState: 0,
            playerOrder: [],
            currentPlayer: 0,
            word: words[randomWord].word,
            definition: words[randomWord].definition,
            currentLetter: '',
            currentWord: '',
        }
    }
}

const gameStart = (code) => {
    const randomIndex =  Math.floor(Math.random() * (games[code].players.length - 1 + 1)) + 0;

    return {player: games[code].players[randomIndex], word: games[code].game.word.length}
}

const joingGame = (gameCode, user) => {
    const isGameExist = games[gameCode];

    if(isGameExist && games[gameCode].players.length >= 6) {
        return "Cette session est complète"
    }

    if(!isGameExist) {
        return "Ce code n'existe pas";
    }
    if(games[gameCode].players.some(player => player.username === user.username)) {
        return "Ce nom d'utilisateur est déjà pris";
    }
    games[gameCode].players.push(user);
    
    return games[gameCode].players;
}

const handleDeconnection = socketId => {
    let players = [];

    Object.keys(games).forEach(function(key, index) {
        const playerDisconnected = games[key].players && games[key].players.findIndex(player => player.id === socketId);

        if(playerDisconnected && playerDisconnected !== -1) {
            games[key].players.splice(playerDisconnected, 1);
            players = games[key].players.map(player => player.id);
        }
      });

    return players;
}

const alertPlayers = (gameCode, player1, io) => {
    games[gameCode].players.forEach(player => {
        if(player.id !== player1.id) {
            io.to(player.id).emit('game:playerjoin', player1)
        }
    })


}

const getNextPlayer = gameCode => {
    const nextPlayerIndex = games[gameCode].game.currentPlayer + 1


    if(nextPlayerIndex >= games[gameCode].players.length) {
        games[gameCode].game.currentPlayer = 0;
    }
    else {
        games[gameCode].game.currentPlayer = nextPlayerIndex;
    }
    return  games[gameCode].players[games[gameCode].game.currentPlayer]

}

module.exports = io => {
    io.on('connection', async (socket) => {
        socket.on('game:create', data => {
            const number = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
            const creator = {id: socket.id, username: data.username};

            createGame({number, creator});
            socket.join(number);
            socket.emit('game:init', {number: number, player: creator});
        });

        socket.on('game:join', data => {
            const player = {
                username: data.username,
                id: socket.id
            }

            const response = joingGame(data.gameCode, player);

            if(typeof response === 'string') {
                socket.emit('error', response);
            }
            else {
                const dataToSend = {
                    players: response,
                    player
                }
                socket.join(data.gameCode);
                socket.emit('game:joinsuccesful', dataToSend);

                alertPlayers(data.gameCode, player, io)

                //socket.to(data.gameCode).emit('game:playerjoin', player);
            }
        });

        socket.on('game:letter', data => {


            const includeLetters = trouverIndicesLettre(games[data.code].game.word, data.letter)

            if(games[data.code].game.currentState === 7) {
                games[data.code].players.forEach(player => {
                    io.to(player.id).emit('game:lost', {word: games[data.code].game.word, definition: games[data.code].game.definition});
                })
            }
            else {
                games[data.code].game.currentState++;
            }
            ''

            if(includeLetters.length > 0) {
                games[data.code].players.forEach(player => {
                    io.to(player.id).emit('game:letterwin', {indexs: includeLetters, letter: data.letter});
                })
                let tmpWord = '';

                for(let i = 0; i < games[data.code].game.word.length; i++) {
                    if(games[data.code].game.word.charAt(i) === data.letter) {
                        tmpWord += data.letter;
                    } else if (games[data.code].game.currentWord.charAt(i) && games[data.code].game.currentWord.charAt(i) !== ' ') {
                        tmpWord += games[data.code].game.currentWord.charAt(i);
                    }
                    else {
                        tmpWord += ' '
                    }
                }
                games[data.code].game.currentWord = tmpWord;
                
                if(games[data.code].game.currentWord === games[data.code].game.word) {
                    games[data.code].players.forEach(player => {
                        io.to(player.id).emit('game:win', {word: games[data.code].game.word, definition: games[data.code].game.definition});
                    })
                }
            }
            else {
                games[data.code].players.forEach(player => {
                    io.to(player.id).emit('game:letterlost', data.letter);
                })
            }

            
            const nextPlayer = getNextPlayer(data.code);
            games[data.code].players.forEach(player => {
                io.to(player.id).emit('game:turn', nextPlayer);
            })
        })

        socket.on('game:start', data => {
            const data1 = gameStart(data.code);

            games[data.code].players.forEach(player => {
                io.to(player.id).emit('game:start', data1.word);
                io.to(player.id).emit('game:turn', data1.player);
            })
        })

        socket.on('disconnect', () => {
            const players = handleDeconnection(socket.id);

            players.forEach(player => {
                io.to(player).emit('game:playerleft', socket.id)
            })
        });

        socket.on('game:restart', (data) => {
            restartGame(data.code);

            const data1 = gameStart(data.code);

            games[data.code].players.forEach(player => {
                io.to(player.id).emit('game:restart', data1.word);
                io.to(player.id).emit('game:turn', data1.player);
            })
        });
    });

    
}