# MindMate AI - WebRTC Infrastructure Specification
## Live AI Video Therapy Sessions Architecture

**Version:** 1.0.0  
**Status:** Production-Ready Specification  
**Last Updated:** 2024

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Signaling Server](#2-signaling-server)
3. [STUN/TURN Infrastructure](#3-stunturn-infrastructure)
4. [Media Pipeline](#4-media-pipeline)
5. [AI Avatar Frame Streaming](#5-ai-avatar-frame-streaming)
6. [Connection Resilience](#6-connection-resilience)
7. [Video Session State Machine](#7-video-session-state-machine)
8. [Security Considerations](#8-security-considerations)
9. [Performance Metrics & Monitoring](#9-performance-metrics--monitoring)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. Architecture Overview

### 1.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Web/Mobile App)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   WebRTC     │  │   Media      │  │   Session    │  │   Network    │    │
│  │   PeerConn   │◄─┤   Handler    │◄─┤   Manager    │◄─┤   Monitor    │    │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                                                                   │
│         │ ICE Candidates / SDP Exchange                                     │
│         ▼                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket (WSS)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SIGNALING SERVER CLUSTER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Socket.IO  │  │   Session    │  │   Presence   │  │   Rate       │    │
│  │   Gateway    │  │   Registry   │  │   Service    │  │   Limiter    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Internal gRPC
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI AVATAR MEDIA SERVER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Avatar     │  │   Video      │  │   Audio      │  │   Lip-Sync   │    │
│  │   Engine     │──┤   Encoder    │──┤   Mixer      │──┤   Renderer   │    │
│  │  (AI/ML)     │  │  (H.264/VP8) │  │  (Opus)      │  │  (Viseme)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│         ▲                                                                   │
│         │ LLM Response / TTS Audio                                          │
│         ▼                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │   Therapy    │  │   LLM        │  │   TTS        │                       │
│  │   Context    │  │   Inference  │  │   Service    │                       │
│  │   Manager    │  │  (Claude)    │  │  (ElevenLabs)│                       │
│  └──────────────┘  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SRTP/DTLS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ICE INFRASTRUCTURE                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   STUN Server   │    │   TURN Server   │    │   TURN Server   │         │
│  │  (coturn-1)     │    │  (coturn-2)     │    │  (coturn-3)     │         │
│  │  3478/udp,tcp   │    │  3478/udp,tcp   │    │  5349/tls,dtls  │         │
│  │  19302/udp      │    │  49152-65535    │    │  49152-65535    │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Low Latency** | Target < 150ms end-to-end for real-time interaction |
| **Resilience** | Automatic reconnection, graceful degradation |
| **Scalability** | Horizontal scaling of media servers |
| **Privacy** | E2E encryption, no persistent storage of session data |
| **Quality** | Adaptive bitrate, resolution scaling |

---

## 2. Signaling Server

### 2.1 Technology Stack

```yaml
Primary Framework: Socket.IO v4.x
Transport: WebSocket (primary) with HTTP long-polling fallback
Protocol: JSON with optional MessagePack compression
Load Balancer: HAProxy with sticky sessions (IP hash)
Message Queue: Redis Pub/Sub for multi-node synchronization
```

### 2.2 Signaling Message Types

```typescript
// Core signaling protocol
interface SignalingMessage {
  type: SignalingMessageType;
  sessionId: string;
  timestamp: number;
  payload: unknown;
}

type SignalingMessageType =
  // Session Lifecycle
  | 'session:create'
  | 'session:join'
  | 'session:leave'
  | 'session:terminate'
  
  // WebRTC Negotiation
  | 'webrtc:offer'
  | 'webrtc:answer'
  | 'webrtc:ice-candidate'
  | 'webrtc:renegotiate'
  
  // State Management
  | 'state:pause'
  | 'state:resume'
  | 'state:quality-change'
  
  // Error & Recovery
  | 'error:signaling'
  | 'recovery:reconnect'
  | 'recovery:sync-request';
```

### 2.3 Signaling Server Implementation

```javascript
// /src/signaling/server.js
const { Server } = require('socket.io');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

class MindMateSignalingServer {
  constructor(config) {
    this.io = new Server(config.server, {
      cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 10000,
      pingInterval: 5000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6, // 1MB
    });

    this.redis = new Redis(config.redis);
    this.sessionRegistry = new SessionRegistry(this.redis);
    
    // Rate limiting: 30 messages per 10 seconds per session
    this.rateLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'signaling_limit',
      points: 30,
      duration: 10,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      try {
        const user = await this.verifyToken(token);
        socket.userId = user.id;
        socket.userRole = user.role; // 'patient' | 'therapist' | 'ai'
        next();
      } catch (err) {
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use(async (socket, next) => {
      try {
        await this.rateLimiter.consume(socket.userId);
        next();
      } catch {
        next(new Error('Rate limit exceeded'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.userId}`);

      // Session lifecycle handlers
      socket.on('session:create', this.handleSessionCreate.bind(this, socket));
      socket.on('session:join', this.handleSessionJoin.bind(this, socket));
      socket.on('session:leave', this.handleSessionLeave.bind(this, socket));
      
      // WebRTC negotiation handlers
      socket.on('webrtc:offer', this.handleOffer.bind(this, socket));
      socket.on('webrtc:answer', this.handleAnswer.bind(this, socket));
      socket.on('webrtc:ice-candidate', this.handleIceCandidate.bind(this, socket));
      
      // State management
      socket.on('state:pause', this.handlePause.bind(this, socket));
      socket.on('state:resume', this.handleResume.bind(this, socket));
      socket.on('state:quality-change', this.handleQualityChange.bind(this, socket));

      // Disconnection handler
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });
    });
  }

  async handleSessionCreate(socket, data) {
    const sessionId = generateSessionId();
    const session = {
      id: sessionId,
      patientId: socket.userId,
      aiInstanceId: await this.allocateAiInstance(),
      status: 'initializing',
      createdAt: Date.now(),
      iceServers: await this.getIceServers(socket.handshake.address),
    };

    await this.sessionRegistry.create(session);
    socket.join(sessionId);
    socket.sessionId = sessionId;

    // Notify AI media server to prepare
    await this.notifyAiServer('session:prepare', session);

    socket.emit('session:created', {
      sessionId,
      iceServers: session.iceServers,
      aiEndpoint: session.aiInstanceId,
    });
  }

  async handleOffer(socket, data) {
    const { sessionId, sdp, type } = data;
    
    // Validate session ownership
    const session = await this.sessionRegistry.get(sessionId);
    if (!session || session.patientId !== socket.userId) {
      return socket.emit('error:signaling', { code: 'UNAUTHORIZED' });
    }

    // Forward offer to AI media server
    await this.notifyAiServer('webrtc:offer', {
      sessionId,
      sdp,
      type,
      fromSocket: socket.id,
    });

    // Update session state
    await this.sessionRegistry.update(sessionId, { 
      status: 'negotiating',
      lastActivity: Date.now(),
    });
  }

  async handleAnswer(socket, data) {
    // AI server sends answer back through internal channel
    const { sessionId, sdp, type } = data;
    this.io.to(sessionId).emit('webrtc:answer', { sdp, type });
  }

  async handleIceCandidate(socket, data) {
    const { sessionId, candidate, sdpMid, sdpMLineIndex } = data;
    
    // Route ICE candidate to appropriate peer
    const session = await this.sessionRegistry.get(sessionId);
    const target = socket.userRole === 'patient' ? 'ai' : 'patient';
    
    if (target === 'ai') {
      await this.notifyAiServer('webrtc:ice-candidate', {
        sessionId,
        candidate,
        sdpMid,
        sdpMLineIndex,
      });
    } else {
      this.io.to(sessionId).emit('webrtc:ice-candidate', {
        candidate,
        sdpMid,
        sdpMLineIndex,
      });
    }
  }

  async handleDisconnect(socket, reason) {
    console.log(`Client disconnected: ${socket.userId}, reason: ${reason}`);
    
    if (socket.sessionId) {
      // Mark session for potential recovery
      await this.sessionRegistry.update(socket.sessionId, {
        patientConnected: false,
        disconnectReason: reason,
        disconnectTime: Date.now(),
      });

      // Start recovery grace period (30 seconds)
      setTimeout(async () => {
        const session = await this.sessionRegistry.get(socket.sessionId);
        if (session && !session.patientConnected) {
          await this.terminateSession(socket.sessionId, 'patient-timeout');
        }
      }, 30000);
    }
  }

  async getIceServers(clientIp) {
    // Return geographically closest TURN servers
    const region = this.geoLocate(clientIp);
    return [
      { urls: 'stun:stun.mindmate.ai:3478' },
      { urls: 'stun:stun.mindmate.ai:19302' },
      {
        urls: `turn:turn-${region}.mindmate.ai:3478`,
        username: 'mindmate',
        credential: await this.generateTurnToken(),
      },
      {
        urls: `turns:turn-${region}.mindmate.ai:5349`,
        username: 'mindmate',
        credential: await this.generateTurnToken(),
      },
    ];
  }
}
```

### 2.4 Session Registry (Redis Schema)

```redis
# Session data structure
HSET session:{sessionId} \
  patientId "user_123" \
  aiInstanceId "ai_us_east_1a_001" \
  status "active" \
  createdAt "1704067200000" \
  peerConnectionId "pc_abc123" \
  patientConnected "true" \
  quality "hd" \
  lastActivity "1704067500000"

# Session index for cleanup
ZADD session:expiry {timestamp} {sessionId}

# User to session mapping
SET user:session:{userId} {sessionId} EX 3600

# AI instance load tracking
HINCRBY ai:load:{instanceId} activeSessions 1
```

---

## 3. STUN/TURN Infrastructure

### 3.1 Server Configuration

#### Primary: coturn Deployment

```bash
# /etc/turnserver.conf
# TURN server configuration for MindMate AI

# Network settings
listening-port=3478
tls-listening-port=5349
alt-listening-port=3479
alt-tls-listening-port=5350
listening-ip=0.0.0.0
relay-ip=10.0.1.10
external-ip=203.0.113.10/10.0.1.10

# Relay port range (RFC 5766 compliant)
min-port=49152
max-port=65535

# Authentication
lt-cred-mech
use-auth-secret
static-auth-secret=${TURN_SECRET}
# OR user-based:
# user=mindmate:${TURN_PASSWORD}

# TLS/DTLS configuration
cert=/etc/turnserver/certs/mindmate.crt
pkey=/etc/turnserver/certs/mindmate.key
cipher-list="ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512"
dtls-cipher-list="ECDHE-RSA-AES256-GCM-SHA512"

# Security
no-multicast-peers
no-cli
no-tcp-relay  # Optional: UDP only for lower latency

# Performance
max-allocate-lifetime=3600
max-allocate-bandwidth=2000000  # 2 Mbps per allocation

# Logging
log-file=/var/log/turnserver.log
simple-log
```

### 3.2 Multi-Region Deployment

```yaml
# /k8s/turn-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coturn-us-east
  namespace: webrtc
spec:
  replicas: 3
  selector:
    matchLabels:
      app: coturn
      region: us-east
  template:
    metadata:
      labels:
        app: coturn
        region: us-east
    spec:
      containers:
      - name: coturn
        image: coturn/coturn:4.6.2
        ports:
        - containerPort: 3478
          protocol: UDP
        - containerPort: 3478
          protocol: TCP
        - containerPort: 5349
          protocol: TCP
        - containerPort: 5349
          protocol: UDP  # DTLS
        - containerPort: 49152
          protocol: UDP
          hostPort: 49152
        # ... ports 49152-65535 via hostNetwork or port range
        env:
        - name: TURN_SECRET
          valueFrom:
            secretKeyRef:
              name: turn-credentials
              key: shared-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - "turnutils_uclient -t -T -u mindmate -w $TURN_SECRET localhost || exit 1"
          initialDelaySeconds: 30
          periodSeconds: 60
---
apiVersion: v1
kind: Service
metadata:
  name: coturn-us-east
  namespace: webrtc
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  type: LoadBalancer
  selector:
    app: coturn
    region: us-east
  ports:
  - name: stun-turn-udp
    port: 3478
    protocol: UDP
  - name: stun-turn-tcp
    port: 3478
    protocol: TCP
  - name: turns-tcp
    port: 5349
    protocol: TCP
  - name: turns-udp
    port: 5349
    protocol: UDP
```

### 3.3 ICE Server Selection Strategy

```javascript
// /src/webrtc/ice-strategy.js

class IceServerStrategy {
  constructor() {
    this.regions = {
      'us-east': ['turn-us-east-1.mindmate.ai', 'turn-us-east-2.mindmate.ai'],
      'us-west': ['turn-us-west-1.mindmate.ai', 'turn-us-west-2.mindmate.ai'],
      'eu-west': ['turn-eu-west-1.mindmate.ai', 'turn-eu-west-2.mindmate.ai'],
      'ap-south': ['turn-ap-south-1.mindmate.ai', 'turn-ap-south-2.mindmate.ai'],
    };
  }

  async getOptimalIceServers(clientIp, networkProfile) {
    const region = await this.geoLocate(clientIp);
    const isMobile = networkProfile.type === 'cellular';
    const hasLowBandwidth = networkProfile.downlink < 1.0;

    const servers = [];

    // Always include STUN
    servers.push(
      { urls: 'stun:stun.mindmate.ai:3478' },
      { urls: 'stun:stun.l.google.com:19302' }  // Fallback
    );

    // Primary TURN servers (region-specific)
    const primaryTurn = this.regions[region] || this.regions['us-east'];
    
    for (const host of primaryTurn) {
      // UDP TURN for low latency
      servers.push({
        urls: `turn:${host}:3478`,
        username: await this.generateUsername(),
        credential: await this.generateCredential(),
      });

      // TCP TURN for restrictive firewalls
      servers.push({
        urls: `turn:${host}:3478?transport=tcp`,
        username: await this.generateUsername(),
        credential: await this.generateCredential(),
      });

      // TLS TURN for maximum compatibility
      servers.push({
        urls: `turns:${host}:5349`,
        username: await this.generateUsername(),
        credential: await this.generateCredential(),
      });
    }

    // Mobile-specific: prioritize TCP for carrier NAT traversal
    if (isMobile) {
      servers.sort((a, b) => {
        const aTcp = a.urls.includes('tcp') || a.urls.includes('turns');
        const bTcp = b.urls.includes('tcp') || b.urls.includes('turns');
        return bTcp - aTcp;
      });
    }

    return servers;
  }

  async generateUsername() {
    const timestamp = Math.floor(Date.now() / 1000) + 86400; // 24h expiry
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}:${random}`;
  }

  async generateCredential() {
    const hmac = crypto.createHmac('sha1', process.env.TURN_SECRET);
    hmac.update(await this.generateUsername());
    return hmac.digest('base64');
  }
}
```

---

## 4. Media Pipeline

### 4.1 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MEDIA PIPELINE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  AI Avatar Generation
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Avatar Render │────►│   Frame Buffer  │────►│  Video Encoder  │
│   (Unity/Unreal)│     │   (Ring Buffer) │     │  (H.264/VP8)    │
│   60fps target  │     │   3-5 frames    │     │  Hardware accel │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
         ┌───────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   RTP Packetizer│────►│   Jitter Buffer │────►│   DTLS/SRTP     │
│   (RFC 6184)    │     │   (Client-side) │     │   Encryption    │
│   NAL unit split│     │   50-200ms      │     │   AES-GCM       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │   WebRTC Peer   │
                                              │   Connection    │
                                              │   (Client)      │
                                              └─────────────────┘
```

### 4.2 Video Encoder Configuration

```javascript
// /src/media/video-encoder.js

class AvatarVideoEncoder {
  constructor(config) {
    this.codec = config.codec || 'H264'; // 'H264' | 'VP8' | 'VP9'
    this.resolution = config.resolution || '720p';
    this.targetFps = config.fps || 30;
    this.hardwareAccel = config.hardwareAccel !== false;
    
    this.qualityPresets = {
      '4k': { width: 3840, height: 2160, bitrate: 8000000, fps: 30 },
      '1080p': { width: 1920, height: 1080, bitrate: 4000000, fps: 30 },
      '720p': { width: 1280, height: 720, bitrate: 2500000, fps: 30 },
      '480p': { width: 854, height: 480, bitrate: 1000000, fps: 24 },
      '360p': { width: 640, height: 360, bitrate: 500000, fps: 24 },
      '240p': { width: 426, height: 240, bitrate: 250000, fps: 15 },
    };
  }

  getEncoderConfig() {
    const preset = this.qualityPresets[this.resolution];
    
    const baseConfig = {
      codec: this.getCodecString(),
      width: preset.width,
      height: preset.height,
      bitrate: preset.bitrate,
      framerate: preset.fps,
      latencyMode: 'realtime',
      hardwareAcceleration: this.hardwareAccel ? 'prefer-hardware' : 'prefer-software',
    };

    // Codec-specific optimizations
    if (this.codec === 'H264') {
      return {
        ...baseConfig,
        h264: {
          profile: 'constrained-baseline', // Best compatibility
          level: this.getH264Level(preset),
        },
        bitrateMode: 'variable',
        scalabilityMode: 'L1T2', // Temporal scalability for simulcast-like behavior
      };
    }

    if (this.codec === 'VP8') {
      return {
        ...baseConfig,
        vp8: {
          complexity: 2, // Balance quality/speed
          numTemporalLayers: 2,
        },
      };
    }

    return baseConfig;
  }

  getCodecString() {
    const codecMap = {
      'H264': 'avc1.42E01F', // Constrained Baseline Level 3.1
      'VP8': 'vp8',
      'VP9': 'vp09.00.10.08',
    };
    return codecMap[this.codec];
  }

  getH264Level(preset) {
    if (preset.width >= 1920) return '4.1';
    if (preset.width >= 1280) return '3.1';
    if (preset.width >= 854) return '3.0';
    return '2.1';
  }

  // Adaptive bitrate controller
  adaptToNetworkConditions(stats) {
    const { availableOutgoingBitrate, packetLoss, rtt } = stats;
    
    // Calculate target bitrate with safety margin
    const targetBitrate = availableOutgoingBitrate * 0.75;
    
    // Find best quality that fits within target
    const qualities = Object.entries(this.qualityPresets);
    for (const [name, preset] of qualities) {
      if (preset.bitrate <= targetBitrate) {
        if (this.resolution !== name) {
          console.log(`Adapting quality: ${this.resolution} -> ${name}`);
          this.resolution = name;
          return this.getEncoderConfig();
        }
        break;
      }
    }
    
    return null; // No change needed
  }
}
```

### 4.3 Media Server (Mediasoup Integration)

```javascript
// /src/media/mediasoup-server.js

const mediasoup = require('mediasoup');

class MindMateMediaServer {
  constructor(config) {
    this.config = config;
    this.workers = [];
    this.routers = new Map(); // sessionId -> router
    this.transports = new Map(); // sessionId -> { producer, consumer }
  }

  async initialize() {
    // Create worker pool
    const numWorkers = require('os').cpus().length;
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
        dtlsCertificateFile: this.config.dtlsCert,
        dtlsPrivateKeyFile: this.config.dtlsKey,
      });

      worker.on('died', () => {
        console.error('Mediasoup worker died, restarting...');
        this.restartWorker(i);
      });

      this.workers.push(worker);
    }
  }

  async createSessionRouter(sessionId) {
    const worker = this.getLeastLoadedWorker();
    
    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1,
          },
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
        },
      ],
    });

    this.routers.set(sessionId, router);
    return router;
  }

  async createAvatarProducer(sessionId, router) {
    // Create transport for AI avatar stream
    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: this.config.publicIp,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 2500000,
      minimumAvailableOutgoingBitrate: 100000,
    });

    // Create video producer for avatar
    const videoProducer = await transport.produce({
      kind: 'video',
      rtpParameters: {
        codecs: [
          {
            mimeType: 'video/H264',
            payloadType: 108,
            clockRate: 90000,
            parameters: {
              'packetization-mode': 1,
              'profile-level-id': '42e01f',
            },
          },
        ],
        encodings: [
          { maxBitrate: 2500000, scalabilityMode: 'L1T3' },
          { maxBitrate: 1000000, scalabilityMode: 'L1T3' },
          { maxBitrate: 500000, scalabilityMode: 'L1T3' },
        ],
      },
    });

    // Create audio producer for TTS
    const audioProducer = await transport.produce({
      kind: 'audio',
      rtpParameters: {
        codecs: [
          {
            mimeType: 'audio/opus',
            payloadType: 111,
            clockRate: 48000,
            channels: 2,
          },
        ],
      },
    });

    this.transports.set(sessionId, {
      transport,
      videoProducer,
      audioProducer,
    });

    return {
      transportParams: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
      videoProducerId: videoProducer.id,
      audioProducerId: audioProducer.id,
    };
  }

  async connectClientConsumer(sessionId, clientDtlsParams) {
    const session = this.transports.get(sessionId);
    if (!session) throw new Error('Session not found');

    const { transport } = session;
    await transport.connect({ dtlsParameters: clientDtlsParams });

    // Create consumer for client
    const videoConsumer = await transport.consume({
      producerId: session.videoProducer.id,
      rtpCapabilities: clientRtpCapabilities,
      paused: false,
    });

    const audioConsumer = await transport.consume({
      producerId: session.audioProducer.id,
      rtpCapabilities: clientRtpCapabilities,
      paused: false,
    });

    return {
      videoConsumer,
      audioConsumer,
    };
  }

  getLeastLoadedWorker() {
    // Simple round-robin for now
    const workerIndex = Math.floor(Math.random() * this.workers.length);
    return this.workers[workerIndex];
  }
}
```

---

## 5. AI Avatar Frame Streaming

### 5.1 Avatar Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI AVATAR FRAME GENERATION PIPELINE                      │
└─────────────────────────────────────────────────────────────────────────────┘

  User Speech/Text Input
           │
           ▼
  ┌─────────────────┐
  │  Speech-to-Text │ (if voice input)
  │  (Whisper API)  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐     ┌─────────────────┐
  │   LLM Therapy   │────►│  Response Queue │
  │   Engine        │     │  (Streaming)    │
  │   (Claude)      │     │                 │
  └────────┬────────┘     └─────────────────┘
           │
           ▼
  ┌─────────────────┐     ┌─────────────────┐
  │   Text-to-      │────►│  Audio Buffer   │
  │   Speech        │     │  (Opus chunks)  │
  │  (ElevenLabs)   │     │                 │
  └────────┬────────┘     └─────────────────┘
           │
           │ Audio + Viseme Data
           ▼
  ┌─────────────────┐     ┌─────────────────┐
  │   Lip-Sync      │────►│  Frame Buffer   │
  │   Generator     │     │  (RGB frames)   │
  │  (Viseme-based) │     │                 │
  └────────┬────────┘     └─────────────────┘
           │
           ▼
  ┌─────────────────┐     ┌─────────────────┐
  │   Real-time     │────►│  Video Encoder  │────► WebRTC
  │   Renderer      │     │  (H.264/VP8)    │      Output
  │  (Unity/WebGL)  │     │                 │
  └─────────────────┘     └─────────────────┘
```

