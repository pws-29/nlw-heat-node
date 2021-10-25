import axios from "axios";
import prismaClient from "../prisma"
import { sign } from "jsonwebtoken"


/**
 * Autenticação do usuário;
 * Receber code(string);
 * Recuperar o access_token no github (token disponibilizado pelo github);
 * Recuperar as informações do usuário no GITHUB;
 * Verificar se o usuário existe no banco de dados:
 * ---- SIM = Gera um Token
 * ---- NAO = Cria no DB e gera um toke;
 * Retornar o token com as infos do user.
 */


interface IAccessTokenResponse { // receber apenas o necessário
  access_token: string
}

// Filtrar informaçoes do get
interface IUserResponse {
  avatar_url: string,
  login: string,
  id: number,
  name: string,
}

class AuthenticateUserService {
  // receber o código
  async execute(code: string) {
    const url = "https://github.com/login/oauth/access_token";

    const { data: accessTokenResponse } = await axios.post<IAccessTokenResponse>(url, null, {
      params: { // parametros para acesso o token
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      headers: {
        Accept: "application/json"
      }
    })

    const response = await axios.get<IUserResponse>("https://api.github.com/user", {
      headers: {
        authorization: `Bearer ${accessTokenResponse.access_token}`
      },
    }) //url para pegar todas as infos do user logado

    const { login, id, avatar_url, name } = response.data;

    // consultar se o user existe na DB
    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id
      }
    })

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          login,
          avatar_url,
          name,
        }
      })
    }

    // criando meu token, de fato autenticar
    const token = sign(
      {
        user: {
          name: user.name,
          avatar_url: user.avatar_url,
          id: user.id
        },
      },
      process.env.JWT_SECRET, // secret para criar o token e validar o token
      {
        subject: user.id,
        expiresIn: "1d"
      }
    )

    return { token, user }; // Em axios, toda a informaçao retornada é constida em .data
  }
}

export { AuthenticateUserService }