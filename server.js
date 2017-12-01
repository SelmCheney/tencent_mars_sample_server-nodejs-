const protobuf = require("protobufjs");
const rootFun = require('./proto/').rootFun;
const bodyParser = require('body-parser');
let root = {};
async function load() {
    root = await rootFun()
}
load();


var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);

app.use(bodyParser.raw());
app.post('/mars/getconvlist', function (req, res) {
    console.log(req.path);


    var ConversationListResponse = root.ConversationListResponse;
    var Conversation = root.Conversation;
    var conversationListResponse = ConversationListResponse.create({
        list: [Conversation.create({
            name: 'chat1',
            topic: '0',
            notice: 'chat1'
        }), Conversation.create({
            name: 'chat2',
            topic: '1',
            notice: 'chat2'
        }), Conversation.create({
            name: 'chat3',
            topic: '2',
            notice: 'chat3'
        })]
    });

    var buffer = ConversationListResponse.encode(conversationListResponse).finish();
    // res.flushHeaders();
    res.write(buffer);
    res.end();

});

app.post('/mars/hello', function (req, res) {
    console.log(req.path);


    var HelloRequest = root.HelloRequest;
    var request = HelloRequest.decode(req.body);
    var HelloResponse = root.HelloResponse;
    let resObj = Object({
        retcode: 0,
        errmsg: 'congratulations,' + request.from
    }, request);
    var message = HelloResponse.create(resObj);
    var buffer = HelloResponse.encode(message).finish();
    //  res.flushHeaders();
    res.write(buffer);
    res.end();
});


app.post('/mars/sendmessage', function (req, res) {
    console.log(req.path);

    var SendMessageRequest = root.SendMessageRequest;
    var request = SendMessageRequest.decode(req.body);
    var SendMessageResponse = root.SendMessageResponse;
    var message = SendMessageResponse.create({
        errCode: 0,
        errmsg: 'congratulations,' + request.from,
        from: request.from,
        text: request.text,
        topic: request.topic
    })
    var buffer = SendMessageResponse.encode(message).finish();
    //  res.flushHeaders();
    res.write(buffer);
    res.end();
});


app.use(function (err, req, res, next) {
    if (err) {
        console.error(err.stack);
        res.status(500).send({
            error: 'Something failed!'
        });

    } else {
        next(err, req, res, next);
    }
})

var port = process.env.PORT || 8080;
httpServer.listen(port, function () {
    console.log('HTTP Server listening at port %d', port);
});


const FIXED_HEADER_SKIP = 4 + 4 + 4 + 4 + 4;
const CMDID_NOOPING = 6;
const CMDID_NOOPING_RESP = 6;
const CLIENTVERSION = 200;


const CmdIDs = {
    CMD_ID_INVALID: -1,
    CMD_ID_UNKNOWN: 0,
    CMD_ID_HELLO: 1,
    CMD_ID_AUTH: 2,
    CMD_ID_SEND_MESSAGE: 3,
    CMD_ID_CONVERSATION_LIST: 4,
    CMD_ID_JOINTOPIC: 5,
    CMD_ID_LEFTTOPIC: 7,
    CMD_ID_HELLO2_VALUE: 8
}

var net = require('net');

var HOST = '0.0.0.0';
var PORT = 8081; //LONG_LINK Port

const server = net.createServer();
var stream = require('stream');
//var HeadBodyBuffers = require('head_body_buffers').HeadBodyBuffers;

server.listen(PORT, HOST);
console.log('Socket Server listening at port %d', PORT);
const clientSocks = {};

var NetMsgHeader = {
    // headLength,
    // clientVersion,
    // cmdId,
    // seq,

    // options,
    // body,
    decode(data) {
        var header = {};
        var headerBuffer = Buffer.from(data);
        header.headLength = headerBuffer.readInt32BE(0, true);
        header.clientVersion = headerBuffer.readInt32BE(4, true);
        header.cmdId = headerBuffer.readInt32BE(8, true);
        header.seq = headerBuffer.readInt32BE(12, true);
        header.bodyLength = headerBuffer.readInt32BE(16, true);
        // if (header.bodyLength > 0) {
        //     header.body = headerBuffer.slice(20);
        // }
        return header;
    },
    encode(header) {
        var options = header.options;
        var body = header.body;
        var cmdId = header.cmdId;
        var seq = header.seq ? header.seq : 0;
        var headerLength = FIXED_HEADER_SKIP + (options == null ? 0 : options.length);
        var bodyLength = (body == null ? 0 : body.length);
        var packLength = headerLength + bodyLength;
        var buffer = Buffer.alloc(packLength);


        buffer.writeInt32BE(headerLength, 0, true);
        buffer.writeInt32BE(CLIENTVERSION, 4, true);
        buffer.writeInt32BE(cmdId, 8, true);
        buffer.writeInt32BE(seq, 12, true);
        buffer.writeInt32BE(bodyLength, 16, true);

        if (options != null) {
            buffer.fill(options, FIXED_HEADER_SKIP);
        }

        if (body != null) {
            buffer.fill(body, headerLength);
        }
        return buffer;
    }
}
var getBodyLength = function (head) {
    var header = NetMsgHeader.decode(head);
    return header.bodyLength;
}
const socks = {};

