import { User, Bar, MenuItem, Comment, Product, Message, BarUpdate } from '../types';
import { saveToIndexedDB } from './indexedDbBackup';

const defaultUsers: User[] = [
  { id: "admin1", name: "Administrator", role: "admin", password: "admin123" },
  { id: "mgr1", name: "Rusty Nail Manager", role: "manager", barId: "b1", approved: true, subscriptionActive: true },
  { id: "mgr2", name: "Neon Palms Manager", role: "manager", barId: "b2", approved: true, subscriptionActive: false },
  { id: "mgr3", name: "Copper Mug Manager", role: "manager", barId: "b3", approved: false, subscriptionActive: true },
  { id: "mgr4", name: "Cellar 47 Manager", role: "manager", barId: "b4", approved: true, subscriptionActive: true },
  { 
    id: "supp1", 
    name: "Kava Supplies", 
    role: "supplier", 
    approved: true, 
    subscriptionActive: true,
    location: { lat: -17.7333, lng: 168.3167, address: "Port Vila Wharf Road" },
    businessHours: {
      "Monday": { open: "08:00", close: "17:00", closed: false },
      "Tuesday": { open: "08:00", close: "17:00", closed: false },
      "Wednesday": { open: "08:00", close: "17:00", closed: false },
      "Thursday": { open: "08:00", close: "17:00", closed: false },
      "Friday": { open: "08:00", close: "17:00", closed: false },
      "Saturday": { open: "09:00", close: "12:00", closed: false },
      "Sunday": { open: "00:00", close: "00:00", closed: true }
    }
  },
  { 
    id: "supp2", 
    name: "Tropical Roots", 
    role: "supplier", 
    approved: true, 
    subscriptionActive: false,
    location: { lat: -15.5167, lng: 167.1833, address: "Espiritu Santo" },
    businessHours: {
      "Monday": { open: "07:30", close: "16:30", closed: false },
      "Tuesday": { open: "07:30", close: "16:30", closed: false },
      "Wednesday": { open: "07:30", close: "16:30", closed: false },
      "Thursday": { open: "07:30", close: "16:30", closed: false },
      "Friday": { open: "07:30", close: "16:30", closed: false },
      "Saturday": { open: "00:00", close: "00:00", closed: true },
      "Sunday": { open: "00:00", close: "00:00", closed: true }
    }
  },
  { 
    id: "exp1", 
    name: "Pacific Export Traders", 
    role: "exporter", 
    approved: true, 
    subscriptionActive: true,
    exporterRates: {
      greenKavaRoots: 1650,
      greenKavaChips: 1200,
      sunDriedKavaRoots: 2750,
      sunDriedKavaChips: 2200,
      instantPowder: 3800
    },
    subscription: {
      planId: "monthly",
      status: "active",
      currentPeriodEnd: 1779260400000,
      autoRenew: true
    }
  },
  {
    id: "user1",
    name: "Vanuatu Kava Lover",
    role: "user",
    approved: true,
    subscriptionActive: true
  }
];

