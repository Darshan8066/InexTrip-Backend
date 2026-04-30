const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// userId (string) → { socketId, role }
const connectedUsers = new Map();

let io;

/**
 * Initialise Socket.io on the HTTP server.
 * Call once from server.js: initSocket(httpServer)
 */
function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // ── JWT auth on every socket handshake ────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("No token provided"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Always store as plain string so Map lookups are reliable
            socket.userId = String(decoded.id || decoded._id);
            socket.userRole = decoded.role;   // "USER" | "ADMIN"

            next();
        } catch (err) {
            next(new Error("Invalid or expired token"));
        }
    });

    // ── Connection handler ───────────────────────────────────────────────────
    io.on("connection", (socket) => {
        const userId = socket.userId;
        const role = socket.userRole;

        connectedUsers.set(userId, { socketId: socket.id, role });
        console.log(`🟢 Socket connected  | user: ${userId} | role: ${role} | socket: ${socket.id}`);

        // Clean up on disconnect
        socket.on("disconnect", () => {
            connectedUsers.delete(userId);
            console.log(`🔌 Socket disconnected: ${userId}`);
        });
    });

    return io;
}

// ── Emit helpers ─────────────────────────────────────────────────────────────

/** Send a notification to one specific user */
function emitToUser(userId, notification) {
    const entry = connectedUsers.get(String(userId));
    if (entry && io) {
        io.to(entry.socketId).emit("new_notification", notification);
    }
}

/** Send a notification to every connected ADMIN */
function emitToAdmins(notification) {
    if (!io) return;
    for (const [, entry] of connectedUsers) {
        if (entry.role === "ADMIN") {
            io.to(entry.socketId).emit("new_notification", notification);
        }
    }
}

/** Send a notification to every connected non-admin user */
function emitToAllUsers(notification) {
    if (!io) return;
    for (const [, entry] of connectedUsers) {
        if (entry.role !== "ADMIN") {
            io.to(entry.socketId).emit("new_notification", notification);
        }
    }
}

module.exports = { initSocket, emitToUser, emitToAdmins, emitToAllUsers };
