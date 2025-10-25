/* MainAppComponent.tsx */
/* This component renders two primary cards ("Host Event" and "My Events") with a tab-like interaction. 
   It demonstrates a small event management workflow with a waiting-room modal, countdown until start,
   attendance tracking, and NFT minting action once the event ends. All typography uses an 11px font size
   and adheres strictly to Tailwind & shadcn conventions as required. */

// NOTE: React is available globally via the window object – no explicit import required

const { useState, useEffect, useCallback } = React;

/* ---------------------------------- Types --------------------------------- */
interface EventInfo {
  id: string;
  name: string;
  date: Date; // start date/time
  host: string;
  status: 'Upcoming' | 'In Progress' | 'Ended';
}

interface AttendanceEntry {
  address: string;
  joinedAt: string;
  leftAt: string;
}

/* ------------------------------ Mocked Data ------------------------------- */
const mockEvents: EventInfo[] = [
  {
    id: 'evt1',
    name: 'Solidity Basics Webinar',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24), // +1 day
    host: '0xAbC...1234',
    status: 'Upcoming',
  },
  {
    id: 'evt2',
    name: 'DeFi Yield Strategies',
    date: new Date(Date.now() + 1000 * 60 * 45), // +45min
    host: '0xDef...5678',
    status: 'Upcoming',
  },
  {
    id: 'evt3',
    name: 'Ethereum Governance AMA',
    date: new Date(Date.now() - 1000 * 60 * 20), // -20min (in progress)
    host: '0xBEEF...A11',
    status: 'In Progress',
  },
  {
    id: 'evt4',
    name: 'NFT Showcase',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // ended 2h ago
    host: '0xFAcE...B00',
    status: 'Ended',
  },
  {
    id: 'evt5',
    name: 'Layer 2 Rollups Deep-Dive',
    date: new Date(Date.now() + 1000 * 60 * 120), // +2h
    host: '0xCafe...C00',
    status: 'Upcoming',
  },
];

/* --------------------------- Helper Components ---------------------------- */
const DividerIcon: React.FC = () => {
  return (
    <>
      {Lucide.SeparatorHorizontal && (
        <Lucide.SeparatorHorizontal size={16} className="text-foreground" />
      )}
    </>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="font-custom text-[11px] font-semibold text-foreground flex items-center gap-2">
    {title}
    <DividerIcon />
  </h3>
);

/* --------------------------- WaitingRoomModal ----------------------------- */
interface WaitingRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventInfo | null;
}

