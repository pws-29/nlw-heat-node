// sobrescrever a tipagem de express

declare namespace Express {
  export interface Request {
    user_id: string;
  }
}