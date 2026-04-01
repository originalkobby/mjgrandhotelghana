import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Clock, UtensilsCrossed, Key, Car, Waves, CircleX, Ban, MessageSquare, Lock, Search, Users, Banknote, Dumbbell } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const sections = [
  {
    icon: Clock,
    title: "Check-In & Check-Out",
    items: [
      "Check-out time is 12 noon, while check-in time is 2 pm. Guests who do not consult the reception and still have luggage in the room after this time will be charged an additional night's stay.",
      "No further discount shall be given to you during your check-out. Any discount given is at the discretion of the Management before arrival and check-in.",
      "Please make sure that your room is acceptable before check-in, ensuring all facilities in your room are functional. If there are any problems, please notify reception immediately. Any facility damaged by a guest during their stay will incur payment. Hotel properties must not be taken away from hotel premises.",
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    items: [
      "Guests who transact private business with our staff do so at their own risk. Guests are advised not to give out their details (including telephone numbers) to staff except at the Front Office.",
      "For business, investment, or any other enquiries about the Hotel, speak to Management.",
      "The hotel has 24-hour security guards on the premises. Feel free to move around any time you wish. Please lock any valuables in the safe provided in your room. The hotel is not liable for any valuable items lost in and around the hotel area.",
      "For any other safekeeping, kindly talk to Management.",
      "The perimeter fence of the facility is equipped with an alarm system; we got you covered.",
    ],
  },
  {
    icon: Waves,
    title: "Swimming",
    items: [
      "The hotel has a pool guard/lifeguard by the pool to assist you in case you encounter any problems. Read carefully the pool safety notice to avoid any event of drowning (Keep away from the pool if you do not know how to swim).",
      "No swimming after 6 pm, unless authorized by Management.",
    ],
  },
  {
    icon: CircleX,
    title: "Cancellation & Amendments",
    items: [
      "Cancellations or amendments to your reservation must be made at least 72 hours before your arrival date. Refunds will incur a 30% charge, inclusive of any applicable prevailing government taxes.",
      "In the event of a no-show, a 100% charge (inclusive of any applicable prevailing government taxes) will be applied to the account provided at the time of reservation.",
    ],
  },
  {
    icon: Lock,
    title: "In-Room Safes",
    items: [
      "Each guest room is equipped with a secure in-room safe for storing luggage and valuables during their stay.",
      "Guests are kindly advised to declare valuables during physical check-in at the Front Office for proper documentation and security purposes.",
    ],
  },
  {
    icon: Search,
    title: "Lost & Found",
    items: [
      "Any items found within the hotel premises will be recorded and stored in our Lost and Found department.",
      "Unclaimed items will be kept for a period of six (6) months, after which they will be discarded if not claimed by the owner.",
    ],
  },
  {
    icon: Users,
    title: "Residential Conference",
    items: [
      "Conference Start Time: 8:00 AM.",
      "Conference Closing Time: 5:00 PM.",
      "Any use of conference facilities beyond the scheduled closing time will attract an additional charge.",
    ],
  },
  {
    icon: Banknote,
    title: "Refund",
    items: [
      "For refund requests, a 30% fee will be applied to the refund amount.",
    ],
  },
  {
    icon: Ban,
    title: "Flying of Drones",
    items: ["Flying of drones is not permitted unless authorized by Management."],
  },
  {
    icon: MessageSquare,
    title: "Suggestions",
    items: [
      "We greatly appreciate your suggestions to improve our performance to deliver excellent service.",
      "E-mail any problems or suggestions directly to mj@mjgrandhotelghana.com or talk to the Management.",
      "Follow us on Instagram @mjgrand_hotel, Facebook MJ Grand, Twitter @MJGRANDHOTEL001, and TikTok @mj.grand.hotel.",
    ],
  },
];

const Policy = () => {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-nav py-4">
        <div className="container mx-auto px-6 lg:px-12 flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-cream/80 hover:text-gold transition-colors duration-300 font-sans text-sm"
          >
            <ChevronLeft size={18} />
            Go back
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.3, 0, 0.2, 1] }}
            className="font-serif text-4xl md:text-5xl text-foreground mb-4"
          >
            MJ Grand Hotel Limited
          </motion.h1>
          <div className="w-20 h-[2px] bg-gold mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-gold mb-6">Guest Policies</h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.3, 0, 0.2, 1] }}
            className="font-sans text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Thank you for choosing to stay at MJ Grand Hotel Ltd. To ensure a safe, comfortable, and well-organized stay for all our guests, please take note of the following policies available at MJ Grand Hotel.
          </motion.p>
        </motion.div>

        <div className="space-y-4">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.3, 0, 0.2, 1] }}
                className="bg-card border border-border rounded-lg p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <Icon size={20} className="text-gold" />
                  </div>
                  <h3 className="font-serif text-xl text-foreground">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex gap-3 font-sans text-sm text-muted-foreground leading-relaxed">
                      <span className="text-gold mt-1 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Closing */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16 py-12 border-t border-border"
        >
          <p className="font-serif text-2xl text-gold mb-2">Thank you!!!</p>
          <p className="font-serif text-lg text-foreground mb-1">You are our Royal guest!!!</p>
          
        </motion.div>
      </div>
    </div>
  );
};

export default Policy;