### 5.2 Avatar Streaming Implementation

```javascript
// /src/avatar/avatar-streamer.js

const { Writable } = require('stream');
const EventEmitter = require('events');

class AvatarFrameStreamer extends EventEmitter {
  constructor(config) {
    super();
    this.frameRate = config.frameRate || 30;
    this.targetLatency = config.targetLatency || 100; // ms
    this.frameBuffer = new RingBuffer(config.bufferSize || 5);
    
    // Avatar rendering components
    this.lipSync = new LipSyncEngine();
    this.renderer = new AvatarRenderer(config.avatarModel);
    this.encoder = new VideoEncoder(config.encoder);
    
    // Streaming state
    this.isStreaming = false;
    this.currentVisemes = [];
    this.audioContext = null;
  }

  async initialize() {
    // Initialize avatar renderer
    await this.renderer.load();
    
    // Setup encoding pipeline
    this.encoderStream = new Writable({
      write: (chunk, encoding, callback) => {
        this.onEncodedFrame(chunk);
        callback();
      },
    });

    // Connect renderer to encoder
    this.renderer.pipe(this.encoder).pipe(this.encoderStream);
  }

  // Start streaming session
  async startStreaming(sessionId) {
    this.sessionId = sessionId;
    this.isStreaming = true;
    
    // Start render loop
    this.renderLoop = setInterval(() => {
      this.renderFrame();
    }, 1000 / this.frameRate);

    // Start frame emission loop
    this.emitLoop = setInterval(() => {
      this.emitNextFrame();
    }, 1000 / this.frameRate);

    this.emit('streaming:started', { sessionId });
  }

  // Process TTS audio and generate visemes
  async processTTSAudio(audioBuffer, visemeData) {
    // Queue visemes with timestamps
    const timestamp = Date.now();
    
    for (const viseme of visemeData) {
      this.currentVisemes.push({
        type: viseme.type, // e.g., 'A', 'B', 'C', 'D', 'E', 'F', 'G'
        weight: viseme.weight,
        startTime: timestamp + viseme.offset,
        duration: viseme.duration,
      });
    }

    // Forward audio to media server
    this.emit('audio:chunk', {
      sessionId: this.sessionId,
      buffer: audioBuffer,
      timestamp,
    });
  }

  // Render single frame
  renderFrame() {
    if (!this.isStreaming) return;

    const now = Date.now();
    
    // Get current viseme weights based on timestamp
    const activeVisemes = this.currentVisemes.filter(v => 
      now >= v.startTime && now < v.startTime + v.duration
    );

    // Clean up old visemes
    this.currentVisemes = this.currentVisemes.filter(v => 
      now < v.startTime + v.duration + 100
    );

    // Render frame with current visemes
    const frame = this.renderer.render({
      visemes: activeVisemes,
      timestamp: now,
      expression: this.getCurrentExpression(),
    });

    // Add to buffer
    this.frameBuffer.push({
      data: frame,
      timestamp: now,
    });
  }

  // Emit frame to encoder
  emitNextFrame() {
    const frame = this.frameBuffer.pop();
    if (frame) {
      this.encoder.encode(frame.data, frame.timestamp);
    }
  }

  // Handle encoded frame ready for transmission
  onEncodedFrame(encodedFrame) {
    this.emit('video:frame', {
      sessionId: this.sessionId,
      frame: encodedFrame,
      timestamp: Date.now(),
      isKeyFrame: encodedFrame.type === 'key',
    });
  }

  // Pause streaming (user minimized app)
  pauseStreaming() {
    this.isStreaming = false;
    clearInterval(this.renderLoop);
    clearInterval(this.emitLoop);
    this.emit('streaming:paused', { sessionId: this.sessionId });
  }

  // Resume streaming
  resumeStreaming() {
    this.isStreaming = true;
    this.startStreaming(this.sessionId);
    this.emit('streaming:resumed', { sessionId: this.sessionId });
  }

  // Stop streaming
  stopStreaming() {
    this.isStreaming = false;
    clearInterval(this.renderLoop);
    clearInterval(this.emitLoop);
    this.frameBuffer.clear();
    this.currentVisemes = [];
    this.emit('streaming:stopped', { sessionId: this.sessionId });
  }

  getCurrentExpression() {
    // Determine expression based on therapy context
    // Could be: 'neutral', 'empathetic', 'concerned', 'encouraging'
    return this.renderer.currentExpression || 'neutral';
  }
}

// Ring buffer for frame management
class RingBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = new Array(size);
    this.readIndex = 0;
    this.writeIndex = 0;
    this.count = 0;
  }

  push(item) {
    this.buffer[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.size;
    if (this.count < this.size) {
      this.count++;
    } else {
      this.readIndex = (this.readIndex + 1) % this.size;
    }
  }

  pop() {
    if (this.count === 0) return null;
    const item = this.buffer[this.readIndex];
    this.readIndex = (this.readIndex + 1) % this.size;
    this.count--;
    return item;
  }

  clear() {
    this.buffer = new Array(this.size);
    this.readIndex = 0;
    this.writeIndex = 0;
    this.count = 0;
  }
}
```