function sentMsgToClient() {
    console.log('Send server msg to all clients.' + JSON.stringify(Object.keys(clientSocks)));
    for (let key of Object.keys(clientSocks)) {
        sendMsgToSock(clientSocks[key], key, 'Hello from server ' + new Date().toLocaleTimeString());
    }
}
setInterval(() => {
    sentMsgToClient();
}, 1000 * 60 * 1)

function sendMsgToSock(sock, userName, content) {

    var messagePush = root.MessagePush.create({
        content: content,
        from: 'Server',
        topic: '0'
    });

    console.log(JSON.stringify(messagePush));

    var messagePushBuffer = root.MessagePush.encode(messagePush).finish();
    const pushMsgHeader = {
        body: messagePushBuffer,
        cmdId: 10001
    };


    var msgbuf = NetMsgHeader.encode(pushMsgHeader);

    let done = sock.write(msgbuf);
    console.log('server send msg to client!', done);
}

server.on('connection', function (sock) {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    // sock.setKeepAlive(true);
    socks[sock.remoteAddress + ':' + sock.remotePort] = sock;
    //var hbd = new HeadBodyBuffers(20, getBodyLength);
    sock.on('data', function (packet) {
        // console.log('onPacket', packet.toString('binary'));
        var header = NetMsgHeader.decode(packet);
        console.log('header:' + JSON.stringify(header));
        if (header.bodyLength > 0) {
            header.body = packet.slice(header.headLength);
        }

        if (header.clientVersion !== 200) {
            //ERROR
        }
        if (header.cmdId === CMDID_NOOPING) {
            const resBuffer = NetMsgHeader.encode(header);
            const done = sock.write(resBuffer);
            console.log('NOOPING: header:', resBuffer, done, sock.reqUser);
        }

        if (header.cmdId === CmdIDs.CMD_ID_SEND_MESSAGE) {
            console.log('SEND_MESSAG:');
            const SendMessageRequest = root.SendMessageRequest;
            try {
                var request = SendMessageRequest.decode(header.body);
                console.log('SendMessageRequest', JSON.stringify(request));
            } catch (e) {
                console.log('decode SendMessageRequest error:', e);
                return;
            }
            if (request.from && !clientSocks[request.from]) {
                sock.reqUser = request;
                sock.reqHeader = header;
                clientSocks[request.from] = sock;
            }


            var messagePush = root.MessagePush.create({
                content: request.text,
                from: request.from,
                topic: request.topic
            });

            console.log(JSON.stringify(messagePush));

            var messagePushBuffer = root.MessagePush.encode(messagePush).finish();
            const pushMsgHeader = {
                body: messagePushBuffer,
                cmdId: 10001
            };


            var msgbuf = NetMsgHeader.encode(pushMsgHeader);
            for (let k of Object.keys(clientSocks)) {
                if (k != request.from) {
                    const done = clientSocks[k].write(msgbuf);
                    console.log('send msg to ' + clientSocks[k].reqUser.from, ' done:' + done);
                }
            }

            var SendMessageResponse = root.SendMessageResponse;
            var resMessage = SendMessageResponse.create({
                errCode: 0,
                errMsg: 'congratulations, ' + request.from,
                from: request.from,
                text: request.text,
                topic: request.topic
            });
            console.log('SendMessageResponse:', JSON.stringify(resMessage));
            var sndMsgBuffer = SendMessageResponse.encode(resMessage).finish();
            // console.log('SendMessageResponse: sndMsgBuffer:', sndMsgBuffer);
            //console.log('Response Header:' + JSON.stringify(header));
            header.body = sndMsgBuffer;
            const resBuffer = NetMsgHeader.encode(header);
            //  console.log('SendMessageResponse: bytes:', resBuffer);
            sock.write(resBuffer);
        }
    });
    //sock.write("TCP sending message : 1");
    // sock.on('data', function (data) {
    //     hbd.addBuffer(data);
    //     console.log('ondata' + data)
    // });
    sock.on('close', function (data) {
        if (sock.reqUser) {
            console.log(sock.reqUser, ' close!')
            delete clientSocks[sock.reqUser.from];
        }
        console.log('sock closed!', sock.remoteAddress + ':' + sock.remotePort)
    });
    sock.on('error', function (err) {
        if (sock.reqUser) {
            console.log(sock.reqUser, ' --error and closed!', sock.remoteAddress + ':' + sock.remotePort)
            delete clientSocks[sock.reqUser.from];
        }
        console.log('sock err!', sock.remoteAddress + ':' + sock.remotePort, err);
    });
});

server.on('error', function (err) {
    console.log('server error:' + err);
})