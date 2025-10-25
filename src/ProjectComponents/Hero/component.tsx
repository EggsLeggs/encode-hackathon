/* HeroComponent.tsx */

// NOTE: All libraries (React, DreamspaceElements, Lucide, etc.) are provided globally.
// Therefore, we do not import them here.

const HeroComponent: React.FC = () => {
  // State to control the "Learn More" modal
  const [open, setOpen] = React.useState(false);

  // Scroll smoothly to the host-event form section
  const handleGetStarted = React.useCallback(() => {
    const target = document.getElementById("host-event-form");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      {/* Glassy hero panel */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-10 text-center">
        <h1 className="prose font-custom text-xl md:text-2xl lg:text-3xl font-bold text-site-foreground">
          Host and Attend Virtual Events on Concordium.
        </h1>
        <p className="prose font-custom text-sm md:text-base text-site-foreground max-w-2xl">
          Secure ticketing, real-time rooms, and NFT attendance badges.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <DreamspaceElements.Button
            className="rounded-full shadow-lg bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 px-6 py-4"
            onClick={handleGetStarted}
          >
            {Lucide.Rocket && (
              <Lucide.Rocket size={18} className="mr-2 text-primary-foreground" />
            )}
            Get Started
          </DreamspaceElements.Button>

          {/* Learn More uses Dialog for modal */}
          <DreamspaceElements.Dialog open={open} onOpenChange={setOpen}>
            <DreamspaceElements.Button
              className="rounded-full shadow-lg bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 px-6 py-4"
              onClick={() => setOpen(true)}
            >
              {Lucide.Info && (
                <Lucide.Info size={18} className="mr-2 text-primary-foreground" />
              )}
              Learn More
            </DreamspaceElements.Button>

            <DreamspaceElements.DialogContent className="max-w-lg">
              <DreamspaceElements.DialogHeader>
                <DreamspaceElements.DialogTitle className="prose font-custom text-lg font-semibold text-foreground">
                  Why Concordium Events?
                </DreamspaceElements.DialogTitle>
                <DreamspaceElements.DialogDescription className="prose font-custom text-sm text-foreground">
                  Concordium brings blockchain-level security and identity verification to your online events. From minting NFT tickets to issuing proof-of-attendance badges, our platform ensures transparency and trust for hosts and attendees alike.
                </DreamspaceElements.DialogDescription>
              </DreamspaceElements.DialogHeader>

              <ul className="prose font-custom text-sm text-foreground list-disc pl-5 space-y-2 mt-4">
                <li className="flex items-start gap-2">
                  {Lucide.Ticket && <Lucide.Ticket size={20} className="text-foreground mt-0.5" />}Secure, on-chain ticketing with anti-fraud measures.
                </li>
                <li className="flex items-start gap-2">
                  {Lucide.Video && <Lucide.Video size={20} className="text-foreground mt-0.5" />}Real-time virtual rooms powered by scalable infrastructure.
                </li>
                <li className="flex items-start gap-2">
                  {Lucide.BadgeCheck && <Lucide.BadgeCheck size={20} className="text-foreground mt-0.5" />}NFT attendance badges that your guests can proudly showcase.
                </li>
              </ul>

              <div className="flex justify-end mt-6">
                <DreamspaceElements.Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => setOpen(false)}
                >
                  Close
                </DreamspaceElements.Button>
              </div>
            </DreamspaceElements.DialogContent>
          </DreamspaceElements.Dialog>
        </div>
      </div>
    </div>
  );
};

export { HeroComponent as component };