### 5.3 Viseme-to-Animation Mapping

```javascript
// /src/avatar/viseme-map.js

// Standard viseme set based on IPA phonemes
const VISemeMap = {
  // Silence / neutral
  'sil': { mouthOpen: 0, mouthWide: 0, lipRound: 0 },
  
  // Vowels
  'A': { mouthOpen: 0.9, mouthWide: 0.3, lipRound: 0 },    // "ah" as in father
  'E': { mouthOpen: 0.5, mouthWide: 0.7, lipRound: 0 },    // "eh" as in bed
  'I': { mouthOpen: 0.3, mouthWide: 0.6, lipRound: 0 },    // "ee" as in see
  'O': { mouthOpen: 0.6, mouthWide: 0.2, lipRound: 0.8 },  // "oh" as in go
  'U': { mouthOpen: 0.2, mouthWide: 0.1, lipRound: 0.9 },  // "oo" as in food
  
  // Consonants
  'B': { mouthOpen: 0, mouthWide: 0.5, lipRound: 0 },      // "b", "p", "m" (closed lips)
  'F': { mouthOpen: 0.1, mouthWide: 0.4, lipRound: 0.2 },  // "f", "v" (bottom lip up)
  'W': { mouthOpen: 0.2, mouthWide: 0.1, lipRound: 0.9 },  // "w" (pursed lips)
  
  // Dental/Alveolar
  'T': { mouthOpen: 0.2, mouthWide: 0.5, lipRound: 0 },    // "t", "d", "n" (tongue up)
  'S': { mouthOpen: 0.15, mouthWide: 0.6, lipRound: 0 },   // "s", "z" (teeth showing)
  
  // Palatal
  'SH': { mouthOpen: 0.2, mouthWide: 0.5, lipRound: 0.3 }, // "sh", "ch" (rounded)
  
  // Velar
  'K': { mouthOpen: 0.4, mouthWide: 0.4, lipRound: 0 },    // "k", "g" (back tongue up)
  
  // Glottal
  'HH': { mouthOpen: 0.3, mouthWide: 0.4, lipRound: 0 },   // "h" (breath)
};

class LipSyncEngine {
  constructor() {
    this.visemeMap = VISemeMap;
    this.blendSpeed = 0.15; // How fast to transition between visemes
    this.currentWeights = { mouthOpen: 0, mouthWide: 0, lipRound: 0 };
  }

  // Convert phoneme sequence to viseme animation
  phonemesToVisemes(phonemes) {
    return phonemes.map(p => ({
      viseme: this.phonemeToViseme(p.phoneme),
      startTime: p.startTime,
      duration: p.duration,
      weight: p.stress || 1.0,
    }));
  }

  phonemeToViseme(phoneme) {
    const mapping = {
      // Vowels
      'AA': 'A', 'AE': 'A', 'AH': 'A',
      'EH': 'E', 'ER': 'E', 'EY': 'E',
      'IY': 'I', 'IH': 'I',
      'OW': 'O', 'AO': 'O', 'AW': 'O',
      'UW': 'U', 'UH': 'U', 'OY': 'U',
      
      // Consonants
      'B': 'B', 'P': 'B', 'M': 'B',
      'F': 'F', 'V': 'F',
      'W': 'W',
      'T': 'T', 'D': 'T', 'N': 'T', 'L': 'T',
      'S': 'S', 'Z': 'S',
      'SH': 'SH', 'ZH': 'SH', 'CH': 'SH', 'JH': 'SH',
      'K': 'K', 'G': 'K', 'NG': 'K',
      'HH': 'HH',
      
      // Default
      'default': 'sil',
    };
    
    return mapping[phoneme] || mapping['default'];
  }

  // Interpolate between visemes for smooth animation
  interpolateVisemes(visemeA, visemeB, t) {
    const shapeA = this.visemeMap[visemeA] || this.visemeMap['sil'];
    const shapeB = this.visemeMap[visemeB] || this.visemeMap['sil'];
    
    return {
      mouthOpen: this.lerp(shapeA.mouthOpen, shapeB.mouthOpen, t),
      mouthWide: this.lerp(shapeA.mouthWide, shapeB.mouthWide, t),
      lipRound: this.lerp(shapeA.lipRound, shapeB.lipRound, t),
    };
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }
}
```

