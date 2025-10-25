// Footer component with three informational columns and bottom legal note.
// Uses shadcn Card for optional shadow? Not needed; use div.

const FooterComponent: React.FC = () => {
  // Social links for Concordium profiles
  const socialLinks = [
    {
      name: 'Twitter',
      url: 'https://twitter.com/ConcordiumNet',
      icon: (Lucide.Twitter ? <Lucide.Twitter size={20} className="text-secondary-foreground" /> : null),
    },
    {
      name: 'GitHub',
      url: 'https://github.com/Concordium',
      icon: (Lucide.Github ? <Lucide.Github size={20} className="text-secondary-foreground" /> : null),
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/concordium',
      icon: (Lucide.Linkedin ? <Lucide.Linkedin size={20} className="text-secondary-foreground" /> : null),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between bg-secondary bg-opacity-60 backdrop-blur-md border-t border-gray-200/50 rounded-t-md p-4">
      {/* Top content: three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full prose text-secondary-foreground font-custom">
        {/* About */}
        <div className="flex flex-col gap-2">
          <h3 className="font-custom text-lg font-semibold m-0">About</h3>
          <p className="font-custom text-sm m-0">
            Concordium Event Hub is your gateway to decentralized event management on the Concordium blockchain. Host, discover, and experience events with transparent, secure transactions.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <h3 className="font-custom text-lg font-semibold m-0">Links</h3>
          <ul className="font-custom list-none p-0 m-0 flex flex-col gap-1 text-sm">
            <li><a href="/" className="hover:underline text-secondary-foreground">Home</a></li>
            <li><a href="/host" className="hover:underline text-secondary-foreground">Host Event</a></li>
            <li><a href="/my-events" className="hover:underline text-secondary-foreground">My Events</a></li>
            <li><a href="/help" className="hover:underline text-secondary-foreground">Help Center</a></li>
          </ul>
        </div>

        {/* Follow Us */}
        <div className="flex flex-col gap-2">
          <h3 className="font-custom text-lg font-semibold m-0">Follow Us</h3>
          <div className="flex gap-4 items-center">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                className="transition-opacity hover:opacity-80"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom legal note */}
      <div className="w-full flex flex-col items-center gap-2 mt-6">
        <div className="flex items-center gap-2">
          {/* Concordium logo */}
          <img
            src="https://picsum.photos/300/200?random=1"
            alt="Concordium Logo"
            className="h-5 w-auto"
          />
          <p className="font-custom text-xs text-secondary-foreground m-0">© 2024 Concordium Event Hub</p>
        </div>
      </div>
    </div>
  );
};

export { FooterComponent as component };