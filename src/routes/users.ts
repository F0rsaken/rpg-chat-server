import { Request, Response } from "express";
import uid from 'uid-safe';
import { Endpoint } from "./endpoint";

export default new class Users extends Endpoint {
    private users: User[] = [];

    constructor() {
        super();
        this.mainPath = '/';
        this.defineRoutes();
    }

    private defineRoutes() {
        this.router.get('/login', this.login.bind(this));
    }

    private login(req: Request, res: Response): void {
        let { name } = req.query as LoginRequest;
        let user = this.users.find(val => val.name === name);

        if (!user) {
            let newUser: User = {
                id: this.users.length,
                token: uid.sync(8), // FIXME: eeee wincyj
                name: name
            }
            this.users.push(newUser);
            res.json({ ...newUser });
        } else {
            res.json({ warning: "Username is taken!", token: user.token, id: user.id });
        }
    }

    public validateUser(id: number, token: string): boolean {
        for (let user of this.users) {
            // console.log('Valid', user, token, id, user.id === id && user.token === token);
            if (user.id === id && user.token === token) return true;
        }
        return false;
    }

    public getUserName(id: number): string {
        let user = this.users.find(val => val.id === id);
        return user ? user.name : '';
    }

    public logoutUser(id: number): boolean {
        for (let i in this.users) {
            if (this.users[i].id === id) {
                this.users.splice(+i, 1);
                return true;
            }
        }
        return false;
    }
}

export interface User {
    id: number;
    token: string;
    name: string;
}

interface LoginRequest {
    name: string;
}