---

## 6. Connection Resilience

### 6.1 Connection Drop Recovery

```javascript
// /src/resilience/connection-recovery.js

class ConnectionRecoveryManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      maxReconnectAttempts: 5,
      reconnectDelayBase: 1000, // ms
      reconnectDelayMax: 30000, // ms
      iceRestartTimeout: 10000,
      sessionRecoveryTimeout: 30000,
      ...config,
    };
    
    this.state = 'new';
    this.reconnectAttempts = 0;
    this.lastConnectionState = null;
    this.recoveryTimer = null;
  }

  attachToPeerConnection(pc) {
    this.pc = pc;
    
    pc.onconnectionstatechange = () => {
      this.handleConnectionStateChange(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      this.handleIceConnectionStateChange(pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      this.handleSignalingStateChange(pc.signalingState);
    };
  }

  handleConnectionStateChange(state) {
    console.log(`Connection state: ${this.lastConnectionState} -> ${state}`);
    this.lastConnectionState = state;

    switch (state) {
      case 'connected':
        this.onConnected();
        break;
      case 'disconnected':
        this.onDisconnected();
        break;
      case 'failed':
        this.onFailed();
        break;
      case 'closed':
        this.onClosed();
        break;
    }
  }

  onConnected() {
    this.state = 'connected';
    this.reconnectAttempts = 0;
    this.clearRecoveryTimer();
    this.emit('connection:stable');
  }

  onDisconnected() {
    this.state = 'reconnecting';
    this.emit('connection:unstable');
    
    // Start recovery timer
    this.recoveryTimer = setTimeout(() => {
      this.attemptRecovery();
    }, this.config.iceRestartTimeout);
  }

  onFailed() {
    this.state = 'failed';
    this.attemptRecovery();
  }

  onClosed() {
    this.state = 'closed';
    this.emit('connection:closed');
  }

  async attemptRecovery() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('connection:failed');
      return;
    }

    this.reconnectAttempts++;
    this.emit('recovery:attempt', { attempt: this.reconnectAttempts });

    // Calculate backoff delay
    const delay = Math.min(
      this.config.reconnectDelayBase * Math.pow(2, this.reconnectAttempts - 1),
      this.config.reconnectDelayMax
    );

    await this.sleep(delay);

    try {
      // Attempt ICE restart
      await this.attemptIceRestart();
    } catch (err) {
      console.error('ICE restart failed:', err);
      
      // Fall back to full reconnection
      await this.attemptFullReconnection();
    }
  }

  async attemptIceRestart() {
    console.log('Attempting ICE restart...');
    
    // Create new offer with ICE restart
    const offer = await this.pc.createOffer({ iceRestart: true });
    await this.pc.setLocalDescription(offer);
    
    // Send to signaling server
    this.emit('signal:offer', {
      sdp: offer.sdp,
      type: offer.type,
      iceRestart: true,
    });

    // Wait for answer
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ICE restart timeout'));
      }, this.config.iceRestartTimeout);

      const onAnswer = (answer) => {
        clearTimeout(timeout);
        this.off('signal:answer', onAnswer);
        
        this.pc.setRemoteDescription(answer)
          .then(resolve)
          .catch(reject);
      };

      this.once('signal:answer', onAnswer);
    });
  }

  async attemptFullReconnection() {
    console.log('Attempting full reconnection...');
    
    // Close existing connection
    this.pc.close();
    
    // Emit event for parent to create new peer connection
    this.emit('connection:restart-required');
  }

  clearRecoveryTimer() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 6.2 Low Bandwidth Degradation

```javascript
// /src/resilience/bandwidth-adaptation.js

