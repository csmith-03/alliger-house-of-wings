import { Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-foreground/70 text-center flex flex-col items-center gap-3">
        <div className="flex gap-6 justify-center mb-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-rooster" />
            <span>(570)-888-9801</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-rooster" />
            <span>info@houseofwings.com</span>
          </div>
        </div>
        <div>
          © {new Date().getFullYear()} Alliger&apos;s House of Wings. All rights reserved.
        </div>
      </div>
    </footer>
  );
}