const WaitingRoomModal: React.FC<WaitingRoomModalProps> = ({ open, onOpenChange, event }) => {
  const [now, setNow] = useState(Date.now());
  const [muted, setMuted] = useState(false);
  const [attendees] = useState<string[]>([
    '0xAbC...111',
    '0xDeF...222',
    '0xGhI...333',
    '0xJkL...444',
  ]);

  /* Update now every second for countdown */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = event ? event.date.getTime() - now : 0;
  const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(remainingSecs / 60);
  const seconds = remainingSecs % 60;

  /* Attendance mock data – would be dynamic in production */
  const attendanceRows: AttendanceEntry[] = attendees.map((addr) => ({
    address: addr,
    joinedAt: new Date(Date.now() - 1000 * 60 * (Math.random() * 30 + 1)).toLocaleTimeString(),
    leftAt: '-',
  }));

  const isEnded = event?.status === 'Ended';

  return (
    <DreamspaceElements.Dialog open={open} onOpenChange={onOpenChange}>
      <DreamspaceElements.DialogContent className="w-full max-w-xl bg-background text-foreground shadow-lg rounded-lg">
        {event && (
          <div className="flex flex-col gap-4 p-6">
            <SectionTitle title={`Waiting Room · ${event.name}`} />
            {/* Countdown */}
            <div className="prose font-custom text-[11px] text-foreground flex items-center gap-2">
              {Lucide.Timer && <Lucide.Timer size={14} className="text-foreground" />}
              <span>Starts in:</span>
              <span className="font-semibold">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>

            {/* Avatars */}
            <div className="flex -space-x-2">
              {attendees.map((addr) => (
                <DreamspaceElements.Avatar key={addr} className="border border-background shadow-sm">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] text-secondary-foreground">
                    {addr.slice(2, 4)}
                  </span>
                </DreamspaceElements.Avatar>
              ))}
            </div>

            {/* Mic Toggle */}
            <DreamspaceElements.Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 text-[11px]"
              onClick={() => setMuted((m) => !m)}
            >
              {muted ? (
                Lucide.MicOff && <Lucide.MicOff size={14} className="text-foreground" />
              ) : (
                Lucide.Mic && <Lucide.Mic size={14} className="text-foreground" />
              )}
              {muted ? 'Unmute' : 'Mute'}
            </DreamspaceElements.Button>

            {/* Attendance Tracker */}
            <SectionTitle title="Attendance Tracker" />
            <div className="w-full overflow-auto border rounded-md">
              <table className="w-full text-[11px] font-custom">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="px-2 py-1 text-left">Address</th>
                    <th className="px-2 py-1 text-left">Joined</th>
                    <th className="px-2 py-1 text-left">Left</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.map((row) => (
                    <tr key={row.address} className="border-b last:border-none">
                      <td className="px-2 py-1 flex items-center gap-1">
                        {Lucide.User && <Lucide.User size={12} className="text-foreground" />}
                        {row.address}
                      </td>
                      <td className="px-2 py-1">{row.joinedAt}</td>
                      <td className="px-2 py-1">{row.leftAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mint NFT after event end */}
            {isEnded && (
              <DreamspaceElements.Button variant="accent" className="text-[11px]">
                {Lucide.BadgeCheck && <Lucide.BadgeCheck size={14} className="mr-1" />}
                Mint NFT Badge
              </DreamspaceElements.Button>
            )}
          </div>
        )}
      </DreamspaceElements.DialogContent>
    </DreamspaceElements.Dialog>
  );
};

/* ------------------------------ Event Card -------------------------------- */
interface EventCardProps {
  event: EventInfo;
  onJoin: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onJoin }) => {
  return (
    <DreamspaceElements.Card className="bg-background text-foreground shadow-md rounded-lg border border-gray-200">
      <div className="flex flex-col gap-2 p-4 text-[11px] font-custom">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{event.name}</span>
          <DreamspaceElements.Badge variant={event.status === 'Upcoming' ? 'secondary' : event.status === 'In Progress' ? 'accent' : 'destructive'} className="text-[10px] capitalize">
            {event.status}
          </DreamspaceElements.Badge>
        </div>
        <div className="flex items-center gap-2">
          {Lucide.Calendar && <Lucide.Calendar size={12} className="text-foreground" />}
          <span>{event.date.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          {Lucide.User && <Lucide.User size={12} className="text-foreground" />}
          <span>{event.host}</span>
        </div>
        <DreamspaceElements.Separator className="my-2" />
        <DreamspaceElements.Button variant="primary" size="sm" className="text-[11px]" onClick={onJoin}>
          {Lucide.DoorOpen && <Lucide.DoorOpen size={14} className="mr-1" />}
          Join Room
        </DreamspaceElements.Button>
      </div>
    </DreamspaceElements.Card>
  );
};

/* ----------------------------- Main Component ----------------------------- */
const MainAppComponent: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'host' | 'myEvents'>('host');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);

  const handleJoin = useCallback((evt: EventInfo) => {
    setSelectedEvent(evt);
    setModalOpen(true);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6">
      {/* Tabs */}
      <DreamspaceElements.ToggleGroup type="single" value={selectedTab} onValueChange={(val) => setSelectedTab(val as 'host' | 'myEvents')} className="self-start">
        <DreamspaceElements.ToggleGroupItem value="host" className="text-[11px]">Host Event</DreamspaceElements.ToggleGroupItem>
        <DreamspaceElements.ToggleGroupItem value="myEvents" className="text-[11px]">My Events</DreamspaceElements.ToggleGroupItem>
      </DreamspaceElements.ToggleGroup>

      {/* Card Containers */}
      <div className="flex-1 grid grid-cols-2 gap-6">
        {/* Host Event Card */}
        <DreamspaceElements.Card className="bg-background text-foreground shadow-md rounded-lg border border-gray-200">
          <div className="p-6 h-full flex items-center justify-center">
            {selectedTab === 'host' ? (
              <p className="font-custom text-[11px] prose text-foreground">{/* Blank Actionable Component */}Setup your event details here…</p>
            ) : (
              <p className="font-custom text-[11px] text-foreground">Select "Host Event" to create a new event.</p>
            )}
          </div>
        </DreamspaceElements.Card>

        {/* My Events Card */}
        <DreamspaceElements.Card className="bg-background text-foreground shadow-md rounded-lg border border-gray-200 overflow-auto">
          <div className="flex flex-col gap-4 p-6">
            {selectedTab === 'myEvents' ? (
              mockEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} onJoin={() => handleJoin(evt)} />
              ))
            ) : (
              <p className="font-custom text-[11px] text-foreground">Switch to "My Events" to see your scheduled events.</p>
            )}
          </div>
        </DreamspaceElements.Card>
      </div>

      {/* Modal */}
      <WaitingRoomModal open={modalOpen} onOpenChange={setModalOpen} event={selectedEvent} />
    </div>
  );
};

export { MainAppComponent as component };