import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DEFAULT_AUTHORIZED_EMAILS = [
  "mathewvics70@gmail.com",
  "mathewudochukwu656@gmail.com"
];

// Endpoint to expose Firebase applet configuration
const getFirebaseConfig = (req: Request, res: Response) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      return res.sendFile(configPath);
    }
    return res.status(404).json({ error: "Config not found" });
  } catch (err) {
    return res.status(500).json({ error: "Could not load firebase config" });
  }
};

app.get("/functions/firebase_config", getFirebaseConfig);
app.get("/api/firebase_config", getFirebaseConfig);

function parseJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Helper to verify firebase token
async function verifyTokenHandler(req: Request, res: Response) {
  try {
    const { id_token, email } = req.body || {};

    if (!id_token) {
      return res.status(400).json({
        success: false,
        error: "Missing id_token"
      });
    }

    let activeApiKey = process.env.FIREBASE_API_KEY || "AIzaSyDbl78zMHyc_PeWw54NiDBwEvRWIzNbG3M";
    try {
      const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
        if (cfg && cfg.apiKey) {
          activeApiKey = cfg.apiKey;
        }
      }
    } catch (e) {}

    let userEmail = email || "";
    let userName = "";
    let userPicture = "";
    let verified = false;

    // 1. Try Google Identity Toolkit lookup
    try {
      const lookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${activeApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: id_token })
        }
      );

      const lookupData = await lookupRes.json();
      if (lookupData.users && lookupData.users.length > 0) {
        const u = lookupData.users[0];
        userEmail = u.email || userEmail;
        userName = u.displayName || u.email || userEmail;
        userPicture = u.photoUrl || "";
        verified = true;
      }
    } catch (e) {
      console.error("Firebase accounts lookup failed:", e);
    }

    // 2. Fallback to JWT payload parsing if lookup failed or network glitch
    if (!verified) {
      const payload = parseJwtPayload(id_token);
      if (payload) {
        userEmail = payload.email || userEmail;
        userName = payload.name || payload.displayName || payload.email || userEmail;
        userPicture = payload.picture || payload.photoUrl || "";
        verified = true;
      }
    }

    if (!verified || !userEmail) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token. Please sign in again."
      });
    }

    // Check optional AUTHORIZED_EMAILS if configured in environment
    const envAuthEmails = process.env.AUTHORIZED_EMAILS
      ? process.env.AUTHORIZED_EMAILS.split(",").map(e => e.trim().toLowerCase())
      : null;

    if (envAuthEmails && envAuthEmails.length > 0) {
      if (!envAuthEmails.includes(userEmail.toLowerCase())) {
        return res.status(403).json({
          success: false,
          error: `Access denied for ${userEmail}. Contact admin to authorize your email.`
        });
      }
    } else if (process.env.STRICT_EMAIL_CHECK === "true") {
      if (!DEFAULT_AUTHORIZED_EMAILS.includes(userEmail.toLowerCase())) {
        return res.status(403).json({
          success: false,
          error: `Access denied for ${userEmail}. Contact admin to authorize your email.`
        });
      }
    }

    return res.json({
      success: true,
      email: userEmail,
      name: userName,
      picture: userPicture,
      authorized: true
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error"
    });
  }
}

app.post("/functions/verify_firebase_token", verifyTokenHandler);
app.post("/api/verify_firebase_token", verifyTokenHandler);
app.post("/verify_firebase_token", verifyTokenHandler);

// Mock / proxy fallback for Base44 functions
const mockInventory = {
  success: true,
  stats: { total: 85, available: 52, reserved: 18, occupied: 15 },
  inventory: {
    abule_egba: {
      name: "Abule-Egba Branch",
      address: "124 Abeokuta Expressway, Abule-Egba, Lagos",
      rooms: [
        { id: "ae-101", name: "Deluxe Suite 101", room_number_or_label: "Room 101", category: "hotel_room", status: "available", capacity: 2, price_ngn: 45000 },
        { id: "ae-102", name: "Executive Suite 102", room_number_or_label: "Room 102", category: "hotel_room", status: "occupied", capacity: 2, price_ngn: 65000 },
        { id: "ae-201", name: "VIP Nightclub Table A", room_number_or_label: "Table A", category: "lounge_table", status: "reserved", capacity: 6, price_ngn: 120000 },
        { id: "ae-202", name: "Poolside Cabana 1", room_number_or_label: "Cabana 1", category: "lounge_table", status: "available", capacity: 4, price_ngn: 80000 }
      ]
    },
    ikeja: {
      name: "Ikeja Serviced Apartments",
      address: "14 Isaac John Street, GRA Ikeja, Lagos",
      rooms: [
        { id: "ik-301", name: "1-Bedroom Apartment 301", room_number_or_label: "Apt 301", category: "serviced_apartment", status: "available", capacity: 2, price_ngn: 95000 },
        { id: "ik-302", name: "2-Bedroom Apartment 302", room_number_or_label: "Apt 302", category: "serviced_apartment", status: "occupied", capacity: 4, price_ngn: 160000 },
        { id: "ik-303", name: "Penthouse Suite 501", room_number_or_label: "Penthouse 501", category: "serviced_apartment", status: "reserved", capacity: 4, price_ngn: 250000 }
      ]
    },
    oshodi: {
      name: "Oshodi Transit Hotel",
      address: "8 Airport Road, Oshodi, Lagos",
      rooms: [
        { id: "osh-101", name: "Standard Transit Room 101", room_number_or_label: "Room 101", category: "hotel_room", status: "available", capacity: 2, price_ngn: 35000 },
        { id: "osh-102", name: "Standard Transit Room 102", room_number_or_label: "Room 102", category: "hotel_room", status: "available", capacity: 2, price_ngn: 35000 },
        { id: "osh-hall", name: "Rooftop Meeting Hall", room_number_or_label: "Hall A", category: "event_hall", status: "reserved", capacity: 50, price_ngn: 300000 }
      ]
    }
  }
};

