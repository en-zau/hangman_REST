module.exports = io => {

    io.on('connection', async (socket) => {
        console.log('connextion: :>> ', socket.id);
    });

    io.on('disconnect', (socket) => {
      console.log('disconnect :>> ', socket.id);
    });

}