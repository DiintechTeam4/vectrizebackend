const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Resolve proto file path (bundled under backend/proto)
const protoPath = path.resolve(__dirname, '../proto/rag.proto');

// Load proto
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const ragPackage = protoDescriptor.rag;

// Resolve target strictly from env
let target = process.env.RAG_GRPC_URL || process.env.GRPC_URL;
if (!target) {
  target = '65.0.102.224:50051';
}

// Create client (insecure by default)
const client = new ragPackage.RagService(target, grpc.credentials.createInsecure());

module.exports = {
  client,
  grpc,
};