const defaultBars: Bar[] = [
  { id: "b1", name: "Erakor Bridge Nakamal", address: "Erakor Bridge Area, Port Vila", status: "open", category: "Borogu Kava", description: "Authentic Vanuatu kava sourced directly from Pentecost island. Freshly prepared daily.", tags: ["Pentecost", "Strong", "Tradisenol"], pricePreview: 150, managerId: "mgr1", lat: -17.7423, lng: 168.3142, businessHours: {
    "Monday": { open: "15:00", close: "22:00", closed: false },
    "Tuesday": { open: "15:00", close: "22:00", closed: false },
    "Wednesday": { open: "15:00", close: "22:00", closed: false },
    "Thursday": { open: "15:00", close: "22:00", closed: false },
    "Friday": { open: "15:00", close: "23:00", closed: false },
    "Saturday": { open: "15:00", close: "23:00", closed: false },
    "Sunday": { open: "16:00", close: "21:00", closed: false }
  } },
  { id: "b2", name: "Nambatu Blue Shell", address: "Nambatu, Port Vila", status: "open", category: "Melo Melo Kava", description: "Smooth and mellow, perfect for a relaxing sunset shell with friends.", tags: ["Melo", "Ambae", "Kwel"], pricePreview: 100, managerId: "mgr2", lat: -17.7350, lng: 168.3220, businessHours: {
    "Monday": { open: "16:00", close: "22:00", closed: false },
    "Tuesday": { open: "16:00", close: "22:00", closed: false },
    "Wednesday": { open: "16:00", close: "22:00", closed: false },
    "Thursday": { open: "16:00", close: "22:00", closed: false },
    "Friday": { open: "16:00", close: "23:00", closed: false },
    "Saturday": { open: "15:00", close: "23:00", closed: false },
    "Sunday": { open: "15:00", close: "22:00", closed: false }
  } },
  { id: "b3", name: "Waterfront Fresh Shells", address: "Lini Highway, Port Vila", status: "closed", category: "Morning Fresh Kava", description: "The cleanest morning fresh squeeze in Shefa province.", tags: ["Morning Fresh", "Epi", "Squeeze"], pricePreview: 150, managerId: "mgr3", lat: -17.7490, lng: 168.3031, businessHours: {
    "Monday": { open: "11:00", close: "21:00", closed: false },
    "Tuesday": { open: "11:00", close: "21:00", closed: false },
    "Wednesday": { open: "11:00", close: "21:00", closed: false },
    "Thursday": { open: "11:00", close: "21:00", closed: false },
    "Friday": { open: "11:00", close: "22:00", closed: false },
    "Saturday": { open: "09:00", close: "22:00", closed: false },
    "Sunday": { open: "09:00", close: "20:00", closed: false }
  } },
  { id: "b4", name: "Sovereign Kava Club", address: "Teouma, Port Vila", status: "open", category: "Borogu Kava", description: "Premium, double-strained traditional kava. Reconciled federal records.", tags: ["Traditional", "Pentecost", "Premium"], pricePreview: 200, managerId: "mgr4", lat: -17.7285, lng: 168.3275, businessHours: {
    "Monday": { open: "15:00", close: "22:00", closed: false },
    "Tuesday": { open: "15:00", close: "22:00", closed: false },
    "Wednesday": { open: "15:00", close: "22:00", closed: false },
    "Thursday": { open: "15:00", close: "22:00", closed: false },
    "Friday": { open: "15:00", close: "23:00", closed: false },
    "Saturday": { open: "14:00", close: "23:00", closed: false },
    "Sunday": { open: "14:00", close: "22:00", closed: false }
  } }
];

const defaultMenus: Record<string, MenuItem[]> = {
  b1: [{ name: "Borogu Kava Shell (Smol)", price: 100 }, { name: "Borogu Kava Shell (Big)", price: 150 }],
  b2: [{ name: "Melo Melo Shell (Smol)", price: 100 }, { name: "Melo Melo Shell (Big)", price: 150 }],
  b3: [{ name: "Morning Fresh Shell (Smol)", price: 150 }, { name: "Morning Fresh Shell (Big)", price: 200 }],
  b4: [{ name: "Borogu Premium Shell", price: 200 }, { name: "Waka Extra Power Special", price: 250 }]
};

const defaultComments: Record<string, Comment[]> = {
  b1: [{ author: "KavaLover", text: "Hemia nambawan kava long Vila town! Tru kava Pentecost.", date: "2025-05-01", likes: 3 }],
  b2: [{ author: "PartyMike", text: "Nice spot for a quiet drink.", date: "2025-05-02", likes: 7 }]
};

const defaultProducts: Product[] = [
  { id: "p1", name: "Borogu Roots Bulk", price: 1500, supplierId: "supp1", barId: null },
  { id: "p2", name: "Melo Melo Chips Bulk", price: 1200, supplierId: "supp2", barId: null }
];

const defaultMessages: Message[] = [
  { id: "m1", from: "mgr1", to: "supp1", text: "Need kava powder urgently", timestamp: Date.now() - 3600000, read: false },
  { id: "m2", from: "supp1", to: "mgr1", text: "In stock, 2500 VUV per kg", timestamp: Date.now() - 1800000, read: false }
];

