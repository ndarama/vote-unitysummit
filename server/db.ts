import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DATA_FILE = path.join(process.cwd(), 'data.json');

export interface Category {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageFocalPoint?: string;
}

export interface Nominee {
  id: string;
  categoryId: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  imageFocalPoint?: string;
  withdrawn?: boolean;
  withdrawalNote?: string;
}

export interface Vote {
  email: string;
  categoryId: string;
  nomineeId: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  anomalyScore?: number;
  flagged?: boolean;
  invalid?: boolean;
  invalidationReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'spike' | 'duplicate_ip' | 'bot_pattern' | 'manual_action' | 'system';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata?: any;
}

export interface SystemConfig {
  pollLocked: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'manager';
}

export interface Voter {
  id: string;
  email: string;
  name: string;
  invitedAt: number;
}

interface OTP {
  code: string;
  expires: number;
}

interface DBData {
  categories: Category[];
  nominees: Nominee[];
  votes: Vote[];
  users: User[];
  voters: Voter[];
  otps: Record<string, OTP>;
  auditLogs: AuditLogEntry[];
  systemConfig: SystemConfig;
}

const initialData: DBData = {
  categories: [
    {
      id: '1',
      title: 'Brobyggerprisen 2026',
      description:
        'Til en leder som gjennom tydelig, inkluderende mangfoldsledelse har skapt endring og rom for forskjellighet.',
      imageUrl:
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: '2',
      title: 'Inkluderingsprisen 2026',
      description:
        'Til en virksomhet som har vist ekstraordinær innsats i å skape en inkluderende arbeidskultur der ulikhet er en styrke.',
      imageUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: '3',
      title: 'Fremtidens stemme 2026',
      description:
        'Til en person under 30 år som gjennom media, kunst, samfunnsengasjement eller entreprenørskap har påvirket til mer inkludering, mangfold og forståelse.',
      imageUrl:
        'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: '4',
      title: 'Kommunikasjonskraft 2026',
      description:
        'Til en aktør som gjennom kommunikasjon i det offentlige rom - digitalt, i media eller på scenen - har bidratt til å bygge broer, utfordre holdninger eller løfte underrepresenterte perspektiver.',
      imageUrl:
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: '5',
      title: 'Gjennomslagskraft 2026',
      description:
        'Til en gründer eller innovatør som har brukt mangfold, en idé, bedrift eller plattform til å drive frem mer mangfold, inkludering eller annen endring som inspirerer.',
      imageUrl:
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop',
    },
  ],
  nominees: [
    // Category 1: Brobyggerprisen
    {
      id: '101',
      categoryId: '1',
      name: 'Kari Nordmann',
      title: 'CEO, Bedrift AS',
      description: 'Har transformert ledergruppen til å speile samfunnet.',
      imageUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '102',
      categoryId: '1',
      name: 'Ola Hansen',
      title: 'Avdelingsleder, Kommune',
      description: 'Kjent for sin inkluderende lederstil og fokus på mangfold.',
      imageUrl:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '103',
      categoryId: '1',
      name: 'Fatima Ahmed',
      title: 'Leder, Frivilligsentralen',
      description: 'Har bygget broer mellom generasjoner og kulturer i bydelen.',
      imageUrl:
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '104',
      categoryId: '1',
      name: 'Espen Lie',
      title: 'Rektor',
      description: 'Har skapt en skolekultur hvor alle elever føler seg sett og inkludert.',
      imageUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    },

    // Category 2: Inkluderingsprisen
    {
      id: '201',
      categoryId: '2',
      name: 'Teknologi Huset',
      title: 'IT-selskap',
      description: 'Har egne programmer for rekruttering av nevromangfold.',
      imageUrl:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '202',
      categoryId: '2',
      name: 'Bygg & Bo',
      title: 'Entreprenør',
      description: 'Aktiv rekruttering fra utenforskap og tett oppfølging.',
      imageUrl:
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '203',
      categoryId: '2',
      name: 'Mat & Prat',
      title: 'Sosial Entreprenør',
      description: 'Tilbyr arbeidstrening og språkopplæring for flyktninger.',
      imageUrl:
        'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '204',
      categoryId: '2',
      name: 'Senior Ressurs',
      title: 'Bemanning',
      description: 'Spesialiserer seg på å verdsette og bruke seniorers kompetanse.',
      imageUrl:
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=400&auto=format&fit=crop',
    },

    // Category 3: Fremtidens stemme
    {
      id: '301',
      categoryId: '3',
      name: 'Aisha Ali',
      title: 'Samfunnsdebattant',
      description: 'En tydelig stemme for unge minoritetskvinner i media.',
      imageUrl:
        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '302',
      categoryId: '3',
      name: 'Jonas Berg',
      title: 'Studentleder',
      description: 'Jobber utrettelig for universell utforming på campus.',
      imageUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '303',
      categoryId: '3',
      name: 'Sara Iversen',
      title: 'Klimaaktivist',
      description: 'Kobler klimakamp med sosial rettferdighet på en ny måte.',
      imageUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '304',
      categoryId: '3',
      name: 'Ali Esmati',
      title: 'Gründer',
      description: 'Utvikler teknologi som gjør utdanning tilgjengelig for alle.',
      imageUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    },

    // Category 4: Kommunikasjonskraft
    {
      id: '401',
      categoryId: '4',
      name: 'Podkasten "Uten Filter"',
      title: 'Mediehus',
      description: 'Løfter tabubelagte temaer og gir stemme til de som sjelden høres.',
      imageUrl:
        'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '402',
      categoryId: '4',
      name: 'Teater Mangfold',
      title: 'Kulturinstitusjon',
      description: 'Setter opp stykker som utfordrer fordommer og skaper debatt.',
      imageUrl:
        'https://images.unsplash.com/photo-1503095392237-fc985790791e?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '403',
      categoryId: '4',
      name: 'Avisen Innsikt',
      title: 'Lokalavis',
      description: 'Har satset stort på flerkulturell dialog og journalistikk.',
      imageUrl:
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '404',
      categoryId: '4',
      name: 'Kampanjen "Vi er her"',
      title: 'SoMe-aksjon',
      description: 'En viral kampanje som synliggjorde usynlige sykdommer.',
      imageUrl:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop',
    },

    // Category 5: Gjennomslagskraft
    {
      id: '501',
      categoryId: '5',
      name: 'StartUp X',
      title: 'Innovasjonshub',
      description: 'Hjelper innvandrere å starte egen bedrift med stor suksess.',
      imageUrl:
        'https://images.unsplash.com/photo-1559136555-930d72f1d300?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '502',
      categoryId: '5',
      name: 'Green & Inclusive',
      title: 'Bærekraft',
      description: 'Kombinerer grønt skifte med sosial bærekraft i praksis.',
      imageUrl:
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '503',
      categoryId: '5',
      name: 'Tech for Good',
      title: 'App-utvikler',
      description: 'Har laget en app som revolusjonerer hverdagen for synshemmede.',
      imageUrl:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: '504',
      categoryId: '5',
      name: 'Bærekraftsløftet',
      title: 'Bransjeinitiativ',
      description: 'Har endret standarden for hvordan bransjen jobber med mangfold.',
      imageUrl:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop',
    },
  ],
  votes: [],
  users: [
    { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
    { id: '2', username: 'manager', password: 'manager123', role: 'manager' },
    { id: '3', username: 'devstack@mountaincre8.com', password: 'DemoUser##123', role: 'admin' },
  ],
  voters: [],
  otps: {},
  auditLogs: [],
  systemConfig: { pollLocked: false },
};

class DB {
  private data: DBData;

  constructor() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        this.data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        // Ensure structure
        if (!this.data.categories) this.data.categories = initialData.categories;
        if (!this.data.nominees) this.data.nominees = initialData.nominees;
        if (!this.data.votes) this.data.votes = [];
        if (!this.data.users) this.data.users = initialData.users;
        if (!this.data.voters) this.data.voters = [];
        if (!this.data.otps) this.data.otps = {};
        if (!this.data.auditLogs) this.data.auditLogs = [];
        if (!this.data.systemConfig) this.data.systemConfig = { pollLocked: false };
        // Migrate plaintext passwords to bcrypt hashes
        let migrated = false;
        this.data.users = this.data.users.map((u) => {
          if (!u.password.startsWith('$2b$') && !u.password.startsWith('$2a$')) {
            migrated = true;
            return { ...u, password: bcrypt.hashSync(u.password, 10) };
          }
          return u;
        });
        if (migrated) this.save();
      } catch (e) {
        console.error('Error reading data file, resetting DB', e);
        this.data = initialData;
        this.save();
      }
    } else {
      this.data = {
        ...initialData,
        users: initialData.users.map((u) => ({
          ...u,
          password: bcrypt.hashSync(u.password, 10),
        })),
      };
      this.save();
    }
  }

  private save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  getCategories() {
    return this.data.categories;
  }

  getCategory(id: string) {
    return this.data.categories.find((c) => c.id === id) ?? null;
  }

  getNominees(categoryId?: string) {
    if (categoryId) {
      return this.data.nominees.filter((n) => n.categoryId === categoryId);
    }
    return this.data.nominees;
  }

  logAudit(
    type: AuditLogEntry['type'],
    severity: AuditLogEntry['severity'],
    message: string,
    metadata?: any
  ) {
    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      type,
      severity,
      message,
      metadata,
    };
    this.data.auditLogs.push(entry);
    this.save();
  }

  addVote(email: string, categoryId: string, nomineeId: string, ip?: string, userAgent?: string) {
    if (this.data.systemConfig.pollLocked) {
      throw new Error('Avstemningen er stengt.');
    }

    // Check if already voted
    const existing = this.data.votes.find(
      (v) => v.email === email && v.categoryId === categoryId && !v.invalid
    );
    if (existing) {
      throw new Error('Du har allerede stemt i denne kategorien.');
    }

    let anomalyScore = 0;
    let flagged = false;

    // Fraud Detection Logic
    if (ip) {
      // 1. Multiple votes from same IP
      const votesFromIp = this.data.votes.filter((v) => v.ip === ip && !v.invalid);
      if (votesFromIp.length >= 5) {
        anomalyScore += 50;
        this.logAudit('duplicate_ip', 'medium', `High volume of votes from IP ${ip}`, {
          ip,
          count: votesFromIp.length,
        });
      }

      // 2. Rapid voting (bot detection)
      const recentVoteFromIp = votesFromIp.sort((a, b) => b.timestamp - a.timestamp)[0];
      if (recentVoteFromIp && Date.now() - recentVoteFromIp.timestamp < 2000) {
        // < 2 seconds
        anomalyScore += 80;
        flagged = true;
        this.logAudit('bot_pattern', 'high', `Rapid voting detected from IP ${ip}`, {
          ip,
          timeDiff: Date.now() - recentVoteFromIp.timestamp,
        });
      }
    }

    // 3. Spike Detection (Global)
    const recentVotesForNominee = this.data.votes.filter(
      (v) => v.nomineeId === nomineeId && !v.invalid && Date.now() - v.timestamp < 60000 // Last minute
    );

    if (recentVotesForNominee.length > 20) {
      this.logAudit('spike', 'medium', `Vote spike detected for nominee ${nomineeId}`, {
        nomineeId,
        count: recentVotesForNominee.length,
      });
    }

    if (anomalyScore > 100) flagged = true;

    this.data.votes.push({
      email,
      categoryId,
      nomineeId,
      timestamp: Date.now(),
      ip,
      userAgent,
      anomalyScore,
      flagged,
    });
    this.save();
  }

  hasVoted(email: string, categoryId: string) {
    return !!this.data.votes.find((v) => v.email === email && v.categoryId === categoryId);
  }

  getUserVotes(email: string) {
    return this.data.votes.filter((v) => v.email === email);
  }

  createOTP(email: string) {
    const lastOtp = this.data.otps[email];
    // Rate limit: only allow one OTP request per 60 seconds
    if (lastOtp && Date.now() < lastOtp.expires - 14 * 60 * 1000) {
      throw new Error('Vent 60 sekunder før du ber om en ny kode.');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.data.otps[email] = {
      code,
      expires: Date.now() + 15 * 60 * 1000,
    };
    this.save();
    return code;
  }

  verifyOTP(email: string, code: string) {
    const otp = this.data.otps[email];
    if (!otp) return false;
    if (Date.now() > otp.expires) return false;
    if (otp.code !== code) return false;

    // Clear OTP after use
    delete this.data.otps[email];
    this.save();
    return true;
  }

  // Admin methods
  getStats() {
    const stats: Record<string, number> = {};
    this.data.votes.forEach((v) => {
      stats[v.nomineeId] = (stats[v.nomineeId] || 0) + 1;
    });
    return stats;
  }

  getAuditLogs() {
    return this.data.auditLogs.sort((a, b) => b.timestamp - a.timestamp);
  }

  getSystemConfig() {
    return this.data.systemConfig;
  }

  togglePollLock(locked: boolean) {
    this.data.systemConfig.pollLocked = locked;
    this.logAudit('system', 'high', `Poll ${locked ? 'locked' : 'unlocked'} by admin`);
    this.save();
    return this.data.systemConfig;
  }

  invalidateVote(email: string, categoryId: string, reason: string) {
    const vote = this.data.votes.find((v) => v.email === email && v.categoryId === categoryId);
    if (vote) {
      vote.invalid = true;
      vote.invalidationReason = reason;
      this.logAudit('manual_action', 'high', `Vote invalidated for ${email}`, {
        email,
        categoryId,
        reason,
      });
      this.save();
      return true;
    }
    return false;
  }

  getVotes() {
    return this.data.votes;
  }

  // User Management
  verifyLogin(username: string, password: string): User | null {
    const user = this.data.users.find((u) => u.username === username);
    if (!user) return null;
    if (bcrypt.compareSync(password, user.password)) return user;
    return null;
  }

  getUsers() {
    return this.data.users;
  }

  addUser(user: Omit<User, 'id'>) {
    const newUser = { ...user, password: bcrypt.hashSync(user.password, 10), id: uuidv4() };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>) {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      if (updates.password) {
        updates = { ...updates, password: bcrypt.hashSync(updates.password, 10) };
      }
      this.data.users[index] = { ...this.data.users[index], ...updates };
      this.save();
      return this.data.users[index];
    }
    return null;
  }

  deleteUser(id: string) {
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.save();
  }

  // Voter Management
  getVoters() {
    return this.data.voters;
  }

  addVoter(voter: Omit<Voter, 'id' | 'invitedAt'>) {
    // Check if exists
    if (this.data.voters.find((v) => v.email === voter.email)) {
      throw new Error('Voter already invited');
    }
    const newVoter = { ...voter, id: uuidv4(), invitedAt: Date.now() };
    this.data.voters.push(newVoter);
    this.save();
    return newVoter;
  }

  deleteVoter(id: string) {
    this.data.voters = this.data.voters.filter((v) => v.id !== id);
    this.save();
  }

  // Category Management
  addCategory(category: Omit<Category, 'id'>) {
    const newCategory = { ...category, id: uuidv4() };
    this.data.categories.push(newCategory);
    this.save();
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>) {
    const index = this.data.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.data.categories[index] = { ...this.data.categories[index], ...updates };
      this.save();
      return this.data.categories[index];
    }
    return null;
  }

  deleteCategory(id: string) {
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    // Also delete nominees in this category? Maybe.
    this.data.nominees = this.data.nominees.filter((n) => n.categoryId !== id);
    this.save();
  }

  // Nominee Management
  addNominee(nominee: Omit<Nominee, 'id'>) {
    const newNominee = { ...nominee, id: uuidv4() };
    this.data.nominees.push(newNominee);
    this.save();
    return newNominee;
  }

  updateNominee(id: string, updates: Partial<Nominee>) {
    const index = this.data.nominees.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.data.nominees[index] = { ...this.data.nominees[index], ...updates };
      this.save();
      return this.data.nominees[index];
    }
    return null;
  }

  deleteNominee(id: string) {
    this.data.nominees = this.data.nominees.filter((n) => n.id !== id);
    this.save();
  }

  withdrawNominee(id: string, note: string) {
    const index = this.data.nominees.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.data.nominees[index] = {
        ...this.data.nominees[index],
        withdrawn: true,
        withdrawalNote: note,
      };
      this.logAudit('manual_action', 'medium', `Nominee ${this.data.nominees[index].name} withdrawn`, { id, note });
      this.save();
      return this.data.nominees[index];
    }
    return null;
  }

  restoreNominee(id: string) {
    const index = this.data.nominees.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.data.nominees[index] = {
        ...this.data.nominees[index],
        withdrawn: false,
        withdrawalNote: undefined,
      };
      this.logAudit('manual_action', 'medium', `Nominee ${this.data.nominees[index].name} restored`, { id });
      this.save();
      return this.data.nominees[index];
    }
    return null;
  }

  getRecentVotes(limit: number = 50) {
    return [...this.data.votes].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
}

export const db = new DB();