class BandwidthAdaptationController extends EventEmitter {
  constructor(peerConnection) {
    super();
    this.pc = peerConnection;
    this.sender = null;
    this.parameters = null;
    
    // Quality levels (bitrate in bps)
    this.qualityLevels = [
      { name: 'audio-only', videoBitrate: 0, audioBitrate: 32000 },
      { name: '240p', videoBitrate: 250000, audioBitrate: 32000 },
      { name: '360p', videoBitrate: 500000, audioBitrate: 32000 },
      { name: '480p', videoBitrate: 1000000, audioBitrate: 64000 },
      { name: '720p', videoBitrate: 2500000, audioBitrate: 64000 },
      { name: '1080p', videoBitrate: 4000000, audioBitrate: 128000 },
    ];
    
    this.currentLevel = 4; // Start at 720p
    this.isMonitoring = false;
    this.statsInterval = null;
  }

  async initialize() {
    // Get video sender
    const senders = this.pc.getSenders();
    this.sender = senders.find(s => 
      s.track && s.track.kind === 'video'
    );
    
    if (this.sender) {
      this.parameters = this.sender.getParameters();
    }
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.statsInterval = setInterval(() => {
      this.checkNetworkConditions();
    }, 2000);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  async checkNetworkConditions() {
    if (!this.isMonitoring) return;

    const stats = await this.pc.getStats();
    const report = this.parseStats(stats);
    
    // Calculate network quality score (0-100)
    const quality = this.calculateQualityScore(report);
    
    // Determine appropriate quality level
    const targetLevel = this.determineTargetLevel(quality, report);
    
    if (targetLevel !== this.currentLevel) {
      await this.applyQualityLevel(targetLevel);
    }

    this.emit('quality:update', {
      current: this.qualityLevels[this.currentLevel].name,
      target: this.qualityLevels[targetLevel].name,
      quality,
      stats: report,
    });
  }

  parseStats(stats) {
    const report = {
      inbound: {},
      outbound: {},
      candidatePair: null,
    };

    stats.forEach(stat => {
      switch (stat.type) {
        case 'inbound-rtp':
          report.inbound[stat.mediaType] = {
            bitrate: stat.bitrateMean,
            packetLoss: stat.packetsLost / stat.packetsReceived,
            jitter: stat.jitter,
            framesDecoded: stat.framesDecoded,
            framesDropped: stat.framesDropped,
          };
          break;
          
        case 'outbound-rtp':
          report.outbound[stat.mediaType] = {
            bitrate: stat.bitrateMean,
            packetsSent: stat.packetsSent,
            retransmittedPacketsSent: stat.retransmittedPacketsSent,
          };
          break;
          
        case 'candidate-pair':
          if (stat.state === 'succeeded') {
            report.candidatePair = {
              availableOutgoingBitrate: stat.availableOutgoingBitrate,
              currentRoundTripTime: stat.currentRoundTripTime,
            };
          }
          break;
      }
    });

    return report;
  }

  calculateQualityScore(report) {
    let score = 100;
    
    // Factor 1: Packet loss (major impact)
    const packetLoss = report.inbound.video?.packetLoss || 0;
    score -= packetLoss * 200; // -20 points per 10% loss
    
    // Factor 2: RTT (latency)
    const rtt = report.candidatePair?.currentRoundTripTime || 0;
    score -= rtt * 100; // -10 points per 100ms
    
    // Factor 3: Frame drop rate
    const framesDecoded = report.inbound.video?.framesDecoded || 1;
    const framesDropped = report.inbound.video?.framesDropped || 0;
    const dropRate = framesDropped / (framesDecoded + framesDropped);
    score -= dropRate * 100;
    
    // Factor 4: Available bandwidth
    const availableBitrate = report.candidatePair?.availableOutgoingBitrate || 0;
    const currentBitrate = this.qualityLevels[this.currentLevel].videoBitrate;
    if (availableBitrate < currentBitrate * 0.8) {
      score -= 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  determineTargetLevel(quality, report) {
    const availableBitrate = report.candidatePair?.availableOutgoingBitrate || 0;
    
    // Find highest quality that fits within available bandwidth
    for (let i = this.qualityLevels.length - 1; i >= 0; i--) {
      const level = this.qualityLevels[i];
      const requiredBitrate = level.videoBitrate + level.audioBitrate;
      
      // Add 20% safety margin
      if (availableBitrate >= requiredBitrate * 1.2) {
        // Don't downgrade if quality is good
        if (quality > 80 && i < this.currentLevel) {
          return this.currentLevel;
        }
        return i;
      }
    }
    
    return 0; // Fallback to audio-only
  }

  async applyQualityLevel(levelIndex) {
    const level = this.qualityLevels[levelIndex];
    console.log(`Adapting quality: ${this.qualityLevels[this.currentLevel].name} -> ${level.name}`);
    
    if (!this.sender) return;

    // Update encoding parameters
    const params = this.sender.getParameters();
    
    if (params.encodings && params.encodings.length > 0) {
      // Update max bitrate
      params.encodings[0].maxBitrate = level.videoBitrate;
      
      // Update scale resolution down by if needed
      if (level.videoBitrate === 0) {
        params.encodings[0].active = false; // Disable video
      } else {
        params.encodings[0].active = true;
      }
      
      await this.sender.setParameters(params);
    }

    this.currentLevel = levelIndex;
    this.emit('quality:changed', { level: level.name, bitrate: level.videoBitrate });
  }

  // Force specific quality (user preference)
  async setManualQuality(qualityName) {
    const levelIndex = this.qualityLevels.findIndex(l => l.name === qualityName);
    if (levelIndex >= 0) {
      this.stopMonitoring(); // Disable auto-adaptation
      await this.applyQualityLevel(levelIndex);
    }
  }

  // Resume auto-adaptation
  resumeAutoAdaptation() {
    this.startMonitoring();
  }
}
```

### 6.3 Mobile Network Switching

```javascript
// /src/resilience/mobile-network-handler.js

class MobileNetworkHandler extends EventEmitter {
  constructor(peerConnection) {
    super();
    this.pc = peerConnection;
    this.connectionType = 'unknown';
    this.effectiveType = '4g';
    this.downlink = 10;
    this.rtt = 50;
    
    this.setupNetworkMonitoring();
  }

  setupNetworkMonitoring() {
    // Network Information API
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      this.updateNetworkInfo(connection);
      
      connection.addEventListener('change', () => {
        this.updateNetworkInfo(connection);
        this.handleNetworkChange();
      });
    }

    // Online/offline events
    window.addEventListener('online', () => {
      this.emit('network:online');
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.emit('network:offline');
      this.handleOffline();
    });

    // Page visibility (app background/foreground)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackground();
      } else {
        this.handleForeground();
      }
    });
  }

  updateNetworkInfo(connection) {
    this.connectionType = connection.type || 'unknown';
    this.effectiveType = connection.effectiveType || '4g';
    this.downlink = connection.downlink || 10;
    this.rtt = connection.rtt || 50;
    
    this.emit('network:info', {
      type: this.connectionType,
      effectiveType: this.effectiveType,
      downlink: this.downlink,
      rtt: this.rtt,
    });
  }

  async handleNetworkChange() {
    console.log(`Network changed: ${this.connectionType} (${this.effectiveType})`);
    
    // Detect network switch (e.g., WiFi -> 4G)
    const isCellular = this.connectionType === 'cellular';
    const isMetered = navigator.connection?.saveData || isCellular;
    
    this.emit('network:switch', {
      isCellular,
      isMetered,
      effectiveType: this.effectiveType,
    });

    // Trigger ICE restart for new network path
    await this.performIceRestart();

    // Adapt quality based on new network
    if (isCellular && this.effectiveType === '2g') {
      await this.degradeToAudioOnly();
    } else if (isCellular && this.effectiveType === '3g') {
      await this.reduceQuality('360p');
    }
  }

  async performIceRestart() {
    try {
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      
      this.emit('signal:ice-restart', {
        sdp: offer.sdp,
        type: offer.type,
      });
    } catch (err) {
      console.error('ICE restart failed:', err);
      this.emit('error:ice-restart', err);
    }
  }

  handleOnline() {
    console.log('Network is online');
    // Connection may recover automatically
    this.emit('network:recovered');
  }

  handleOffline() {
    console.log('Network is offline');
    // Pause streaming, wait for recovery
    this.emit('network:lost');
  }

  handleBackground() {
    console.log('App moved to background');
    
    // Reduce resource usage
    this.emit('app:background');
    
    // Optional: Pause video, keep audio
    this.pc.getSenders().forEach(sender => {
      if (sender.track && sender.track.kind === 'video') {
        sender.track.enabled = false;
      }
    });
  }

  handleForeground() {
    console.log('App moved to foreground');
    
    // Resume normal operation
    this.emit('app:foreground');
    
    this.pc.getSenders().forEach(sender => {
      if (sender.track) {
        sender.track.enabled = true;
      }
    });
  }

  async degradeToAudioOnly() {
    this.emit('quality:degrade', { to: 'audio-only' });
    
    const videoSender = this.pc.getSenders().find(s => 
      s.track && s.track.kind === 'video'
    );
    
    if (videoSender) {
      const params = videoSender.getParameters();
      if (params.encodings) {
        params.encodings[0].active = false;
        await videoSender.setParameters(params);
      }
    }
  }

  async reduceQuality(targetQuality) {
    this.emit('quality:reduce', { to: targetQuality });
    // Implementation delegated to BandwidthAdaptationController
  }

  // Battery-aware adaptation
  async checkBatteryStatus() {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      
      if (battery.level < 0.2 && !battery.charging) {
        this.emit('battery:low');
        await this.degradeToAudioOnly();
      }
    }
  }
}
```

---

## 7. Video Session State Machine

### 7.1 State Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VIDEO SESSION STATE MACHINE                            │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   INITIAL   │
                              │    STATE    │
                              └──────┬──────┘
                                     │
                                     │ createSession()
                                     ▼
┌─────────────┐    timeout/     ┌─────────────┐    signaling    ┌─────────────┐
│    ENDED    │◄──max retries──│ CONNECTING  │◄───connected────┤  SIGNALING  │
│             │◄───────────────┤             │                 │   SERVER    │
└─────────────┘                └──────┬──────┘                 └─────────────┘
       ▲                              │
       │                              │ offer/answer complete
       │                              │ ICE connected
       │                              ▼
       │                       ┌─────────────┐
       │                       │   ACTIVE    │◄──────────────────────────────┐
       │                       │             │                               │
       │                       └──────┬──────┘                               │
       │                              │                                      │
       │         ┌────────────────────┼────────────────────┐                 │
       │         │                    │                    │                 │
       │         │ user pause         │ network issue      │ session complete│
       │         ▼                    ▼                    │                 │
       │    ┌─────────────┐     ┌─────────────┐           │                 │
       │    │   PAUSED    │     │RECONNECTING │───────────┘                 │
       │    │             │     │             │  recovered                    │
       │    └──────┬──────┘     └──────┬──────┘                               │
       │           │ resume              │ max retries                        │
       │           │                     │ exceeded                           │
       └───────────┴─────────────────────┴────────────────────────────────────┘
```