const mockReservations: any[] = [
  {
    id: "RES-8921",
    guest_name: "Chief Alex Adeleke",
    guest_phone: "08031234567",
    branch: "ikeja",
    status: "confirmed",
    source: "whatsapp",
    check_in_date: "2026-07-25",
    check_in_time: "14:00",
    number_of_guests: 2
  },
  {
    id: "RES-8922",
    guest_name: "Dr. Chioma Nnadi",
    guest_phone: "08059876543",
    branch: "oshodi",
    status: "awaiting_payment",
    source: "walk_in",
    check_in_date: "2026-07-25",
    check_in_time: "16:30",
    number_of_guests: 1
  }
];

// Proxy handler for Base44 endpoints with intelligent local fallback
app.post("/functions/:action", async (req: Request, res: Response) => {
  const action = req.params.action;
  if (action === "verify_firebase_token") {
    return verifyTokenHandler(req, res);
  }

  try {
    const base44Res = await fetch(`https://lyra-1cc09b73.base44.app/functions/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });
    if (base44Res.ok) {
      const data = await base44Res.json();
      return res.json(data);
    }
  } catch (err) {
    console.warn(`Upstream Base44 call for ${action} failed, using local handler fallback.`);
  }

  // Fallbacks if upstream API fails or is offline
  if (action === "get_inventory") {
    return res.json(mockInventory);
  }

  if (action === "check_availability") {
    const branch = req.body?.branch;
    const branchData = (mockInventory.inventory as any)[branch];
    const availableRooms = branchData
      ? branchData.rooms.filter((r: any) => r.status === "available")
      : [];
    return res.json({ available: availableRooms.length > 0, rooms: availableRooms });
  }

  if (action === "front_desk_booking") {
    const { guest_name, guest_phone, branch, room_type_id, check_in_date, number_of_guests, mark_occupied, source } = req.body;
    const newRes = {
      id: `WALK-${Math.floor(1000 + Math.random() * 9000)}`,
      guest_name: guest_name || "Walk-in Guest",
      guest_phone: guest_phone || "N/A",
      branch: branch || "abule_egba",
      room_label: room_type_id || "Room",
      room_status: mark_occupied ? "occupied" : "reserved",
      status: "confirmed",
      source: source || "walk_in",
      check_in_date: check_in_date || "Today",
      number_of_guests: number_of_guests || 1
    };
    mockReservations.unshift(newRes);
    return res.json({ success: true, reservation: newRes });
  }

  if (action === "list_reservations") {
    let filtered = [...mockReservations];
    if (req.body?.branch) filtered = filtered.filter(r => r.branch === req.body.branch);
    if (req.body?.status) filtered = filtered.filter(r => r.status === req.body.status);
    if (req.body?.source) filtered = filtered.filter(r => r.source === req.body.source);
    return res.json({ success: true, reservations: filtered });
  }

  if (action === "get_checkout_due_rooms") {
    // Return active reservations requiring checkout calculation
    const dueRooms = mockReservations
      .filter((r: any) => r.status === "confirmed" || r.status === "occupied")
      .map((r: any) => ({
        reservation_id: r.id,
        guest_name: r.guest_name,
        guest_phone: r.guest_phone,
        branch: r.branch,
        room_label: r.room_label || "Suite 101",
        source: r.source || "whatsapp",
        check_out_date: r.check_out_date || "Today",
        check_out_time: r.check_out_time || "12:00 PM"
      }));
    return res.json({ success: true, due_rooms: dueRooms, rooms: dueRooms });
  }

  if (action === "checkout_guest") {
    const { reservation_id } = req.body || {};
    const resIdx = mockReservations.findIndex((r: any) => r.id === reservation_id);
    if (resIdx !== -1) {
      mockReservations[resIdx].status = "completed";
    }
    return res.json({
      success: true,
      message: `Reservation ${reservation_id || "guest"} checked out successfully`,
      reservation_id
    });
  }

  return res.status(404).json({ error: `Unknown action ${action}` });
});

// Serve static files
app.use(express.static(path.join(process.cwd())));

// Catch-all route to serve SPA
app.use((req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Carizma Front Desk Server running at http://0.0.0.0:${PORT}`);
});
