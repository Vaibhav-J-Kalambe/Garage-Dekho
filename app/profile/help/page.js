"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, MessageCircle, Phone } from "lucide-react";

const FAQS = [
  {
    q: "How do I book a garage service?",
    a: "Browse garages on the home page or Near Me section. Tap a garage, select a service, choose a date & time, and confirm your booking."
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. Go to My Bookings, find the booking you want to cancel (must be in 'Confirmed' status), and tap the Cancel button."
  },
  {
    q: "How does the SOS feature work?",
    a: "Tap the SOS button on the home page or the Roadside Emergency card. We'll connect you with the nearest available mechanic within minutes."
  },
  {
    q: "Are the garages verified?",
    a: "Yes! Garages with the blue checkmark are verified by our team. They meet our quality standards for pricing transparency and workmanship."
  },
  {
    q: "How do I change my appointment time?",
    a: "Currently, to reschedule, please cancel your booking and make a new one at your preferred time. Rescheduling will be available soon."
  },
  {
    q: "Is there a warranty on services?",
    a: "Yes, all services from verified garages come with a 30-day warranty on parts and labour. Contact us if you face issues."
  },
  {
    q: "How do I contact support?",
    a: "You can call our helpline at +91 99692 72885 (24/7) or email us at support@garagedekho.com. We typically respond within 2 hours."
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-800">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 mt-0.5 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="px-4 pb-4 text-sm leading-relaxed text-slate-500">{a}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">Support</p>
            <h1 className="text-sm font-black text-slate-900">Help & FAQ</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-10 space-y-4">

        {/* FAQ */}
        <div className="rounded-2xl bg-white shadow-card overflow-hidden animate-slide-up">
          <p className="px-4 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Frequently Asked Questions</p>
          {FAQS.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>

        {/* Contact */}
        <div className="rounded-2xl bg-white p-4 shadow-card animate-slide-up delay-75 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Still need help?</p>
          <a href="tel:+919969272885"
            className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 transition hover:border-primary/30 hover:bg-primary/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Call Us</p>
              <p className="text-xs text-slate-400">+91 99692 72885 · 24 / 7 support</p>
            </div>
          </a>
          <a href="mailto:support@garagedekho.com"
            className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 transition hover:border-primary/30 hover:bg-primary/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Email Support</p>
              <p className="text-xs text-slate-400">support@garagedekho.com</p>
            </div>
          </a>
        </div>

      </main>
    </div>
  );
}