export const storage = {
  init: () => {
    const storedUsers = localStorage.getItem("users");
    if (!storedUsers) {
      localStorage.setItem("users", JSON.stringify(defaultUsers));
    } else {
      try {
        const parsed = JSON.parse(storedUsers);
        let changed = false;
        defaultUsers.forEach(defUser => {
          if (!parsed.some((u: any) => u.id === defUser.id)) {
            parsed.push(defUser);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem("users", JSON.stringify(parsed));
        }
      } catch (e) {
        localStorage.setItem("users", JSON.stringify(defaultUsers));
      }
    }
    let barsRaw = localStorage.getItem("bars");
    if (!barsRaw || barsRaw.includes("The Rusty Nail") || barsRaw.includes("Whiskey Bar")) {
      localStorage.setItem("bars", JSON.stringify(defaultBars));
      localStorage.setItem("menus", JSON.stringify(defaultMenus));
      localStorage.setItem("comments", JSON.stringify(defaultComments));
      localStorage.setItem("products", JSON.stringify(defaultProducts));
    } else {
      if (!localStorage.getItem("bars")) localStorage.setItem("bars", JSON.stringify(defaultBars));
      if (!localStorage.getItem("menus")) localStorage.setItem("menus", JSON.stringify(defaultMenus));
      if (!localStorage.getItem("comments")) localStorage.setItem("comments", JSON.stringify(defaultComments));
      if (!localStorage.getItem("products")) localStorage.setItem("products", JSON.stringify(defaultProducts));
    }
    if (!localStorage.getItem("messages")) localStorage.setItem("messages", JSON.stringify(defaultMessages));
    if (!localStorage.getItem("barUpdates")) localStorage.setItem("barUpdates", JSON.stringify([]));
  },
  
  getUsers: (): User[] => {
    let usersList: User[] = [];
    try {
      usersList = JSON.parse(localStorage.getItem("users") || "[]");
    } catch (e) {
      usersList = [];
    }

    // Recover or override users with role-specific local storage states
    let changed = false;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('kava_customer_profile_') ||
        key.startsWith('kava_manager_profile_') ||
        key.startsWith('kava_supplier_profile_') ||
        key.startsWith('kava_exporter_profile_')
      )) {
        try {
          const cachedUser = JSON.parse(localStorage.getItem(key) || "");
          if (cachedUser && cachedUser.id) {
            const index = usersList.findIndex(u => u.id === cachedUser.id);
            if (index !== -1) {
              // Only overwrite if it contains changes
              if (JSON.stringify(usersList[index]) !== JSON.stringify(cachedUser)) {
                usersList[index] = { ...usersList[index], ...cachedUser };
                changed = true;
              }
            } else {
              usersList.push(cachedUser);
              changed = true;
            }
          }
        } catch (err) {
          // Skip invalid JSON
        }
      }
    }

    if (changed) {
      localStorage.setItem("users", JSON.stringify(usersList));
    }
    return usersList;
  },
  getBars: (): Bar[] => JSON.parse(localStorage.getItem("bars") || "[]"),
  getMenus: (): Record<string, MenuItem[]> => JSON.parse(localStorage.getItem("menus") || "{}"),
  getComments: (): Record<string, Comment[]> => JSON.parse(localStorage.getItem("comments") || "{}"),
  getProducts: (): Product[] => JSON.parse(localStorage.getItem("products") || "[]"),
  getMessages: (): Message[] => JSON.parse(localStorage.getItem("messages") || "[]"),
  getBarUpdates: (): BarUpdate[] => JSON.parse(localStorage.getItem("barUpdates") || "[]"),

  saveUsers: (data: User[]) => {
    localStorage.setItem("users", JSON.stringify(data));
    saveToIndexedDB("users", data);

    // Store in specialized role-specific localStorage keys as requested by the user
    data.forEach(u => {
      if (!u.id) return;
      if (u.role === 'user') {
        localStorage.setItem('kava_customer_profile_' + u.id, JSON.stringify(u));
      } else if (u.role === 'manager') {
        localStorage.setItem('kava_manager_profile_' + u.id, JSON.stringify(u));
      } else if (u.role === 'supplier') {
        localStorage.setItem('kava_supplier_profile_' + u.id, JSON.stringify(u));
      } else if (u.role === 'exporter') {
        localStorage.setItem('kava_exporter_profile_' + u.id, JSON.stringify(u));
      }
    });
  },
  saveBars: (data: Bar[]) => {
    localStorage.setItem("bars", JSON.stringify(data));
    saveToIndexedDB("bars", data);
  },
  saveMenus: (data: Record<string, MenuItem[]>) => {
    localStorage.setItem("menus", JSON.stringify(data));
    saveToIndexedDB("menus", data);
  },
  saveProducts: (data: Product[]) => {
    localStorage.setItem("products", JSON.stringify(data));
    saveToIndexedDB("products", data);
  },
  saveMessages: (data: Message[]) => {
    localStorage.setItem("messages", JSON.stringify(data));
    saveToIndexedDB("messages", data);
  },
  saveBarUpdates: (data: BarUpdate[]) => {
    localStorage.setItem("barUpdates", JSON.stringify(data));
    saveToIndexedDB("barUpdates", data);
  },
};
