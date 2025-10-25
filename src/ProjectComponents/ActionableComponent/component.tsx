const ActionableComponentComponent: React.FC = () => {
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDate, setEventDate] = React.useState<Date | undefined>();
  const [eventTime, setEventTime] = React.useState<string>('');
  const [ticketCount, setTicketCount] = React.useState<number>(1);
  const [wallets, setWallets] = React.useState<string[]>([
    '0x57bA...9c45',
    '0xa12E...B4f1',
  ]);
  const [selectedWallet, setSelectedWallet] = React.useState<string>('');
  const [openAddWallet, setOpenAddWallet] = React.useState(false);
  const [newWalletAddress, setNewWalletAddress] = React.useState('');
  const [ticketSalesEnabled, setTicketSalesEnabled] = React.useState(false);
  const [ticketPrice, setTicketPrice] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = React.useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!eventTitle.trim()) newErrors.title = 'Event title is required';
    if (!eventDate) newErrors.date = 'Event date is required';
    if (!eventTime.trim()) newErrors.time = 'Event time is required';
    if (ticketCount < 1) newErrors.count = 'Ticket count must be at least 1';
    if (!selectedWallet) newErrors.wallet = 'Distribution wallet is required';
    if (ticketSalesEnabled) {
      if (!ticketPrice || isNaN(Number(ticketPrice)) || Number(ticketPrice) <= 0) {
        newErrors.price = 'Valid ticket price required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [eventTitle, eventDate, eventTime, ticketCount, selectedWallet, ticketSalesEnabled, ticketPrice]);

  const handleCreateEvent = () => {
    if (!validate()) return;
    setIsSubmitting(true);
    // Fake submit timeout
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Event created successfully!');
    }, 1200);
  };

  const addWallet = () => {
    if (!newWalletAddress.trim()) return;
    setWallets(prev => [...prev, newWalletAddress.trim()]);
    setSelectedWallet(newWalletAddress.trim());
    setNewWalletAddress('');
    setOpenAddWallet(false);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full bg-background/60 border border-gray-300 rounded-md shadow-sm p-6 flex flex-col gap-6 max-w-xl mx-auto overflow-auto">
        <h1 className="text-xl font-semibold font-custom text-site-foreground flex items-center gap-2">
          {Lucide.Calendar && <Lucide.Calendar size={20} className="text-site-foreground" />}
          Host New Event
        </h1>

        {/* Event Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="event-title" className="flex items-center gap-2 text-sm font-custom text-site-foreground">
            {Lucide.Hash && <Lucide.Hash size={16} className="text-site-foreground" />}
            Event Title
          </label>
          <DreamspaceElements.Input
            id="event-title"
            aria-label="Event Title"
            placeholder="Enter event name"
            value={eventTitle}
            onChange={e => setEventTitle(e.target.value)}
          />
          {errors.title && <p className="text-xs text-destructive-foreground font-custom">{errors.title}</p>}
        </div>

        {/* Date & Time */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Date */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-custom text-site-foreground">
              {Lucide.Calendar && <Lucide.Calendar size={16} className="text-site-foreground" />}
              Date
            </label>
            <DreamspaceElements.DatePicker
              mode="single"
              selected={eventDate}
              onSelect={setEventDate}
              aria-label="Event Date"
            />
            {errors.date && <p className="text-xs text-destructive-foreground font-custom">{errors.date}</p>}
          </div>

          {/* Time */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-custom text-site-foreground">
              {Lucide.Clock && <Lucide.Clock size={16} className="text-site-foreground" />}
              Time
            </label>
            <DreamspaceElements.Input
              type="time"
              aria-label="Event Time"
              value={eventTime}
              onChange={e => setEventTime(e.target.value)}
            />
            {errors.time && <p className="text-xs text-destructive-foreground font-custom">{errors.time}</p>}
          </div>
        </div>

        {/* Ticket Count */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-custom text-site-foreground">
            {Lucide.Users && <Lucide.Users size={16} className="text-site-foreground" />}
            Ticket Count
          </label>
          <DreamspaceElements.Input
            type="number"
            min={1}
            aria-label="Ticket Count"
            value={ticketCount}
            onChange={e => setTicketCount(Number(e.target.value))}
          />
          {errors.count && <p className="text-xs text-destructive-foreground font-custom">{errors.count}</p>}
        </div>

        {/* Distribution Wallet */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-custom text-site-foreground">
            {Lucide.Wallet && <Lucide.Wallet size={16} className="text-site-foreground" />}
            Distribution Wallet
          </label>
          <DreamspaceElements.Select value={selectedWallet} onValueChange={setSelectedWallet}>
            <DreamspaceElements.SelectTrigger aria-label="Distribution Wallet" />
            <DreamspaceElements.SelectContent>
              {wallets.map(w => (
                <DreamspaceElements.SelectItem key={w} value={w}>
                  {w}
                </DreamspaceElements.SelectItem>
              ))}
              <DreamspaceElements.SelectItem value="add-wallet" onSelect={() => setOpenAddWallet(true)}>
                + Add Wallet
              </DreamspaceElements.SelectItem>
            </DreamspaceElements.SelectContent>
          </DreamspaceElements.Select>
          {errors.wallet && <p className="text-xs text-destructive-foreground font-custom">{errors.wallet}</p>}
        </div>

        {/* Ticket Sales Toggle */}
        <div className="flex items-center gap-4">
          <DreamspaceElements.Checkbox
            id="ticket-sales"
            checked={ticketSalesEnabled}
            onCheckedChange={val => setTicketSalesEnabled(Boolean(val))}
            aria-label="Enable Ticket Sales"
          />
          <label htmlFor="ticket-sales" className="font-custom text-sm text-site-foreground flex items-center gap-2">
            {Lucide.Ticket && <Lucide.Ticket size={16} className="text-site-foreground" />}
            Enable Ticket Sales
          </label>
        </div>

        {ticketSalesEnabled && (
          <div className="flex flex-col md:flex-row gap-4 border-t border-gray-300 pt-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-custom text-site-foreground">Ticket Price (GCD)</label>
              <DreamspaceElements.Input
                type="number"
                min={0}
                step="0.01"
                aria-label="Ticket Price"
                value={ticketPrice}
                onChange={e => setTicketPrice(e.target.value)}
              />
              {errors.price && <p className="text-xs text-destructive-foreground font-custom">{errors.price}</p>}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-custom text-sm text-site-foreground">Sale Status</span>
              <DreamspaceElements.Switch aria-label="Sale Status" />
            </div>
          </div>
        )}

        {/* Create Button */}
        <DreamspaceElements.Button onClick={handleCreateEvent} disabled={isSubmitting} className="self-end flex items-center gap-2">
          {Lucide.Ticket && <Lucide.Ticket size={18} className="text-primary-foreground" />}
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </DreamspaceElements.Button>
      </div>

      {/* Add Wallet Dialog */}
      <DreamspaceElements.Dialog open={openAddWallet} onOpenChange={setOpenAddWallet}>
        <DreamspaceElements.DialogContent className="bg-background p-6 rounded-md border border-gray-300 shadow-md">
          <DreamspaceElements.DialogHeader>
            <DreamspaceElements.DialogTitle className="font-custom text-lg text-site-foreground flex items-center gap-2">
              {Lucide.Wallet && <Lucide.Wallet size={20} className="text-site-foreground" />}
              Add Wallet Address
            </DreamspaceElements.DialogTitle>
          </DreamspaceElements.DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <DreamspaceElements.Input
              placeholder="0x..."
              aria-label="New Wallet Address"
              value={newWalletAddress}
              onChange={e => setNewWalletAddress(e.target.value)}
            />
            <DreamspaceElements.Button onClick={addWallet} disabled={!newWalletAddress.trim()}>
              Add Wallet
            </DreamspaceElements.Button>
          </div>
        </DreamspaceElements.DialogContent>
      </DreamspaceElements.Dialog>
    </div>
  );
};

export { ActionableComponentComponent as component };