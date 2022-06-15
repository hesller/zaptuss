process.on("message", async function(arg) {
    const fs = require("fs");
    // ----------------------------------------
    // remove directory in order to remove session credentials

    const dir = './tokens';
    console.log(dir);
    try {
        // delete directory recursively
        fs.rmdir(dir, { recursive: true }, (err) => {
            if (err) {
                console.log(err);
            }

            console.log(`${dir} is deleted!`);
            process.send({"type": 1, 'message': "Limpeza concluida com sucesso!"})
        });
    } catch (e) {
        console.log(e.message)
        process.send({"type": 2, 'message': "Erro durante a limpeza do cache. Tente novamente!"})

        return null;
    }

});