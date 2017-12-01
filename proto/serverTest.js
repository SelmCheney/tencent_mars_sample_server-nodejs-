const rootFun = require('./index').rootFun;

const net = require('net');

let root = {};
async function load() {
    root = await rootFun()
}
load();


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
        var seq = header.seq;
        var headerLength = FIXED_HEADER_SKIP + (options == null ? 0 : options.length);
        var bodyLength = (body == null ? 0 : body.length);
        var packLength = headerLength + bodyLength;
        var buffer = Buffer.alloc(packLength);


        buffer.writeInt32BE(headerLength, 0);
        buffer.writeInt32BE(CLIENTVERSION, 4);
        buffer.writeInt32BE(cmdId, 8);
        buffer.writeInt32BE(seq, 12);
        buffer.writeInt32BE(bodyLength, 16);

        if (options != null) {
            buffer.fill(options);
        }

        if (body != null) {
            buffer.fill(body);
        }
        return buffer;
    }
}

var client = new net.Socket();
client.connect(8088, '127.0.0.1', function () {
    console.log('Connected');
    setPing();
});


function setPing() {
    let header = {
        "headLength": 20,
        "clientVersion": 200,
        "cmdId": 6,
        "seq": 100,
        "bodyLength": 0
    };
    console.log('Send Header: ' + JSON.stringify(header));
    let pingData = NetMsgHeader.encode(header);
    client.write(pingData);
}

setInterval(() => {
    setPing();
}, 25000)

client.on('data', function (data) {
    //console.log('Received: ' + data);
    let header = NetMsgHeader.decode(data);
    console.log('Header: ' + JSON.stringify(header));
    //	client.destroy(); // kill client after server's response
});

client.on('close', function () {
    console.log('Connection closed');
});