### 7.2 State Definitions

| State | Description | Transitions |
|-------|-------------|-------------|
| `initial` | Session object created, not yet connecting | → `connecting` |
| `connecting` | Signaling in progress, ICE gathering | → `active`, → `reconnecting`, → `ended` |
| `active` | Media flowing bidirectionally | → `paused`, → `reconnecting`, → `ended` |
| `paused` | User-initiated pause, media suspended | → `active`, → `ended` |
| `reconnecting` | Connection lost, attempting recovery | → `active`, → `ended` |
| `ended` | Session terminated, resources released | (terminal) |

### 7.3 State Machine Implementation

```javascript
// /src/session/session-state-machine.js

const { EventEmitter } = require('events');

class VideoSessionStateMachine extends EventEmitter {
  constructor(sessionId) {
    super();
    this.sessionId = sessionId;
    this.state = 'initial';
    this.stateHistory = [];
    this.context = {
      connectStartTime: null,
      activeStartTime: null,
      pauseStartTime: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      reconnectTimeout: null,
    };
  }

  // State transition method
  async transition(newState, reason = '') {
    const oldState = this.state;
    
    // Validate transition
    if (!this.isValidTransition(oldState, newState)) {
      throw new Error(
        `Invalid state transition: ${oldState} -> ${newState}`
      );
    }

    // Log transition
    this.stateHistory.push({
      from: oldState,
      to: newState,
      reason,
      timestamp: Date.now(),
    });

    // Execute exit handler for old state
    await this.onExitState(oldState);

    // Update state
    this.state = newState;
    console.log(`Session ${this.sessionId}: ${oldState} -> ${newState} (${reason})`);

    // Execute entry handler for new state
    await this.onEnterState(newState, oldState, reason);

    // Emit state change event
    this.emit('state:changed', {
      sessionId: this.sessionId,
      previousState: oldState,
      currentState: newState,
      reason,
      timestamp: Date.now(),
    });

    return this.state;
  }

  isValidTransition(from, to) {
    const validTransitions = {
      'initial': ['connecting', 'ended'],
      'connecting': ['active', 'reconnecting', 'ended'],
      'active': ['paused', 'reconnecting', 'ended'],
      'paused': ['active', 'reconnecting', 'ended'],
      'reconnecting': ['active', 'ended'],
      'ended': [], // Terminal state
    };

    return validTransitions[from]?.includes(to) || false;
  }

  async onEnterState(state, fromState, reason) {
    switch (state) {
      case 'connecting':
        this.context.connectStartTime = Date.now();
        this.emit('action:start-connecting');
        break;

      case 'active':
        this.context.activeStartTime = Date.now();
        this.context.reconnectAttempts = 0;
        this.clearReconnectTimeout();
        this.emit('action:start-media');
        break;

      case 'paused':
        this.context.pauseStartTime = Date.now();
        this.emit('action:pause-media');
        break;

      case 'reconnecting':
        this.context.reconnectAttempts++;
        this.emit('action:start-reconnect');
        this.scheduleReconnectTimeout();
        break;

      case 'ended':
        this.emit('action:cleanup');
        break;
    }
  }

  async onExitState(state) {
    switch (state) {
      case 'connecting':
        // Log connection time if successful
        if (this.context.connectStartTime) {
          const connectTime = Date.now() - this.context.connectStartTime;
          this.emit('metric:connect-time', connectTime);
        }
        break;

      case 'active':
        // Log active session time
        if (this.context.activeStartTime) {
          const activeTime = Date.now() - this.context.activeStartTime;
          this.emit('metric:active-time', activeTime);
        }
        break;

      case 'paused':
        // Log pause duration
        if (this.context.pauseStartTime) {
          const pauseTime = Date.now() - this.context.pauseStartTime;
          this.emit('metric:pause-time', pauseTime);
        }
        this.context.pauseStartTime = null;
        break;

      case 'reconnecting':
        this.clearReconnectTimeout();
        break;
    }
  }

  scheduleReconnectTimeout() {
    const timeout = Math.min(
      5000 * Math.pow(2, this.context.reconnectAttempts - 1),
      30000
    );

    this.context.reconnectTimeout = setTimeout(() => {
      if (this.context.reconnectAttempts >= this.context.maxReconnectAttempts) {
        this.transition('ended', 'max-reconnect-attempts');
      }
    }, timeout);
  }

  clearReconnectTimeout() {
    if (this.context.reconnectTimeout) {
      clearTimeout(this.context.reconnectTimeout);
      this.context.reconnectTimeout = null;
    }
  }

  // Public action methods
  async startConnecting() {
    return this.transition('connecting', 'user-initiated');
  }

  async connectionEstablished() {
    return this.transition('active', 'ice-connected');
  }

  async pause() {
    if (this.state === 'active') {
      return this.transition('paused', 'user-pause');
    }
  }

  async resume() {
    if (this.state === 'paused') {
      return this.transition('active', 'user-resume');
    }
  }

  async connectionLost() {
    if (['active', 'paused', 'connecting'].includes(this.state)) {
      return this.transition('reconnecting', 'connection-lost');
    }
  }

  async connectionRecovered() {
    if (this.state === 'reconnecting') {
      return this.transition('active', 'reconnect-success');
    }
  }

  async end(reason = 'user-ended') {
    return this.transition('ended', reason);
  }

  getCurrentState() {
    return {
      state: this.state,
      context: { ...this.context },
      history: this.stateHistory,
    };
  }
}
```

