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
        ]
    }
};

const createGame = game => {
    games[game.number] = {
        creator: game.creator,
        players: [game.creator]
    }
}

const joingGame = (gameCode, user) => {
    const isGameExist = games[gameCode];

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
        const playerDisconnected = games[key].players.findIndex(player => player.id === socketId);

        if(playerDisconnected !== -1) {
            games[key].players.splice(playerDisconnected, 1);
            players = games[key].players.map(player => player.id);
        }
      });

    return players;
}

const alertPlayers = (gameCode, player1, io) => {
    console.log('games[gameCode].players :>> ', games[gameCode].players);

    games[gameCode].players.forEach(player => {
        if(player.id !== player1.id) {
            io.to(player.id).emit('game:playerjoin', player1)
        }
    })
}

module.exports = io => {
    io.on('connection', async (socket) => {
        socket.on('game:create', data => {
            const number = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
            const creator = {id: socket.id, username: data.username};

            createGame({number, creator});
            console.log('number :>> ', number);
            console.log('io.sockets.adapter.rooms :>> ', io.sockets.adapter.rooms);

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

        socket.on('disconnect', () => {
            const players = handleDeconnection(socket.id);

            players.forEach(player => {
                io.to(player).emit('game:playerleft', socket.id)
            })
        });
    });

    
}