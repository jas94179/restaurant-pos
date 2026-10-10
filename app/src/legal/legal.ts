// Terms of Use and Privacy Notice shown at sign-up and in Profile → Terms and privacy.
// Written to match what the app actually does today (everything stays on the phone).
// When the app starts sending anything to the cloud, update the text AND bump the
// version: owners are then asked to accept again.
//
// PLACEHOLDERS: replace the [square brackets] before giving the app to restaurants,
// and have a lawyer review both documents.

export const LEGAL = {
  appName: 'galla',
  provider: 'galla, run by [Your full name]', // who offers the app
  contactEmail: 'support@galla.example', // dummy for now
  grievanceOfficer: '[Your full name]',
  city: '[Your city]',
  effectiveDate: '10 October 2026',
  termsVersion: '2026-10-10',
  privacyVersion: '2026-10-10',
};

export type LegalSection = { heading: string; body: string[]; bullets?: string[] };
export type LegalDoc = { title: string; intro: string; sections: LegalSection[]; hindiSummary?: string[] };

const L = LEGAL;

export const KEY_POINTS = [
  'Your data is yours. Everything you enter stays on this phone.',
  'galla does not receive your sales, bills, menu, staff or customers’ details.',
  'No ads, no tracking, and we never sell data.',
  'The trial is free. Nothing is charged automatically.',
  'You are responsible for correct prices, GST and licences on your bills.',
];