### 7.4 Session Manager Integration

```javascript
// /src/session/session-manager.js

class VideoSessionManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.sessions = new Map(); // sessionId -> session
    this.stateMachines = new Map(); // sessionId -> stateMachine
    this.recoveryQueue = new Map(); // sessionId -> recoveryInfo
  }

  async createSession(userId, options = {}) {
    const sessionId = generateUUID();
    
    // Create session state machine
    const stateMachine = new VideoSessionStateMachine(sessionId);
    this.setupStateMachineListeners(sessionId, stateMachine);
    this.stateMachines.set(sessionId, stateMachine);

    // Create session object
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      options,
      peerConnection: null,
      signalingSocket: null,
    };
    this.sessions.set(sessionId, session);

    // Start connecting
    await stateMachine.startConnecting();

    return sessionId;
  }

  setupStateMachineListeners(sessionId, stateMachine) {
    stateMachine.on('action:start-connecting', () => {
      this.initiateConnection(sessionId);
    });

    stateMachine.on('action:start-media', () => {
      this.startMediaStreaming(sessionId);
    });

    stateMachine.on('action:pause-media', () => {
      this.pauseMediaStreaming(sessionId);
    });

    stateMachine.on('action:start-reconnect', () => {
      this.initiateReconnection(sessionId);
    });

    stateMachine.on('action:cleanup', () => {
      this.cleanupSession(sessionId);
    });

    stateMachine.on('state:changed', (data) => {
      this.emit('session:state-changed', data);
    });
  }

  async initiateConnection(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: await this.getIceServers(),
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      });

      // Setup connection monitoring
      this.setupPeerConnectionMonitoring(sessionId, pc);

      session.peerConnection = pc;

      // Connect to signaling
      await this.connectSignaling(sessionId);

    } catch (err) {
      console.error('Connection initiation failed:', err);
      const sm = this.stateMachines.get(sessionId);
      await sm.connectionLost();
    }
  }

  setupPeerConnectionMonitoring(sessionId, pc) {
    const stateMachine = this.stateMachines.get(sessionId);

    pc.onconnectionstatechange = () => {
      console.log(`PC state for ${sessionId}: ${pc.connectionState}`);
      
      switch (pc.connectionState) {
        case 'connected':
          stateMachine.connectionEstablished();
          break;
        case 'disconnected':
          stateMachine.connectionLost();
          break;
        case 'failed':
          stateMachine.connectionLost();
          break;
        case 'closed':
          stateMachine.end('connection-closed');
          break;
      }
    };
  }

  async initiateReconnection(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.peerConnection) return;

    const stateMachine = this.stateMachines.get(sessionId);
    const attempts = stateMachine.context.reconnectAttempts;

    console.log(`Reconnection attempt ${attempts} for session ${sessionId}`);

    try {
      // Attempt ICE restart
      const pc = session.peerConnection;
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);

      // Send through signaling
      session.signalingSocket.emit('webrtc:offer', {
        sessionId,
        sdp: offer.sdp,
        type: offer.type,
        iceRestart: true,
      });

      // Wait for answer with timeout
      const answer = await this.waitForAnswer(sessionId, 10000);
      await pc.setRemoteDescription(answer);

      // Reconnection successful
      stateMachine.connectionRecovered();

    } catch (err) {
      console.error('Reconnection attempt failed:', err);
      
      // Will trigger next attempt or end session
      if (attempts >= stateMachine.context.maxReconnectAttempts) {
        stateMachine.end('max-reconnect-attempts');
      }
    }
  }

  async pauseSession(sessionId) {
    const stateMachine = this.stateMachines.get(sessionId);
    if (stateMachine) {
      await stateMachine.pause();
    }
  }

  async resumeSession(sessionId) {
    const stateMachine = this.stateMachines.get(sessionId);
    if (stateMachine) {
      await stateMachine.resume();
    }
  }

  async endSession(sessionId, reason = 'user-ended') {
    const stateMachine = this.stateMachines.get(sessionId);
    if (stateMachine) {
      await stateMachine.end(reason);
    }
  }

  async cleanupSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Close peer connection
    if (session.peerConnection) {
      session.peerConnection.close();
    }

    // Close signaling
    if (session.signalingSocket) {
      session.signalingSocket.disconnect();
    }

    // Remove from maps
    this.sessions.delete(sessionId);
    this.stateMachines.delete(sessionId);

    this.emit('session:ended', { sessionId });
  }

  getSessionState(sessionId) {
    const stateMachine = this.stateMachines.get(sessionId);
    return stateMachine ? stateMachine.getCurrentState() : null;
  }
}
```

