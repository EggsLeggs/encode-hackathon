const MainApp: React.FC = () => {
  // ---------------------------
  // State & Helpers
  // ---------------------------
  // Ensure a default hash when the page first loads
  const getInitialHash = React.useCallback((): string => {
    const hash = window.location.hash;
    if (!hash || (hash !== "#/host" && hash !== "#/my-events")) {
      // Default view
      window.location.hash = "#/my-events";
      return "#/my-events";
    }
    return hash;
  }, []);

  // Track the current hash for client-side routing
  const [currentHash, setCurrentHash] = React.useState<string>(() => getInitialHash());

  // Update state on hash change (supports browser navigation buttons)
  React.useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(getInitialHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [getInitialHash]);

  // ---------------------------
  // Sub-components
  // ---------------------------
  // 1. Header – re-uses the routing state from the parent so the active tab highlights correctly
  const HeaderComponent: React.FC<{ activeHash: string }> = ({ activeHash }) => {
    // Wallet connection states
    type WalletState = "disconnected" | "connecting" | "connected";
    const [walletState, setWalletState] = React.useState<WalletState>("disconnected");
    const [walletAddress, setWalletAddress] = React.useState<string>("");

    // Helper: truncate address
    const truncateAddress = (addr: string) => {
      if (addr.length <= 10) return addr;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Simulated connect function – replace with real Concordium wallet adapter logic
    const handleConnect = async () => {
      if (walletState === "connected") return;
      setWalletState("connecting");
      try {
        // TODO: integrate Concordium wallet adapter here
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const dummyAddress = "3z8fjk1qv6myexampleaddr";
        setWalletAddress(dummyAddress);
        setWalletState("connected");
      } catch (err) {
        setWalletState("disconnected");
      }
    };

    const handleDisconnect = () => {
      setWalletState("disconnected");
      setWalletAddress("");
    };

    // Generate identicon color based on address
    const getIdenticonColor = React.useCallback((addr: string) => {
      let hash = 0;
      for (let i = 0; i < addr.length; i++) {
        hash = addr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const c = (hash & 0x00ffffff).toString(16).toUpperCase();
      return `#${"00000".substring(0, 6 - c.length)}${c}`;
    }, []);

    return (
      <div className="w-full h-full flex items-center bg-background text-foreground border-b border-gray-200">
        {/* Inner wrapper with generous spacing */}
        <div className="flex w-full items-center justify-between px-8 gap-6">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <a
              href="https://www.concordium.com/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&dpr=2"
                alt="Concordium Event Hub Logo"
                className="h-10 w-auto rounded-sm shadow-sm"
              />
              <span className="font-custom text-xl font-semibold hidden md:inline text-site-foreground">
                Concordium Event Hub
              </span>
            </a>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              {/* Host Event */}
              <DreamspaceElements.Button
                variant="ghost"
                size="sm"
                className={`rounded-full px-4 py-2 font-custom text-sm transition-colors ${
                  activeHash === "#/host" ? "bg-primary text-primary-foreground" : ""
                }`}
                aria-current={activeHash === "#/host" ? "page" : undefined}
                onClick={() => {
                  if (window.location.hash !== "#/host") {
                    window.location.hash = "#/host";
                  }
                }}
              >
                Host Event
              </DreamspaceElements.Button>

              {/* My Events */}
              <DreamspaceElements.Button
                variant="ghost"
                size="sm"
                className={`rounded-full px-4 py-2 font-custom text-sm transition-colors ${
                  activeHash === "#/my-events" ? "bg-primary text-primary-foreground" : ""
                }`}
                aria-current={activeHash === "#/my-events" ? "page" : undefined}
                onClick={() => {
                  if (window.location.hash !== "#/my-events") {
                    window.location.hash = "#/my-events";
                  }
                }}
              >
                My Events
              </DreamspaceElements.Button>
            </div>
          </div>

          {/* Right: Wallet Connection */}
          <div className="flex items-center gap-4">
            {walletState === "connected" ? (
              <DreamspaceElements.DropdownMenu>
                <DreamspaceElements.DropdownMenuTrigger asChild>
                  <DreamspaceElements.Button variant="secondary" className="flex items-center gap-2 px-4 py-2">
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: getIdenticonColor(walletAddress) }}
                    />
                    <span className="font-custom text-sm">{truncateAddress(walletAddress)}</span>
                  </DreamspaceElements.Button>
                </DreamspaceElements.DropdownMenuTrigger>
                <DreamspaceElements.DropdownMenuContent align="end">
                  <DreamspaceElements.DropdownMenuItem onSelect={handleDisconnect}>
                    Disconnect
                  </DreamspaceElements.DropdownMenuItem>
                </DreamspaceElements.DropdownMenuContent>
              </DreamspaceElements.DropdownMenu>
            ) : (
              <DreamspaceElements.Button
                variant="secondary"
                className="px-4 py-2 font-custom text-sm flex items-center gap-2"
                onClick={handleConnect}
                disabled={walletState === "connecting"}
              >
                {walletState === "connecting" ? (
                  <>
                    {Lucide.Loader2 && (
                      <Lucide.Loader2 size={16} className="animate-spin text-foreground" />
                    )}
                    <span>Connecting…</span>
                  </>
                ) : (
                  <span>Connect Concordium Wallet</span>
                )}
              </DreamspaceElements.Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 2. Host Event Page (placeholder for existing ActionableComponent)
  const HostEventView: React.FC = () => {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 prose">
        <h2 className="font-custom text-lg text-site-foreground flex items-center gap-2">
          {Lucide.CalendarPlus && <Lucide.CalendarPlus size={24} className="text-site-foreground" />}
          Host a New Event
        </h2>
        {/* Replace below with real ActionableComponent when available */}
        <p className="font-custom text-base text-site-foreground text-center max-w-prose">
          This is where you will configure and publish a brand-new Concordium event. Use the form below to define
          all the details such as title, date, location, ticket types, and more.
        </p>
        <DreamspaceElements.Button variant="primary" size="lg" className="flex items-center gap-2">
          {Lucide.Plus && <Lucide.Plus size={16} className="text-primary-foreground" />}
          Create Event
        </DreamspaceElements.Button>
      </div>
    );
  };

  // 3. My Events View – sample listing UI
  const MyEventsView: React.FC = () => {
    // Dummy data for demonstration
    const [events] = React.useState([
      { id: 1, title: "Blockchain Summit 2024", date: "2024-08-12" },
      { id: 2, title: "Concordium Dev Workshop", date: "2024-09-05" },
      { id: 3, title: "Web3 Hackathon", date: "2024-10-21" },
    ]);

    return (
      <div className="w-full h-full flex flex-col gap-6 p-8">
        <h2 className="font-custom text-lg text-site-foreground prose flex items-center gap-2">
          {Lucide.ListOrdered && <Lucide.ListOrdered size={24} className="text-site-foreground" />}
          My Events
        </h2>
        <DreamspaceElements.Card className="w-full">
          <div className="flex flex-col divide-y divide-gray-200">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-center justify-between p-4 gap-4">
                <div className="flex flex-col">
                  <span className="font-custom text-sm font-medium text-foreground">{evt.title}</span>
                  <span className="font-custom text-xs text-muted-foreground">{evt.date}</span>
                </div>
                <DreamspaceElements.Button size="sm" variant="secondary" className="gap-1 flex items-center">
                  {Lucide.Edit && <Lucide.Edit size={14} className="text-foreground" />}
                  Edit
                </DreamspaceElements.Button>
              </div>
            ))}
          </div>
        </DreamspaceElements.Card>
      </div>
    );
  };

  // Determine which view to render
  const renderView = () => {
    switch (currentHash) {
      case "#/host":
        return <HostEventView />;
      case "#/my-events":
      default:
        return <MyEventsView />;
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="h-16 min-h-[4rem]">
        <HeaderComponent activeHash={currentHash} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>
    </div>
  );
};

export { MainApp as component };