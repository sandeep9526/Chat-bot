export interface IndustryTemplate {
  id: string;
  name: string;
  icon: string;
  botName: string;
  accent: string;
  welcome: string;
  suggestions: string[];
  websiteUrl: string;
  description: string;
  knowledgeText: string;
  logo?: string;
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "salon",
    name: "Salon & Spa",
    icon: "💇‍♀️",
    botName: "Glow Salon & Spa AI",
    accent: "#ec4899",
    welcome: "Welcome to Glow Salon & Spa! Looking for haircut prices, facial packages, or appointment timings?",
    suggestions: [
      "What are your haircut & styling prices?",
      "Do you take walk-in appointments?",
      "Are you open on Sundays?",
    ],
    websiteUrl: "https://glowsalon.com",
    description: "Beauty salon, haircut pricing, spa treatments & appointments",
    logo: "💇‍♀️",
    knowledgeText: `Glow Salon & Spa Overview:
Glow Salon & Spa is a premium hair and beauty studio offering haircuts, coloring, bridal makeup, facials, and massage therapies.

Services & Pricing:
- Women's Haircut & Blowdry: $45
- Men's Precision Haircut: $30
- Full Hair Highlights / Balayage: $120
- Organic Glow Facial: $65 (60 mins)
- Swedish Full Body Massage: $85 (60 mins)
- Express Manicure & Pedicure Combo: $50

Operating Hours & Timings:
- Monday to Saturday: 10:00 AM – 8:00 PM
- Sunday: 11:00 AM – 5:00 PM (Prior appointments required)

Appointments & Walk-ins:
Walk-ins are welcome, but prior booking is recommended for weekend slots.
Cancellations must be made at least 24 hours in advance.

Location: 124 Beauty Boulevard, Suite 3, Downtown. Contact: (555) 234-5678.`,
  },
  {
    id: "prepvia",
    name: "E-Com Prep Center",
    icon: "📦",
    botName: "SmartPrep Hub AI",
    accent: "#f59e0b",
    welcome: "Welcome to SmartPrep Hub! Need info on item labeling, polybagging, 35-hr turnaround SLA, or custom pricing?",
    suggestions: [
      "What prep services does SmartPrep offer?",
      "How fast is the 35-hour turnaround SLA?",
      "Does SmartPrep integrate with seller APIs?",
    ],
    websiteUrl: "https://smartprephub.com",
    description: "E-commerce prep center, 35-hr SLA, labeling, polybagging & inventory sync",
    logo: "📦",
    knowledgeText: `SmartPrep Fulfillment & Prep Center Overview:
SmartPrep is a leading e-commerce prep and fulfillment service provider. We handle inspection, barcode labeling, polybagging, bundling, and shipping directly to fulfillment centers.

Core Services & Fees:
- Item Barcode Labeling: $0.30 per unit
- Suffocation Warning Polybagging: $0.45 per unit
- 2-Pack / Multi-pack Bundling: $0.65 per bundle
- Box Forwarding / Pallet Prep: $15 per pallet
- Storage Fees: Free for the first 14 days, then $0.45 per cu ft/month.

Speed SLA & Turnaround Guarantee:
All standard inventory shipments received before 2:00 PM are prepped and shipped out within our 35-hour SLA guarantee.

Software & API Integration:
SmartPrep syncs automatically with leading inventory management platforms, seller dashboards, and custom APIs for real-time inventory tracking and shipment updates.`,
  },
  {
    id: "clinic",
    name: "Health Clinic",
    icon: "🩺",
    botName: "Wellness Clinic Assistant",
    accent: "#0d9488",
    welcome: "Hello! Welcome to Wellness Health & Dental Clinic. How can I assist with doctor appointments or health services?",
    suggestions: [
      "How do I book a doctor appointment?",
      "What are your consultation timings?",
      "Do you accept health insurance?",
    ],
    websiteUrl: "https://wellnessclinic.com",
    description: "Doctor consultations, OPD timings, dental checkups & insurance",
    logo: "🩺",
    knowledgeText: `Wellness Health & Dental Clinic Overview:
Wellness Clinic provides general physician consultations, dental care, cardiology, pediatrics, and diagnostic laboratory testing.

Consultations & Fee Structure:
- General Physician OPD Consultation: $50
- Dental Checkup & Cleaning: $80
- Full Body Blood Test Panel: $95
- Pediatrician Consultation: $60

OPD & Doctor Timings:
- Morning Session: 9:00 AM – 1:00 PM (Monday to Saturday)
- Evening Session: 4:00 PM – 8:00 PM (Monday to Saturday)
- Emergency & Casualty: 24/7 Open

Insurance Partners Accepted:
We accept major health insurance providers and medical coverage plans for eligible procedures.

Appointment Booking:
Appointments can be booked online or via phone at (555) 987-6543. Emergency walk-ins are prioritized.`,
  },
  {
    id: "realestate",
    name: "Real Estate",
    icon: "🏠",
    botName: "Prime Realty Advisor",
    accent: "#2563eb",
    welcome: "Welcome to Prime Realty! Looking to buy, rent, or schedule a property walkthrough?",
    suggestions: [
      "What properties are available for sale?",
      "Can I schedule a home viewing?",
      "What is the average price per sq ft?",
    ],
    websiteUrl: "https://primerealty.com",
    description: "Property listings, site visits, home loans & villa prices",
    logo: "🏠",
    knowledgeText: `Prime Realty Group Overview:
Prime Realty is a premier real estate brokerage specializing in luxury residential apartments, gated community villas, and commercial retail spaces.

Featured Property Portfolio:
- Skyline Towers: 2BHK Luxury Apartments starting at $280,000 (1,150 sq ft)
- The Grand Villas: 4BHK Independent Gated Villas starting at $650,000 (3,200 sq ft)
- Metro Plaza: Commercial Office Spaces starting at $190/sq ft.

Site Visits & Walkthroughs:
Guided site visits are available Monday through Sunday from 10:00 AM to 6:00 PM. Transportation is provided upon request.

Financial Assistance & Loans:
We offer pre-approved home loans with partner financial institutions (interest rates starting at 6.5% p.a.). All properties are fully registered.`,
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    icon: "🛍️",
    botName: "UrbanStyle Assistant",
    accent: "#8b5cf6",
    welcome: "Hi there! Welcome to UrbanStyle Fashion. Need help with orders, sizing, or return policies?",
    suggestions: [
      "What is your return & exchange policy?",
      "How long does delivery take?",
      "Do you offer free shipping?",
    ],
    websiteUrl: "https://urbanstyle.com",
    description: "Order tracking, 7-day returns, shipping rates & payment options",
    logo: "🛍️",
    knowledgeText: `UrbanStyle Fashion Store Overview:
UrbanStyle is an online fashion store offering trendsetting clothing, denim, footwear, and lifestyle accessories.

Shipping & Delivery Policy:
- Free Express Shipping on all orders above $50.
- Standard Delivery: 3 to 5 business days ($4.99 for orders under $50).
- Same-Day Metro Delivery available in select cities.

Returns & Exchanges:
We offer a 7-day hassle-free return and exchange policy. Items must be unworn with original tags attached. Return shipping is completely free.

Payment Methods:
We accept Credit/Debit Cards, Digital Wallets, Buy-Now-Pay-Later services, and Cash on Delivery (COD).`,
  },
  {
    id: "restaurant",
    name: "Restaurant & Cafe",
    icon: "🍕",
    botName: "Bella Italia Host AI",
    accent: "#e11d48",
    welcome: "Benvenuti! Welcome to Bella Italia. Looking for our food menu, table reservations, or delivery?",
    suggestions: [
      "What are your popular menu dishes?",
      "How do I reserve a table for tonight?",
      "Do you offer vegan or gluten-free options?",
    ],
    websiteUrl: "https://bellaitalia.com",
    description: "Food menu, table reservations, opening hours & delivery",
    logo: "🍕",
    knowledgeText: `Bella Italia Cafe & Trattoria Overview:
Bella Italia is an authentic Italian restaurant known for wood-fired pizzas, handmade pastas, fresh gelato, and fine wines.

Popular Menu Highlights:
- Margherita DOC Wood-fired Pizza: $15
- Truffle Mushroom Fettuccine Pasta: $18
- Tiramisu Traditional Dessert: $8
- Vegan & Gluten-Free Pasta/Pizza options available upon request.

Opening Hours & Reservations:
- Open Daily: 11:30 AM – 11:00 PM
- Table Reservations: Recommended for weekend dining (7:00 PM – 10:00 PM).

Home Delivery & Takeout:
Available via major food delivery platforms or direct phone orders at (555) 777-3434. Free delivery on orders over $35.`,
  },
  {
    id: "techsaas",
    name: "Tech SaaS",
    icon: "💻",
    botName: "CloudFlow Support AI",
    accent: "#0284c7",
    welcome: "Welcome to CloudFlow! Have questions about our cloud automation, API pricing, or 14-day free trial?",
    suggestions: [
      "What features are included in CloudFlow?",
      "What are the subscription pricing tiers?",
      "How do I start a 14-day free trial?",
    ],
    websiteUrl: "https://cloudflow.io",
    description: "Cloud automation platform, API access, tiers & 14-day trial",
    logo: "💻",
    knowledgeText: `CloudFlow SaaS Automation Platform Overview:
CloudFlow is a cloud backup, workflow automation, and developer API platform designed for modern tech teams.

Subscription Pricing Tiers:
- Starter Plan: $29/month (Includes 100 GB storage, 5 workflows, email support)
- Pro Plan: $79/month (Includes 1 TB storage, unlimited workflows, priority support)
- Enterprise Plan: Custom pricing (Dedicated server instance, SLA uptime guarantee, SSO).

Free Trial:
All plans come with a 14-day full feature free trial. No credit card required to get started.

Integrations:
Syncs with major developer tools, cloud storage services, and webhooks out of the box.`,
  },
  {
    id: "education",
    name: "Coaching & Academy",
    icon: "🎓",
    botName: "Peak Academy Advisor",
    accent: "#10b981",
    welcome: "Welcome to Peak Academy! Have questions about coding bootcamps, batch timings, or fee structure?",
    suggestions: [
      "What courses are currently open?",
      "What is the fee structure & schedule?",
      "Do you offer job placement support?",
    ],
    websiteUrl: "https://peakacademy.org",
    description: "Coding bootcamps, course fees, batch schedules & job placement",
    logo: "🎓",
    knowledgeText: `Peak Academy Coaching & Bootcamps Overview:
Peak Academy is an elite training institute offering Full-Stack Web Development, Data Science, and AI Engineering courses.

Course Offerings & Fees:
- Full-Stack Web Dev Bootcamp (12 Weeks): $1,200
- Data Science & Machine Learning (16 Weeks): $1,500
- AI & LLM Engineering Track (8 Weeks): $950

Batch Schedules:
- Weekday Intensive: Mon-Fri 9:00 AM – 1:00 PM
- Weekend Professional: Sat-Sun 10:00 AM – 4:00 PM

Career Support & Placement:
Includes resume reviews, mock interviews, and 100% job placement assistance with partner tech companies.`,
  },
];

