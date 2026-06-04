const fs = require('fs');
const crypto = require('crypto');

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

const elements = [];

function createRect(x, y, w, h, text, bg = '#ffffff') {
  const rectId = generateId();
  const textId = generateId();
  
  elements.push({
    id: rectId,
    type: 'rectangle',
    x: x,
    y: y,
    width: w,
    height: h,
    strokeColor: '#000000',
    backgroundColor: bg,
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: { type: 3 },
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: [{ id: textId, type: 'text' }]
  });

  elements.push({
    id: textId,
    type: 'text',
    x: x + 10,
    y: y + h / 2 - 12,
    width: w - 20,
    height: 24,
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    text: text,
    fontSize: 20,
    fontFamily: 5,
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId: rectId
  });
  
  return rectId;
}

function createArrow(fromId, toId, text = '', fromNode, toNode) {
  const arrowId = generateId();
  const startX = fromNode.x + fromNode.width / 2;
  const startY = fromNode.y + fromNode.height;
  const endX = toNode.x + toNode.width / 2;
  const endY = toNode.y;
  
  const el = {
    id: arrowId,
    type: 'arrow',
    x: startX,
    y: startY,
    width: Math.abs(endX - startX) || 1,
    height: Math.abs(endY - startY) || 1,
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    points: [
      [0, 0],
      [endX - startX, endY - startY]
    ],
    startBinding: { elementId: fromId, focus: 0.5, gap: 5 },
    endBinding: { elementId: toId, focus: 0.5, gap: 5 },
    startArrowhead: null,
    endArrowhead: 'arrow'
  };

  elements.push(el);

  if (text) {
    const textId = generateId();
    elements.push({
      id: textId,
      type: 'text',
      x: startX + (endX - startX) / 2,
      y: startY + (endY - startY) / 2,
      width: text.length * 10,
      height: 20,
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: null,
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      text: text,
      fontSize: 16,
      fontFamily: 5,
      textAlign: 'center',
      verticalAlign: 'middle'
    });
  }
}

// Actors (y=100)
const customer = createRect(100, 100, 200, 60, 'Customer', '#ffc9c9');
const kasirActor = createRect(400, 100, 200, 60, 'Kasir', '#ffc9c9');
const adminActor = createRect(700, 100, 200, 60, 'Admin', '#ffc9c9');

// Frontend (y=250)
const webUI = createRect(100, 250, 200, 60, 'Public Web UI', '#a5d8ff');
const posUI = createRect(400, 250, 200, 60, 'POS Web App', '#a5d8ff');
const adminUI = createRect(700, 250, 200, 60, 'Admin Dashboard', '#a5d8ff');

// API (y=400)
const publicAPI = createRect(100, 400, 200, 60, 'Public API', '#b2f2bb');
const kasirAPI = createRect(400, 400, 200, 60, 'Kasir API', '#b2f2bb');
const adminAPI = createRect(700, 400, 200, 60, 'Admin API', '#b2f2bb');

// Services (y=550) - grouped in middle
const knn = createRect(50, 550, 180, 60, 'KNN Recommender', '#ffd43b');
const productPromo = createRect(280, 550, 200, 60, 'Product & Promo', '#ffd43b');
const transactionStock = createRect(530, 550, 200, 60, 'Transaction & Stock', '#ffd43b');
const auth = createRect(780, 550, 180, 60, 'Auth & Security', '#ffd43b');

// Prisma (y=700)
const prisma = createRect(400, 700, 200, 60, 'Prisma ORM', '#eebefa');

// DB (y=850)
const postgres = createRect(250, 850, 200, 60, 'PostgreSQL DB', '#d0ebff');
const s3 = createRect(550, 850, 200, 60, 'AWS S3 (Images)', '#d0ebff');

// Generate Connections
function connect(from, to, text='') {
  const f = elements.find(e => e.id === from);
  const t = elements.find(e => e.id === to);
  createArrow(from, to, text, f, t);
}

connect(customer, webUI);
connect(kasirActor, posUI);
connect(adminActor, adminUI);

connect(webUI, publicAPI);
connect(posUI, kasirAPI);
connect(adminUI, adminAPI);

// API to Services
connect(publicAPI, knn);
connect(publicAPI, productPromo);
connect(kasirAPI, transactionStock);
connect(kasirAPI, auth);
connect(adminAPI, auth);
connect(adminAPI, productPromo);
connect(adminAPI, transactionStock);

// Services to Prisma
connect(knn, prisma);
connect(productPromo, prisma);
connect(transactionStock, prisma);
connect(auth, prisma);

// Product to S3 for images
connect(productPromo, s3);
connect(adminAPI, s3);

// Prisma to DB
connect(prisma, postgres);

// Also add a big title
elements.push({
    id: generateId(),
    type: 'text',
    x: 350,
    y: 20,
    width: 300,
    height: 40,
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    text: 'Fordza-Web System Architecture Flow',
    fontSize: 28,
    fontFamily: 5,
    textAlign: 'center',
    verticalAlign: 'middle'
});

const excalidraw = {
  type: 'excalidraw',
  version: 2,
  source: 'https://excalidraw.com',
  elements: elements,
  appState: {
    viewBackgroundColor: '#ffffff',
    gridSize: 20
  },
  files: {}
};

fs.writeFileSync('e:/fordza-web/fordza-architecture.excalidraw', JSON.stringify(excalidraw, null, 2));
console.log('Generated e:/fordza-web/fordza-architecture.excalidraw');
