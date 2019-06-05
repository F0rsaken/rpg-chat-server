import express from 'express';
import ChatRooms from './routes/chat-rooms';
import Users from './routes/users';
import { Endpoint } from './routes/endpoint';
import cors from 'cors';

const PORT = process.env.PORT || 4500;
const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

const endpoints: Endpoint[] = [
    ChatRooms, Users
]

endpoints.forEach(endpoint => {
    app.use(endpoint.getMainPath(), endpoint.getRouter());
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
})

// process.on('exit', code => {
//     console.log('on exit');
//     ChatRooms.onClose();
// })

// process.on('SIGINT', code => {
//     ChatRooms.onClose();
// })