export const TERMS: LegalDoc = {
  title: 'Terms of Use',
  intro: `These terms are an agreement between your restaurant business ("you") and ${L.provider} ("we", "us"). Effective ${L.effectiveDate}. Please read them. By tapping "Agree and continue" you accept them on behalf of your business.`,
  sections: [
    {
      heading: '1. What galla is',
      body: [
        'galla is a billing app for restaurants. It helps you make bills, run tables and kitchen slips, record expenses, close the day, see insights and export reports. It works on your phone, even without internet.',
      ],
    },
    {
      heading: '2. Who can accept',
      body: ['You confirm that you are 18 or older and that you are the owner of the restaurant or are allowed to accept these terms for it.'],
    },
    {
      heading: '3. The free trial',
      body: [
        'During the trial, galla is free. Features may change while we improve the app.',
        'Before the trial ends we will tell you at least 15 days in advance. Paid plans start only if you choose one. Nothing is charged automatically.',
      ],
    },
    {
      heading: '4. Your data belongs to you',
      body: [
        'Everything you enter (menu, bills, staff, expenses, closings) belongs to you. It is stored on your phone. We do not receive it unless you choose to share it with us, for example by sending a backup file for help.',
        'You can export your data at any time (Profile: Backup, and Export sales for CA). How we handle information is explained in the Privacy Notice.',
      ],
    },
    {
      heading: '5. Your responsibilities',
      body: ['You are responsible for:'],
      bullets: [
        'Correct item prices, GST rate, GSTIN, FSSAI number and other details on your bills.',
        'Filing your taxes and keeping the licences your business needs.',
        'Checking bills before giving them to customers.',
        'Keeping PINs secret, giving each staff member their own PIN, and removing staff who leave.',
        'Taking regular backups and keeping backup files private. If the phone is lost or broken without a backup, bills cannot be recovered.',
        'Keeping a screen lock on the phone.',
        'Sending a WhatsApp bill to a customer only when they ask for it or agree to it.',
      ],
    },
    {
      heading: '6. Not tax or legal advice',
      body: [
        'galla is a tool. Its GST and invoice features follow common rules in India, but they are not tax, legal or accounting advice. Please confirm your GST setup, invoice format and filings with your Chartered Accountant.',
      ],
    },
    {
      heading: '7. Honest records',
      body: [
        'galla is designed to keep honest records: invoice numbers run in order, and cancelled bills and removed expenses stay visible with who did it and why. You must not use galla, or try to change its data, to hide sales, avoid tax or mislead anyone.',
      ],
    },
    {
      heading: '8. What you must not do',
      bullets: [
        'Copy, sell, rent or share the app, or try to take it apart or change how it works.',
        'Use galla for anything illegal.',
        'Try to get into another restaurant’s data.',
      ],
      body: [],
    },
    {
      heading: '9. The app is provided "as is"',
      body: [
        'We work hard to keep galla reliable, but trial software can have mistakes. We do not promise it will always work without errors, or with every phone or printer. We will try to fix problems you report within a reasonable time. Please keep a simple fallback (for example a paper bill book) for emergencies.',
      ],
    },
    {
      heading: '10. Limits of our responsibility',
      body: [
        'As far as the law allows, we are not responsible for indirect losses, lost profit or business, tax penalties caused by incorrect setup, or data lost because no backup was taken. Our total responsibility for any claim will not be more than the amount you paid us in the 3 months before the claim (during the free trial, that is nothing).',
        'Nothing in these terms removes rights you have under Indian law that cannot be removed by agreement.',
      ],
    },
    {
      heading: '11. Ending',
      body: [
        'You can stop using galla at any time. Export or back up your data first, then uninstall the app.',
        'We may end the trial with 15 days’ notice, or straight away if galla is misused. Your data on your phone stays yours.',
      ],
    },
    {
      heading: '12. Changes to these terms',
      body: ['If we change these terms in an important way, the app will show you the new version and ask you to accept it again.'],
    },
    {
      heading: '13. Law and disputes',
      body: [`These terms follow the laws of India. Disputes will be handled by the courts at ${L.city}. We will always try to sort out any problem with you first, by talking.`],
    },
    {
      heading: '14. Contact',
      body: [`${L.provider}. Email: ${L.contactEmail}`],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  title: 'Privacy Notice',
  intro: `This notice explains what information galla keeps, where it is kept, and your rights. It is offered by ${L.provider}. Effective ${L.effectiveDate}.`,
  sections: [
    {
      heading: '1. The short version',
      body: [],
      bullets: [
        'galla works offline. Everything you enter is stored only on this phone.',
        'We do not receive your sales, bills, menu, staff details or your customers’ details.',
        'We get information only if you choose to send it to us, for example a backup file or a problem report when you ask for help.',
        'No ads. No tracking. We never sell information.',
        'If we ever add cloud features, we will ask your permission in the app first.',
      ],
    },
    {
      heading: '2. What the app keeps on your phone',
      body: ['To work, galla stores on this phone:'],
      bullets: [
        'Restaurant details: name, address, phone, GSTIN, FSSAI number, UPI ID, settings.',
        'Owner and staff: names, roles, and PINs. PINs are stored only in a scrambled form (a "hash") that cannot be read back, not even by us.',
        'Bills: items, prices, GST, discounts with the reason and who approved it, payment method, delivery-app order IDs, cancellations with the reason, and who made each bill.',
        'Kitchen slips, expenses, day closings, and the name of your Bluetooth printer.',
        'Error reports: technical details if the app hits a problem. They stay on the phone unless you choose to send one to us.',
        'The date and version of these terms and this notice when you accepted them.',
      ],
    },
    {
      heading: '3. Your customers’ information',
      body: [
        'When you send a bill on WhatsApp, the customer’s mobile number is used only to open WhatsApp. galla does not save it.',
        'For customer information you collect, your restaurant decides how it is used. Please share bills only with customers who ask for them.',
      ],
    },
    {
      heading: '4. Your staff’s information',
      body: [
        'The owner adds staff names and roles. Please tell your staff that galla records who made each bill, discount, cancellation and day closing. This keeps records fair and protects honest staff.',
      ],
    },
    {
      heading: '5. What we receive, and why',
      body: ['Today the app sends nothing to us on its own. We receive information only when you choose to:'],
      bullets: [
        'Send us a backup file, export or problem report so we can help or restore your data.',
        'Contact us by phone, WhatsApp or email, which gives us your name, number and message.',
        'Request a plan change, which tells us your restaurant name and the plan you want.',
      ],
    },
    {
      heading: '6. How we use what you send',
      body: ['Only to help you, fix problems, restore data, improve galla, and, if you agreed, talk to you about the trial and updates. We do not use it for advertising. We do not sell or rent it. We share it only if the law requires us to.'],
    },
    {
      heading: '7. Phone permissions',
      bullets: [
        'Nearby devices (Bluetooth): only to connect to your receipt printer.',
        'Files and sharing: only when you choose to save a backup or export, or restore a backup.',
        'Network status: only to show whether you are offline. Billing works without internet.',
        'galla does not use your location, contacts, camera or microphone.',
      ],
      body: [],
    },
    {
      heading: '8. Security',
      bullets: [
        'The app opens only with a PIN, and each person has their own.',
        'In the installed galla app, the data on the phone is stored encrypted.',
        'Backup and export files you create are not encrypted. Keep them private, for example in your own Google Drive or WhatsApp chat with yourself.',
        'Please keep a screen lock on the phone.',
      ],
      body: [],
    },
    {
      heading: '9. How long information is kept',
      body: [
        'Data on your phone stays until you delete it or uninstall the app. Backups you make stay wherever you saved them.',
        'Anything you send us for help is kept only as long as needed to help you, and deleted within 90 days, unless you ask us to keep it or the law requires us to.',
      ],
    },
    {
      heading: '10. Your rights',
      body: ['Under India’s Digital Personal Data Protection Act, 2023, you can:'],
      bullets: [
        'Ask what personal information we hold about you, and get a summary.',
        'Ask us to correct, complete or update it.',
        'Ask us to delete it.',
        'Withdraw your permission at any time. It is as easy as giving it, and it does not affect what was done before.',
        'Nominate someone to use these rights for you if you are unable to.',
        'Raise a complaint with us, and if you are not satisfied, with the Data Protection Board of India.',
      ],
    },
    {
      heading: '11. Contact and complaints',
      body: [
        `Grievance contact: ${L.grievanceOfficer}, ${L.provider}. Email: ${L.contactEmail}. We will reply as soon as possible and within the time the law requires.`,
      ],
    },
    {
      heading: '12. Children',
      body: ['galla is meant for businesses and is not meant for anyone under 18.'],
    },
    {
      heading: '13. If galla changes',
      body: [
        'If we add features that send information from your phone, such as cloud backup, sign-in with your mobile number or usage statistics, we will update this notice, explain it simply, and ask your permission in the app before anything is sent. Optional sharing will stay off unless you turn it on.',
      ],
    },
  ],
  hindiSummary: [
    'आपका डेटा आपका है। आप जो भी डालते हैं, वह सिर्फ़ इसी फ़ोन में रहता है।',
    'galla को आपकी बिक्री, बिल, मेन्यू, स्टाफ़ या ग्राहकों की जानकारी नहीं मिलती।',
    'हमें जानकारी तभी मिलती है जब आप ख़ुद भेजें, जैसे मदद के लिए बैकअप फ़ाइल।',
    'कोई विज्ञापन नहीं, कोई ट्रैकिंग नहीं, और हम कभी डेटा नहीं बेचते।',
    'ग्राहक का मोबाइल नंबर सिर्फ़ WhatsApp बिल भेजने के लिए उपयोग होता है, सेव नहीं होता।',
    'बिल पर सही दाम, GST और लाइसेंस नंबर की ज़िम्मेदारी आपकी है।',
    'आप कभी भी अपनी जानकारी देखने, सुधारने या हटाने के लिए कह सकते हैं।',
  ],
};

export type Acceptance = {
  terms: string; // version accepted
  privacy: string;
  at: string; // ISO time
  by: string; // owner name (filled in after setup)
  contactOk: boolean; // optional: may we contact them about the trial
};

export function parseAcceptance(raw: string): Acceptance | null {
  try {
    const a = JSON.parse(raw) as Acceptance;
    return a && typeof a.terms === 'string' ? a : null;
  } catch {
    return null;
  }
}

export function isCurrent(a: Acceptance | null): boolean {
  return !!a && a.terms === LEGAL.termsVersion && a.privacy === LEGAL.privacyVersion;
}