---

## 8. Security Considerations

### 8.1 DTLS/SRTP Configuration

```javascript
// Security settings for WebRTC
const securityConfig = {
  // DTLS configuration
  dtls: {
    // Minimum TLS version
    minVersion: '1.2',
    
    // Cipher suites (prioritize forward secrecy)
    cipherSuites: [
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
    ],
    
    // Certificate requirements
    certificate: {
      keyType: 'ECDSA', // Faster than RSA for DTLS
      namedCurve: 'P-256',
    },
  },

  // SRTP configuration
  srtp: {
    // Crypto suites (most secure first)
    cryptoSuites: [
      'AES_GCM_256', // AEAD, most secure
      'AES_GCM_128',
      'AES_CM_256_HMAC_SHA1_80',
      'AES_CM_128_HMAC_SHA1_80',
    ],
  },
};
```

### 8.2 HIPAA Compliance Measures

| Requirement | Implementation |
|-------------|----------------|
| **Encryption in Transit** | DTLS 1.2+ for key exchange, SRTP for media |
| **No Persistent Storage** | Media streams never written to disk |
| **Session Isolation** | Each session in separate router/worker |
| **Access Logging** | All signaling events logged with session ID |
| **Audit Trail** | Complete session lifecycle tracking |
| **Token Expiration** | Short-lived tokens (15 min max) |

---

## 9. Performance Metrics & Monitoring

### 9.1 Key Metrics

```yaml
Connection Metrics:
  - connection_setup_time_ms: Time from create to connected
  - ice_gathering_time_ms: Time to gather all candidates
  - reconnection_count: Number of reconnection attempts
  - reconnection_success_rate: % of successful reconnections

Media Quality Metrics:
  - video_bitrate_bps: Current video bitrate
  - audio_bitrate_bps: Current audio bitrate
  - frame_rate_fps: Actual rendered frame rate
  - resolution: Current video resolution
  - packet_loss_percent: RTP packet loss
  - jitter_ms: RTP jitter
  - rtt_ms: Round-trip time

User Experience Metrics:
  - time_to_first_frame_ms: Time until first video frame
  - freeze_count: Number of video freezes
  - freeze_duration_ms: Total freeze duration
  - quality_adaptation_count: Number of quality changes
```

### 9.2 Monitoring Dashboard

```javascript
// /src/monitoring/metrics-collector.js

class WebRTCMetricsCollector {
  constructor(peerConnection, sessionId) {
    this.pc = peerConnection;
    this.sessionId = sessionId;
    this.metrics = {
      startTime: Date.now(),
      samples: [],
    };
  }

  startCollection(intervalMs = 2000) {
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  async collectMetrics() {
    const stats = await this.pc.getStats();
    const sample = {
      timestamp: Date.now(),
      connectionState: this.pc.connectionState,
      iceConnectionState: this.pc.iceConnectionState,
    };

    stats.forEach(report => {
      switch (report.type) {
        case 'inbound-rtp':
          if (report.mediaType === 'video') {
            sample.inboundVideo = {
              bitrate: report.bitrateMean,
              frameRate: report.framesPerSecond,
              framesDecoded: report.framesDecoded,
              framesDropped: report.framesDropped,
              packetsLost: report.packetsLost,
              jitter: report.jitter,
            };
          }
          break;

        case 'candidate-pair':
          if (report.state === 'succeeded') {
            sample.network = {
              availableOutgoingBitrate: report.availableOutgoingBitrate,
              currentRoundTripTime: report.currentRoundTripTime,
            };
          }
          break;
      }
    });

    this.metrics.samples.push(sample);
    this.emit('metrics:sample', sample);
  }

  getSummary() {
    const samples = this.metrics.samples;
    if (samples.length === 0) return null;

    const videoSamples = samples.filter(s => s.inboundVideo);
    
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.metrics.startTime,
      avgBitrate: this.average(videoSamples.map(s => s.inboundVideo?.bitrate)),
      avgFrameRate: this.average(videoSamples.map(s => s.inboundVideo?.frameRate)),
      totalFramesDropped: videoSamples[videoSamples.length - 1]?.inboundVideo?.framesDropped || 0,
      avgRtt: this.average(samples.map(s => s.network?.currentRoundTripTime)) * 1000,
    };
  }

  average(values) {
    const valid = values.filter(v => v !== undefined && v !== null);
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }
}
```

---

## 10. Deployment Architecture

### 10.1 Kubernetes Deployment

```yaml
# /k8s/webrtc-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mindmate-signaling
  namespace: webrtc
spec:
  replicas: 3
  selector:
    matchLabels:
      app: signaling
  template:
    metadata:
      labels:
        app: signaling
    spec:
      containers:
      - name: signaling
        image: mindmate/signaling-server:v1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        - name: TURN_SECRET
          valueFrom:
            secretKeyRef:
              name: turn-credentials
              key: secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mindmate-media
  namespace: webrtc
spec:
  replicas: 2
  selector:
    matchLabels:
      app: media
  template:
    metadata:
      labels:
        app: media
    spec:
      hostNetwork: true  # Required for UDP port range
      containers:
      - name: media
        image: mindmate/media-server:v1.0.0
        ports:
        - containerPort: 10000
          protocol: UDP
        resources:
          requests:
            memory: "1Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "4000m"
```

### 10.2 Infrastructure Requirements

| Component | Specification | Scaling |
|-----------|---------------|---------|
| Signaling Servers | 2 vCPU, 512MB RAM | Horizontal (3+ nodes) |
| TURN Servers | 4 vCPU, 2GB RAM, UDP ports 49152-65535 | Per-region deployment |
| Media Servers | 4 vCPU, 4GB RAM, GPU optional | Horizontal (2+ nodes) |
| Redis Cluster | 2GB RAM, persistent | 3-node cluster |
| Load Balancer | SSL termination, sticky sessions | Managed service |

---

## Appendix A: API Reference

### Signaling Protocol

```typescript
// Client -> Server
interface ClientMessages {
  'session:create': { userId: string; therapyType: string };
  'session:join': { sessionId: string };
  'session:leave': { sessionId: string };
  'webrtc:offer': { sessionId: string; sdp: string; type: 'offer' };
  'webrtc:answer': { sessionId: string; sdp: string; type: 'answer' };
  'webrtc:ice-candidate': { sessionId: string; candidate: RTCIceCandidateInit };
  'state:pause': { sessionId: string };
  'state:resume': { sessionId: string };
  'quality:set': { sessionId: string; quality: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p' };
}

// Server -> Client
interface ServerMessages {
  'session:created': { sessionId: string; iceServers: RTCIceServer[] };
  'session:joined': { sessionId: string; participants: Participant[] };
  'session:ended': { sessionId: string; reason: string };
  'webrtc:offer': { sdp: string; type: 'offer' };
  'webrtc:answer': { sdp: string; type: 'answer' };
  'webrtc:ice-candidate': { candidate: RTCIceCandidateInit };
  'state:paused': { sessionId: string };
  'state:resumed': { sessionId: string };
  'quality:changed': { quality: string; bitrate: number };
  'error:signaling': { code: string; message: string };
}
```

---

## Appendix B: Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `SESSION_NOT_FOUND` | Session ID doesn't exist | Create new session |
| `SESSION_FULL` | Session at capacity | Try again later |
| `UNAUTHORIZED` | Invalid or expired token | Re-authenticate |
| `RATE_LIMITED` | Too many requests | Back off and retry |
| `ICE_FAILED` | ICE connection failed | Retry with TURN |
| `MEDIA_ERROR` | Media streaming error | Restart session |
| `NETWORK_ERROR` | Network unreachable | Check connectivity |

---

*Document Version: 1.0.0*  
*MindMate AI - Technical Architecture Team*
