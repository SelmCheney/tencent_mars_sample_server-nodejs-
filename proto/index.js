var protobuf = require("protobufjs");
var root = null;

// protobuf.load('./proto/main.proto', function(err, _root) {
//     if (_root) {
//         root = _root;
//     }
// })
// protobuf.load('./proto/chat.proto', function(err, _root) {
//     if (_root) {
//         Object.assign(root, _root);
//     }
// })
// protobuf.load('./proto/messagepush.proto', function(err, _root) {
//     if (_root) {
//         Object.assign(root, _root);
//     }
// })
// protobuf.load('./proto/topic.proto', function(err, _root) {
//     if (_root) {
//         Object.assign(root, _root);
//     }
// })

module.exports.rootFun = async function () {
    try {
        if (root) {
            return root;
        } else {
            root = {};
            const main = await protobuf.load(__dirname + '/main.proto')

            //  root.main = main;

            root.Request = main.lookup("com.tencent.mars.sample.proto.HelloRequest");
            root.HelloResponse = main.lookup("com.tencent.mars.sample.proto.HelloResponse");
            root.ConversationListResponse = main.lookup("com.tencent.mars.sample.proto.ConversationListResponse");
            root.Conversation = main.lookup("com.tencent.mars.sample.proto.Conversation");

            const chat = await protobuf.load(__dirname + '/chat.proto');

            //  root.chat = chat;
            root.SendMessageRequest = chat.lookup("com.tencent.mars.sample.chat.proto.SendMessageRequest");
            root.SendMessageResponse = chat.lookup("com.tencent.mars.sample.chat.proto.SendMessageResponse");
            const messagepush = await protobuf.load(__dirname + '/messagepush.proto');

            // root.messagepush = messagepush;
            root.MessagePush = messagepush.lookup("com.tencent.mars.sample.chat.MessagePush");
            const topic = await protobuf.load(__dirname + '/topic.proto');

            // root.topic = topic;
            root.TopicRequest = topic.lookup("com.tencent.mars.sample.chat.TopicRequest");
            root.TopicResponse = topic.lookup("com.tencent.mars.sample.chat.TopicResponse");
            // let chat = yield ;
            // let messagepush = yield protobuf.load('./proto/messagepush.proto');
            // let topic = yield protobuf.load('./proto/topic.proto');
            // Object.assign(root, main, chat, messagepush, topic);
            // console.log(root)
        }
        return root;
    } catch (e) {
        console.log(e);
    }
};