import "dotenv/config"
import express from "express";
import http from "http"
import cors from "cors"
import { Server } from "socket.io"

import { router } from "./routes"

const app = express();

app.use(cors());

const serverHttp = http.createServer(app);

const io = new Server(serverHttp, {
  cors: {
    origin: "*" // permite todas conexoes
  }
}); // conexao do nosso cliente

io.on("connection", socket => {
  console.log(`usuario conectado ${socket.id}`)
});

app.use(express.json());

app.use(router);

// Rota de login GitHub, para testar nosso fluxo e testar o que o front e mobile vao fazer;
// Fazer autenticaçao do nosso usuário.
app.get("/github", (request, response) => {
  response.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`);
});

// Rota de callback
app.get("/signin/callback", (request, response) => {
  const { code } = request.query; // ter acesso ao código dispoonibilizado pelo github

  return response.json(code);

});

export { serverHttp, io };





