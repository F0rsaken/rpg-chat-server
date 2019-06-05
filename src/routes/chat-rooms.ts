import { Request, Response, Router } from 'express';
import { Server, AddressInfo, OPEN } from 'ws';
import { Endpoint } from './endpoint';
import Users from './users';
import moment from 'moment';
import { parse } from 'url';

export default new class ChatRooms extends Endpoint {
    private chatRooms: ChatRoom[] = [
        { id: 0, name: "Test", password: "admin", currentUsers: [], messages: [] }
    ];

    constructor() {
        super();
        this.mainPath = '/chat-rooms';
        this.defineRoutes();
        for (let room of this.chatRooms) {
            this.initRoom(room);
        }
    }

    private initRoom(room: ChatRoom) {
        const ws = new Server({ port: 0 });

        ws.on('connection', (socket, req) => {
            let userId = +parse(req.url, true).query.id;
            ws.clients.forEach(client => {
                if (client !== socket && client.readyState === OPEN) {
                    client.send(JSON.stringify({ type: MSG_TYPES.clientJoin, user: { id: userId, name: Users.getUserName(userId) } }));
                }
            })

            socket.on('message', data => {
                let msg: WSMessage = JSON.parse(data as string);
                // console.log('Message', msg);

                if (msg.type === MSG_TYPES.message) {
                    room.messages.push(msg);
                    msg.from.name = Users.getUserName(msg.from.id);
                    ws.clients.forEach(client => {
                        if (client !== socket && client.readyState === OPEN) {
                            client.send(JSON.stringify(msg));
                        }
                    })
                }
            })

            socket.on('error', error => {
                console.log(error);
                console.log(error.message);
            })
        });

        room.webSocket = ws;
        room.port = (<AddressInfo>ws.address()).port;
    }

    public getRouter() {
        return this.router;
    }

    private defineRoutes() {
        this.router.post('/connect', this.connect.bind(this));
        this.router.get('/details/:roomId', this.roomDetails.bind(this));
        this.router.post('/disconnect', this.disconnet.bind(this));
    }

    private connect(req: Request, res: Response): void {
        // console.log(req.body);
        let { roomName, password, userId, token } = req.body as ConnectBody;

        if (Users.validateUser(userId, token)) {
            let room = this.chatRooms.find(val => val.name === roomName);
            if (!room) {
                res.status(400).json({ error: "Room don't exist1" });
            } else if (password !== room.password) {
                res.status(400).json({ error: 'Room password is invalid!' })
            } else {
                room.currentUsers.push({ id: userId, name: Users.getUserName(userId) });
                res.json({ message: "Connected!", address: `ws://localhost:${room.port}`, roomId: room.id });
            }
        } else {
            res.status(400).json({ error: "Token is invalid!" });
        }
    }

    private disconnet(req: Request, res: Response): void {
        let { userId, roomId } = (req.body as disconnetRequest);
        
        if (Users.logoutUser(+userId)) {
            let room = this.chatRooms.find(r => r.id === +roomId);
            let ind = room.currentUsers.findIndex(user => user.id === +userId);
            if (ind !== -1) room.currentUsers.splice(ind, 1);
            res.json({ message: 'Success!' });
        } else {
            res.status(400).json({ error: 'No user with given Id!' });
        }
    }

    private roomDetails(req: Request, res: Response): void {
        let roomId = +req.params.roomId;
        let room = this.chatRooms.find(r => r.id === roomId);
        if (!room) {
            res.status(400).json({ error: 'Wrong room id!' });
        } else {
            res.json({ currentUsers: room.currentUsers, messages: room.messages })
        }
    }

    public onClose() {
        for (let room of this.chatRooms) {
            if (room.webSocket) room.webSocket.close();
        }
    }
}

export interface ChatRoom {
    id: number;
    name: string;
    password: string;
    currentUsers: { id: number, name: string }[];
    messages: WSMessage[];
    webSocket?: Server;
    port?: number;
}

interface ConnectBody {
    roomName: string;
    password: string;
    userId: number;
    token: string;
}

interface WSMessage {
    type: MSG_TYPES;
    message: string;
    from: { id: number; name: string; };
    time: moment.Moment;
}

enum MSG_TYPES {
    clientJoin = 0,
    clientLeft = 1,
    message = 2
}

interface disconnetRequest {
    userId: string;
    roomId: string;
}